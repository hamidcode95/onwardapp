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

// ---------------------------------------------------------------------------
// ADHD Profile context — gives every AI operation awareness of the user's
// self-reported challenge profile, sourced ONLY from the authenticated
// caller's own row (RLS on user_adhd_profiles enforces this; the frontend
// never gets to hand the backend a profile/scores directly).
// ---------------------------------------------------------------------------

interface ADHDProfileRow {
  attention_score: number;
  executive_function_score: number;
  task_management_score: number;
  hyperactivity_score: number;
  impulsivity_score: number;
  emotional_regulation_score: number;
}

const HIGH_CHALLENGE_THRESHOLD = 7;

const DIMENSION_HINTS: Record<keyof ADHDProfileRow, string> = {
  attention_score:
    "Attention: favor Focus Room, shorter focus intervals, reducing distractions, one-task-at-a-time framing.",
  executive_function_score:
    "Executive Function: favor Task Shredder, simple prioritization, fewer simultaneous tasks.",
  task_management_score:
    "Task Initiation & Completion: favor breaking things into a tiny first action (\"just start for 2 minutes\"), Task Shredder, short Focus Room sessions.",
  hyperactivity_score:
    "Hyperactivity & Restlessness: favor shorter focus blocks, movement breaks, active transitions; avoid long static sessions.",
  impulsivity_score:
    "Impulsivity: favor Decision Maker, encouraging a short pause before acting on a decision.",
  emotional_regulation_score:
    "Emotional Regulation: favor supportive, non-judgmental language; suggest Brain Dump or just being a reflective space before jumping to productivity tactics.",
};

/**
 * Fetches the authenticated user's profile using their own JWT-scoped
 * client (never the frontend's payload), so RLS is what actually
 * guarantees user A can never see user B's profile here. Returns null if
 * the user hasn't completed the Journey yet — callers should degrade
 * gracefully, not require it.
 */
async function fetchUserProfile(
  supabaseClient: ReturnType<typeof createClient>,
): Promise<ADHDProfileRow | null> {
  const { data, error } = await supabaseClient
    .from("user_adhd_profiles")
    .select(
      "attention_score, executive_function_score, task_management_score, hyperactivity_score, impulsivity_score, emotional_regulation_score",
    )
    .maybeSingle();

  if (error || !data) return null;
  return data as ADHDProfileRow;
}

/**
 * Renders the profile into a system-prompt block. Scores are given plainly
 * (per-dimension "1-10, higher = more reported difficulty, self-reported,
 * not a diagnosis") plus a couple of concrete hints for whichever
 * dimensions are high — the model is instructed to let this shape its
 * suggestions naturally rather than narrating the numbers back to the user.
 */
function buildProfileContext(profile: ADHDProfileRow | null): string {
  if (!profile) return "";

  const lines = [
    `Attention: ${profile.attention_score}/10`,
    `Executive Function: ${profile.executive_function_score}/10`,
    `Task Initiation & Completion: ${profile.task_management_score}/10`,
    `Hyperactivity & Restlessness: ${profile.hyperactivity_score}/10`,
    `Impulsivity: ${profile.impulsivity_score}/10`,
    `Emotional Regulation: ${profile.emotional_regulation_score}/10`,
  ];

  const hints = (Object.keys(DIMENSION_HINTS) as (keyof ADHDProfileRow)[])
    .filter((key) => profile[key] >= HIGH_CHALLENGE_THRESHOLD)
    .map((key) => `- ${DIMENSION_HINTS[key]}`);

  return `

USER ADHD PROFILE (self-reported personalization scores, NOT a diagnosis — higher means greater reported difficulty in that area):
${lines.join("\n")}

How to use this: let it shape your suggestions naturally and combine dimensions when relevant (e.g. high Attention + high Task Initiation might mean suggesting Task Shredder for the smallest next action, then a short Focus Room session). Do NOT mention the numbers, the word "score", or phrases like "because your profile shows..." to the user — just let the recommendations reflect it.${
    hints.length > 0 ? `\n\nRelevant for this user:\n${hints.join("\n")}` : ""
  }`;
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

    // Fetched once per request, from the authenticated caller's own row —
    // reused for whichever operation type this request is.
    const profile = await fetchUserProfile(supabaseClient);
    const profileContext = buildProfileContext(profile);

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
Example: ["Research topic for 10 minutes", "Write first paragraph", "Take a 2-minute break"]` + profileContext;
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
}` + profileContext;
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

Keep responses short (2-3 sentences max) unless asked for more detail.` + profileContext;
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

Be playful and positive!` + profileContext;
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
