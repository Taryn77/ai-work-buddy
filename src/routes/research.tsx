import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { researchTopic } from "@/lib/ai.functions";
import { PageHeader } from "@/components/page-header";
import { AiOutputCard } from "@/components/ai-output-card";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — Worksmith AI" },
      { name: "description", content: "Get business-relevant insights, recommendations, and trends on any workplace topic." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const qc = useQueryClient();
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [text, setText] = useState("");

  const mut = useMutation({
    mutationFn: () => fn({ data: { topic, context: context || undefined } }),
    onSuccess: (r) => {
      setText(r.text);
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Research failed"),
  });

  const canSubmit = topic.trim().length >= 2 && !mut.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="AI Research Assistant" description="Quick, structured insights on any workplace topic." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" placeholder="e.g. Hybrid work productivity in 2026" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="context">Reference article or notes (optional)</Label>
              <Textarea id="context" placeholder="Paste source material if available…" value={context} onChange={(e) => setContext(e.target.value)} className="min-h-[220px] font-mono text-sm" />
            </div>
            <Button className="w-full" onClick={() => mut.mutate()} disabled={!canSubmit}>
              {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Run research
            </Button>
          </CardContent>
        </Card>
        <AiOutputCard
          title="Research report"
          text={text}
          isLoading={mut.isPending}
          onRegenerate={canSubmit || text ? () => mut.mutate() : undefined}
          onChange={setText}
        />
      </div>
    </div>
  );
}
