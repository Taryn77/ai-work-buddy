import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

async function runModel(system: string, prompt: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
  });
  return text.trim();
}

async function logGeneration(kind: "email" | "summary" | "plan" | "research") {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("generations").insert({ kind });
  } catch (e) {
    console.error("logGeneration failed", e);
  }
}

const EmailInput = z.object({
  recipient: z.string().min(1).max(120),
  subject: z.string().min(1).max(200),
  purpose: z.string().min(1).max(2000),
  tone: z.enum(["Professional", "Casual", "Assertive", "Empathetic"]),
  length: z.enum(["Short", "Medium", "Detailed"]),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const lengthGuide: Record<typeof data.length, string> = {
      Short: "Keep it very brief — use short bullet points where possible. Aim for under 80 words.",
      Medium: "Write a balanced email of roughly 100-180 words in standard paragraph form.",
      Detailed: "Write a thorough, well-structured email of 250-400 words with clear paragraphs and supporting detail.",
    };
    const toneGuide: Record<typeof data.tone, string> = {
      Professional: "polished, business-appropriate, and respectful",
      Casual: "warm, conversational, and approachable",
      Assertive: "direct, confident, and action-oriented without being aggressive",
      Empathetic: "understanding, considerate, and emotionally aware",
    };
    const system = "You are a professional business communication assistant. Write clear, polished emails that match the requested tone and length precisely.";
    const prompt = `Generate an email with the following parameters.\n\nRecipient: ${data.recipient}\nSubject: ${data.subject}\nPurpose: ${data.purpose}\n\nTone: ${data.tone} — ${toneGuide[data.tone]}.\nLength: ${data.length} — ${lengthGuide[data.length]}\n\nWrite a complete email with greeting, body, and sign-off. Return only the email text — no commentary, no subject line prefix.`;
    const text = await runModel(system, prompt);
    await logGeneration("email");
    return { text };
  });


const SummarizeInput = z.object({
  notes: z.string().min(10).max(20000),
});

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummarizeInput.parse(input))
  .handler(async ({ data }) => {
    const system = "You are an expert meeting summarizer. Be concise, structured, and accurate.";
    const prompt = `Summarize the following meeting notes using markdown with these four sections:\n\n## Key Discussion Points\n## Decisions Made\n## Action Items\n## Deadlines\n\nUse bullet points. If a section has no content, write "None noted".\n\nMeeting Notes:\n${data.notes}`;
    const text = await runModel(system, prompt);
    await logGeneration("summary");
    return { text };
  });

const PlannerInput = z.object({
  tasks: z.string().min(3).max(5000),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlannerInput.parse(input))
  .handler(async ({ data }) => {
    const system = "You are a productivity coach who builds realistic, prioritized schedules.";
    const prompt = `Create a productive schedule from the tasks below. Use markdown with these sections:\n\n## Priority Order\n(Numbered list, urgent + important first)\n\n## Suggested Schedule\n(Time-blocked plan with realistic durations)\n\n## Productivity Tips\n(2-3 quick recommendations)\n\nTasks:\n${data.tasks}`;
    const text = await runModel(system, prompt);
    await logGeneration("plan");
    return { text };
  });

const ResearchInput = z.object({
  topic: z.string().min(2).max(500),
  context: z.string().max(10000).optional(),
});

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) => {
    const system = "You are a workplace research analyst. Provide concise, business-relevant insights.";
    const prompt = `Analyze this topic and produce a markdown report with these sections:\n\n## Summary\n## Key Insights\n## Recommendations\n## Important Trends\n\nTopic: ${data.topic}${data.context ? `\n\nAdditional context:\n${data.context}` : ""}`;
    const text = await runModel(system, prompt);
    await logGeneration("research");
    return { text };
  });

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const kinds = ["email", "summary", "plan", "research"] as const;
  const results = await Promise.all(
    kinds.map(async (k) => {
      const { count } = await supabaseAdmin
        .from("generations")
        .select("*", { count: "exact", head: true })
        .eq("kind", k);
      return [k, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(results) as Record<(typeof kinds)[number], number>;
});

export const clearChat = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  return { ok: true };
});
