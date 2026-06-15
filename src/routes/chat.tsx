import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { BrandMark } from "@/components/brand-mark";
import { clearChat } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Worksmith AI" },
      { name: "description", content: "Chat with your AI workplace productivity assistant." },
    ],
  }),
  component: ChatPage,
});

function loadHistory(): Promise<UIMessage[]> {
  return supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .order("created_at", { ascending: true })
    .then(({ data }) => {
      if (!data) return [];
      return data.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text", text: m.content }],
      })) as UIMessage[];
    });
}

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const qc = useQueryClient();
  const clearFn = useServerFn(clearChat);

  useEffect(() => {
    loadHistory().then(setInitial);
  }, []);

  if (!initial) {
    return (
      <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl items-center justify-center p-4">
        <Shimmer>Loading conversation…</Shimmer>
      </div>
    );
  }

  return <ChatInner initial={initial} onClear={async () => {
    await clearFn();
    qc.invalidateQueries();
    setInitial([]);
    toast.success("Conversation cleared");
  }} />;
}

function ChatInner({ initial, onClear }: { initial: UIMessage[]; onClear: () => void }) {
  const [resetKey, setResetKey] = useState(0);
  const { messages, sendMessage, status } = useChat({
    id: `convo-${resetKey}`,
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "Chat error"),
  });
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, [status]);

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = msg.text?.trim();
    if (!text) return;
    sendMessage({ text });
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col p-4 sm:p-6">
      <PageHeader
        title="AI Chatbot"
        description="Your workplace assistant — ask anything productivity-related."
        actions={
          <Button variant="outline" size="sm" onClick={() => { onClear(); setResetKey((k) => k + 1); }} disabled={messages.length === 0}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Clear
          </Button>
        }
      />
      <div className="flex flex-1 min-h-0 flex-col rounded-2xl border bg-card shadow-sm">
        <Conversation className="flex-1 min-h-0">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<BrandMark className="h-12 w-12" />}
                title="How can I help today?"
                description="Ask about scheduling, drafting, research, or workplace strategy."
              />
            ) : (
              messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <Message key={m.id} from={m.role === "user" ? "user" : "assistant"}>
                    {m.role === "assistant" ? (
                      <div className="flex max-w-[85%] flex-col gap-1">
                        <MessageResponse>{text}</MessageResponse>
                        <span className="px-1 text-[10px] text-muted-foreground">{ts}</span>
                      </div>
                    ) : (
                      <div className="flex max-w-[85%] flex-col items-end gap-1">
                        <MessageContent>{text}</MessageContent>
                        <span className="px-1 text-[10px] text-muted-foreground">{ts}</span>
                      </div>
                    )}
                  </Message>
                );
              })
            )}
            {status === "submitted" && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Thinking…</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="border-t p-3">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea ref={taRef} placeholder="Ask Worksmith AI…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={isLoading} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            AI-generated content may contain inaccuracies. Verify before acting on it.
          </p>
        </div>
      </div>
    </div>
  );
}
