import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are an AI Workplace Productivity Assistant.

You help busy professionals with:
- Productivity coaching and planning
- Scheduling and time management
- Workplace research and analysis
- Professional communication and writing

Respond clearly, professionally, and concisely. Use markdown formatting (headings, lists, bold) when it improves clarity. Keep answers practical and actionable.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Persist last user message
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          const text = lastUser.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim();
          if (text) await supabaseAdmin.from("chat_messages").insert({ role: "user", content: text });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            const lastAssistant = [...finalMessages].reverse().find((m) => m.role === "assistant");
            if (!lastAssistant) return;
            const text = lastAssistant.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("")
              .trim();
            if (text) {
              await supabaseAdmin.from("chat_messages").insert({ role: "assistant", content: text });
            }
          },
        });
      },
    },
  },
});
