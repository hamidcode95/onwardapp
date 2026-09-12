import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  type: "shred_task" | "suggest_activity" | "chat" | "decide";
  payload: Record<string, unknown>;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Provider abstraction
// ---------------------------------------------------------------------------
// Business logic below (the request-type switch) only ever calls callAI().
// It has no idea which provider or model actually serves the request — to
// add a new provider later, add a case in callAI() and nothing else in this
// file needs to change.

class AIProviderError extends Error {
  status: number;
  clientMessage: string;
  constructor(message: string, status: number, clientMessage: string) {
    super(message);
    this.status = status;
    this.clientMessage = clientMessage;
  }
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  apiKey: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional, OpenRouter-recommended headers for attribution on
        // their leaderboards — harmless if OpenRouter ignores them.
        "HTTP-Referer": "https://onwardapp.ir",
        "X-Title": "Onward",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    console.error("OpenRouter network error:", err);
    throw new AIProviderError(
      "network_error",
      504,
      "AI service is unreachable right now. Please try again in a moment.",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    // Never forward the raw provider error body to the client — log it
    // server-side for debugging, return a clean generic message instead.
    const bodyText = await response.text().catch(() => "");
    console.error("OpenRouter error:", response.status, bodyText.slice(0, 1000));

    if (response.status === 401 || response.status === 403) {
      throw new AIProviderError(
        `auth_error_${response.status}`,
        500,
        "AI service is misconfigured. Please contact support.",
      );
    }
    if (response.status === 429) {
      throw new AIProviderError(
        "rate_limited",
        429,
        "AI service is temporarily busy. Please try again in a moment.",
      );
    }
    if (response.status >= 500) {
      throw new AIProviderError(
        `upstream_${response.status}`,
        502,
        "AI service is temporarily unavailable. Please try again shortly.",
      );
    }
    throw new AIProviderError(
      `unexpected_${response.status}`,
      502,
      "AI service returned an unexpected error. Please try again.",
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    console.error("OpenRouter returned no usable content:", JSON.stringify(data).slice(0, 500));
    throw new AIProviderError(
      "empty_response",
      502,
      "AI service returned an empty response. Please try again.",
    );
  }
  return content;
}

/**
 * Single entry point business logic uses to talk to "the AI", regardless of
 * provider. Configured via AI_PROVIDER / AI_MODEL secrets so a future
 * provider swap or model change never touches the code below this section.
 */
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = Deno.env.get("AI_PROVIDER") ?? "openrouter";

  switch (provider) {
    case "openrouter": {
      const apiKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!apiKey) {
        throw new AIProviderError(
          "missing_api_key",
          500,
          "AI service is not configured yet. Please contact support.",
        );
      }
      const model = Deno.env.get("AI_MODEL") ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
      return callOpenRouter(systemPrompt, userPrompt, model, apiKey);
    }
    default:
      throw new AIProviderError(
        `unknown_provider_${provider}`,
        500,
        "AI service is misconfigured. Please contact support.",
      );
  }
}

// ---------------------------------------------------------------------------
// Defensive response parsing — never trust raw model output for structured
// operations. Each validator returns null (not a throw) on anything that
// doesn't match the expected shape, so callers can produce one consistent
// "couldn't understand the AI" error rather than crashing.
// ---------------------------------------------------------------------------

function extractJson(content: string): unknown {
  const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function validateShredTask(parsed: unknown): string[] | null {
  if (!Array.isArray(parsed)) return null;
  const items = parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  return items.length > 0 ? items : null;
}

function validateSuggestActivity(
  parsed: unknown,
): { suggestion: string; reason: string; emoji: string } | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.suggestion !== "string" || typeof p.reason !== "string" || typeof p.emoji !== "string") {
    return null;
  }
  return { suggestion: p.suggestion, reason: p.reason, emoji: p.emoji };
}

