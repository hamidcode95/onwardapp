import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  type: "shred_task" | "suggest_activity" | "chat" | "decide";
  payload: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, payload } = (await req.json()) as RequestBody;

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "shred_task":
        // Task Shredder: Break down big tasks into sub-tasks
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

      case "suggest_activity":
        // Mind Scanner: Suggest activities based on energy level
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

      case "chat":
        // Chat with Oly: Friendly companion chat
        systemPrompt = `You are Oly, a friendly and supportive ADHD companion. You're warm, encouraging, and understanding of ADHD struggles.

Personality traits:
- Supportive and validating
- Uses gentle humor
- Gives practical, bite-sized advice
- Never judgmental about struggles
- Celebrates small wins
- Uses occasional emojis 🌟

Keep responses short (2-3 sentences max) unless asked for more detail.`;
        userPrompt = payload.message as string;
        break;

      case "decide":
        // Decision Maker: Help pick from options
        systemPrompt = `You are a playful decision-making helper. The user has options and can't decide. Your job is to pick one for them and give a fun, encouraging reason.

Respond with a JSON object:
{
  "choice": "The exact option text you chose",
  "reason": "A fun, encouraging 1-sentence reason"
}

Be playful and positive!`;
        const options = payload.options as { text: string; priority: number }[];
        const optionsList = options.map((o, i) => `${i + 1}. ${o.text} (priority: ${o.priority}/3)`).join("\n");
        userPrompt = `Help me decide between these options:\n${optionsList}`;
        break;

      default:
        throw new Error(`Unknown request type: ${type}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse response based on type
    let result: unknown;
    try {
      if (type === "chat") {
        result = { message: content };
      } else {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = content;
        }
      }
    } catch {
      result = content;
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
