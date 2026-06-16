import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { summarizeNotes } from "@/lib/ai.functions";
import { PageHeader } from "@/components/page-header";
import { AiOutputCard } from "@/components/ai-output-card";
import { HistoryPanel } from "@/components/history-panel";
import { useLocalHistory } from "@/hooks/use-local-history";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  extractActionItems,
  PLANNER_PREFILL_KEY,
} from "@/lib/extract-action-items";

export const Route = createFileRoute("/summarize")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — Worksmith AI" },
      { name: "description", content: "Turn long meeting notes into clear summaries, decisions, and action items." },
    ],
  }),
  component: SummarizePage,
});

interface SummaryInput {
  notes: string;
}

function SummarizePage() {
  const fn = useServerFn(summarizeNotes);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [text, setText] = useState("");
  const history = useLocalHistory<SummaryInput>("history:summary");

  const mut = useMutation({
    mutationFn: () => fn({ data: { notes } }),
    onSuccess: (r) => {
      setText(r.text);
      const firstLine = notes.split("\n").find((l) => l.trim())?.trim() || "Meeting notes";
      history.add({
        label: firstLine.slice(0, 80),
        input: { notes },
        output: r.text,
      });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Summarization failed"),
  });

  const canSubmit = notes.trim().length >= 10 && !mut.isPending;

  const handleConvertToTasks = () => {
    const items = extractActionItems(text);
    if (items.length === 0) {
      toast.error("No action items found in this summary");
      return;
    }
    const formatted = items.map((i) => `- ${i}`).join("\n");
    try {
      sessionStorage.setItem(PLANNER_PREFILL_KEY, formatted);
    } catch {
      // ignore
    }
    toast.success(`Sending ${items.length} action item${items.length === 1 ? "" : "s"} to Task Planner`);
    navigate({ to: "/planner" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Meeting Notes Summarizer" description="Paste raw notes — get a structured summary with decisions, actions, and deadlines." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="notes">Meeting notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Paste your full meeting notes here…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[360px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{notes.length} characters</p>
              </div>
              <Button className="w-full" onClick={() => mut.mutate()} disabled={!canSubmit}>
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Summarize
              </Button>
            </CardContent>
          </Card>
          <HistoryPanel
            entries={history.entries}
            onLoad={(e) => {
              setNotes(e.input.notes);
              setText(e.output);
              toast.success("Loaded from history");
            }}
            onRemove={history.remove}
            onClear={history.clear}
          />
        </div>
        <AiOutputCard
          title="Summary"
          text={text}
          isLoading={mut.isPending}
          onRegenerate={canSubmit || text ? () => mut.mutate() : undefined}
          onChange={setText}
          footer={
            <Button
              onClick={handleConvertToTasks}
              size="lg"
              className="w-full"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Convert Action Items to Tasks
            </Button>
          }
        />
      </div>
    </div>
  );
}