function validateDecide(parsed: unknown): { choice: string; reason: string } | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (typeof p.choice !== "string" || typeof p.reason !== "string") return null;
  return { choice: p.choice, reason: p.reason };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user (unchanged from before this migration)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }
    const { type, payload } = body;

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "shred_task": {
        if (typeof payload?.task !== "string" || payload.task.trim().length === 0) {
          return jsonResponse({ error: "A task description is required" }, 400);
        }
        systemPrompt = `You are an ADHD-friendly task breakdown assistant. Your job is to take a large, overwhelming task and break it into small, actionable sub-tasks.

Rules:
- Create 3-7 sub-tasks maximum
- Each sub-task should be simple and completable in 5-15 minutes
- Use clear, action-oriented language
- Start each sub-task with a verb
- Make tasks specific, not vague
- Consider the ADHD brain - avoid overwhelming complexity

Respond ONLY with a JSON array of sub-task strings. No explanations.
Example: ["Research topic for 10 minutes", "Write first paragraph", "Take a 2-minute break"]`;
        userPrompt = `Break down this task into small, manageable sub-tasks: "${payload.task}"`;
        break;
      }

      case "suggest_activity": {
        if (typeof payload?.energyLevel !== "number") {
          return jsonResponse({ error: "A numeric energyLevel is required" }, 400);
        }
        systemPrompt = `You are an ADHD coach helping someone choose the right activity based on their current energy level.

Energy levels:
- 0-30%: Very low energy, need rest or extremely easy tasks
- 31-50%: Low energy, simple tasks that don't require much focus
- 51-70%: Moderate energy, can handle regular tasks
- 71-85%: Good energy, great for challenging work
- 86-100%: High energy, perfect for difficult or creative tasks

Respond with a JSON object containing:
{
  "suggestion": "A specific activity recommendation",
  "reason": "Brief explanation why this matches their energy",
  "emoji": "A relevant emoji"
}`;
        userPrompt = `My current energy level is ${payload.energyLevel}%. What activity should I do right now?`;
        break;
      }

      case "chat": {
        if (typeof payload?.message !== "string" || payload.message.trim().length === 0) {
          return jsonResponse({ error: "A message is required" }, 400);
        }
        systemPrompt = `You are Oly, a friendly and supportive ADHD companion. You're warm, encouraging, and understanding of ADHD struggles.

Personality traits:
- Supportive and validating
- Uses gentle humor
- Gives practical, bite-sized advice
- Never judgmental about struggles
- Celebrates small wins
- Uses occasional emojis 🌟

Keep responses short (2-3 sentences max) unless asked for more detail.`;
        userPrompt = payload.message;
        break;
      }

      case "decide": {
        const options = payload?.options;
        if (
          !Array.isArray(options) ||
          options.length === 0 ||
          !options.every((o) => o && typeof o === "object" && typeof (o as { text?: unknown }).text === "string")
        ) {
          return jsonResponse({ error: "A non-empty list of options is required" }, 400);
        }
        systemPrompt = `You are a playful decision-making helper. The user has options and can't decide. Your job is to pick one for them and give a fun, encouraging reason.

Respond with a JSON object:
{
  "choice": "The exact option text you chose",
  "reason": "A fun, encouraging 1-sentence reason"
}

Be playful and positive!`;
        const optionsList = (options as { text: string; priority?: number }[])
          .map((o, i) => `${i + 1}. ${o.text} (priority: ${o.priority ?? "n/a"}/3)`)
          .join("\n");
        userPrompt = `Help me decide between these options:\n${optionsList}`;
        break;
      }

      default:
        return jsonResponse({ error: "Unsupported request type" }, 400);
    }

    let content: string;
    try {
      content = await callAI(systemPrompt, userPrompt);
    } catch (err) {
      if (err instanceof AIProviderError) {
        return jsonResponse({ error: err.clientMessage }, err.status);
      }
      console.error("Unexpected AI call error:", err);
      return jsonResponse({ error: "Something went wrong talking to the AI service." }, 500);
    }

    let result: unknown;
    switch (type) {
      case "chat": {
        result = { message: content };
        break;
      }
      case "shred_task": {
        const validated = validateShredTask(extractJson(content));
        if (!validated) {
          console.error("shred_task: unparseable model output:", content.slice(0, 500));
          return jsonResponse({ error: "Could not understand the AI's response. Please try again." }, 502);
        }
        result = validated;
        break;
      }
      case "suggest_activity": {
        const validated = validateSuggestActivity(extractJson(content));
        if (!validated) {
          console.error("suggest_activity: unparseable model output:", content.slice(0, 500));
          return jsonResponse({ error: "Could not understand the AI's response. Please try again." }, 502);
        }
        result = validated;
        break;
      }
      case "decide": {
        const validated = validateDecide(extractJson(content));
        if (!validated) {
          console.error("decide: unparseable model output:", content.slice(0, 500));
          return jsonResponse({ error: "Could not understand the AI's response. Please try again." }, 502);
        }
        result = validated;
        break;
      }
    }

    return jsonResponse({ result });
  } catch (error) {
    console.error("Unhandled error:", error);
    return jsonResponse({ error: "Something went wrong. Please try again." }, 500);
  }
});
