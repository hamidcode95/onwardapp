// Verifies a user-submitted BscScan/BSC transaction hash represents a real,
// confirmed USDT (BEP20) transfer of the expected amount to Onward's
// receiving wallet, then activates (or extends) that user's subscription.
//
// This talks directly to a public BNB Smart Chain JSON-RPC endpoint and
// decodes the raw transaction receipt/logs itself — no third-party API key,
// no trusting a block-explorer's own interpretation of the transaction.
import { createClient } from "npm:@supabase/supabase-js@2";

// --- Verified constants (see chat for sources) -----------------------------
// USDT (Binance-Peg BSC-USD) contract on BNB Smart Chain. Uses 18 decimals
// (NOT 6, unlike USDT on Ethereum) — getting this wrong silently breaks
// every amount check below.
const USDT_BEP20_CONTRACT = "0x55d398326f99059fF775485246999027B3197955".toLowerCase();
// keccak256("Transfer(address,address,uint256)") — the standard ERC20/BEP20
// Transfer event topic, identical across every token that follows the
// standard, not something specific to USDT.
const TRANSFER_EVENT_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// Onward's receiving wallet, BEP20/BSC network only.
const RECEIVING_WALLET = "0xe0A40666797F83fACfEfB8be0401a76323bF3a56".toLowerCase();

const PLAN_PRICES_USDT: Record<string, bigint> = {
  monthly: 7990000000000000000n, // 7.99 USDT, in 18-decimal base units
  yearly: 79990000000000000000n, // 79.99 USDT
  lifetime: 399990000000000000000n, // 399.99 USDT
};

// Public BSC RPC endpoints — tried in order, so one being rate-limited or
// briefly down doesn't fail the whole verification.
const BSC_RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.defibit.io",
  "https://bsc-dataseed1.ninicoin.io",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface TxReceiptLog {
  address: string;
  topics: string[];
  data: string;
}

interface TxReceipt {
  status: string;
  logs: TxReceiptLog[];
}

async function fetchTransactionReceipt(txHash: string): Promise<TxReceipt | null> {
  let lastError: unknown = null;
  for (const rpcUrl of BSC_RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        lastError = new Error(`RPC HTTP ${response.status}`);
        continue;
      }
      const json = await response.json();
      if (json.error) {
        lastError = new Error(json.error.message ?? "RPC error");
        continue;
      }
      // result is null if the transaction hasn't been mined yet (or the
      // hash is wrong) — that's a valid, expected outcome, not an error.
      return json.result ?? null;
    } catch (err) {
      lastError = err;
    }
  }
  console.error("All BSC RPC endpoints failed:", lastError);
  throw new Error("rpc_unreachable");
}

function findMatchingTransfer(receipt: TxReceipt): { to: string; amount: bigint } | null {
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== USDT_BEP20_CONTRACT) continue;
    if (log.topics[0]?.toLowerCase() !== TRANSFER_EVENT_TOPIC) continue;
    if (log.topics.length < 3) continue;

    const to = `0x${log.topics[2].slice(-40)}`.toLowerCase();
    let amount: bigint;
    try {
      amount = BigInt(log.data);
    } catch {
      continue;
    }
    if (to === RECEIVING_WALLET) {
      return { to, amount };
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Same auth pattern as the other Edge Functions in this project.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    let body: { txHash?: string; plan?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }

    const txHash = body.txHash?.trim().toLowerCase();
    const plan = body.plan;

    if (!txHash || !/^0x[0-9a-f]{64}$/.test(txHash)) {
      return jsonResponse({ error: "That doesn't look like a valid transaction hash." }, 400);
    }
    if (plan !== "monthly" && plan !== "yearly" && plan !== "lifetime") {
      return jsonResponse({ error: "Invalid plan" }, 400);
    }

    // Fail fast, with a clean message, if this exact tx hash already paid
    // for a (possibly different) account — before spending an RPC call on it.
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("method", "crypto")
      .eq("provider_ref", txHash)
      .eq("status", "verified")
      .maybeSingle();
    if (existing) {
      return jsonResponse({ error: "This transaction has already been used." }, 409);
    }

    let receipt: TxReceipt | null;
    try {
      receipt = await fetchTransactionReceipt(txHash);
    } catch {
      return jsonResponse(
        { error: "Couldn't reach the BNB Smart Chain network right now. Please try again shortly." },
        504,
      );
    }

    if (!receipt) {
      return jsonResponse(
        { error: "Transaction not found yet. If you just sent it, wait a minute and try again." },
        404,
      );
    }
    if (receipt.status !== "0x1") {
      return jsonResponse({ error: "That transaction failed on-chain." }, 400);
    }

    const transfer = findMatchingTransfer(receipt);
    if (!transfer) {
      return jsonResponse(
        { error: "This transaction isn't a USDT (BEP20) payment to Onward's wallet." },
        400,
      );
    }

    const expected = PLAN_PRICES_USDT[plan];
    if (transfer.amount < expected) {
      return jsonResponse(
        { error: "The amount sent is less than the price of this plan." },
        400,
      );
    }

    // Record the payment. The unique index on (method, provider_ref) where
    // status='verified' is the real, race-condition-proof guarantee against
    // double-crediting the same tx hash — this insert is expected to fail
    // if two requests for the same hash land at the same time.
    const { error: insertError } = await supabase.from("payments").insert({
      user_id: userId,
      method: "crypto",
      plan,
      amount: Number(transfer.amount) / 1e18,
      currency: "USDT",
      status: "verified",
      provider_ref: txHash,
      verified_at: new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique violation — another request already credited this hash.
        return jsonResponse({ error: "This transaction has already been used." }, 409);
      }
      console.error("Failed to insert payment row:", insertError);
      return jsonResponse({ error: "Something went wrong recording your payment." }, 500);
    }

    const currentPeriodEnd =
      plan === "monthly"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : plan === "yearly"
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null; // lifetime

    const { error: subError } = await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan,
      status: "active",
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    });

    if (subError) {
      console.error("Payment verified but failed to activate subscription:", subError);
      return jsonResponse(
        { error: "Payment verified, but activating your account failed. Please contact support." },
        500,
      );
    }

    return jsonResponse({ result: { plan, currentPeriodEnd } });
  } catch (error) {
    console.error("Unhandled error:", error);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
});
