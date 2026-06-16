import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai.functions";
import { PageHeader } from "@/components/page-header";
import { AiOutputCard } from "@/components/ai-output-card";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLANNER_PREFILL_KEY } from "@/lib/extract-action-items";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — Worksmith AI" },
      { name: "description", content: "Turn a to-do list into a prioritized, time-blocked daily plan." },
    ],
  }),
  component: PlannerPage,
});

const EXAMPLE = `- Finish Q3 budget proposal (due Friday, high priority)
- Reply to client emails
- Prep slides for Thursday all-hands
- Review pull requests
- 30-min walk`;

function PlannerPage() {
  const fn = useServerFn(planTasks);
  const qc = useQueryClient();
  const [tasks, setTasks] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem(PLANNER_PREFILL_KEY);
      if (prefill) {
        setTasks(prefill);
        sessionStorage.removeItem(PLANNER_PREFILL_KEY);
        toast.success("Action items loaded from your meeting summary");
      }
    } catch {
      // ignore
    }
  }, []);



  const mut = useMutation({
    mutationFn: () => fn({ data: { tasks } }),
    onSuccess: (r) => {
      setText(r.text);
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Planning failed"),
  });

  const canSubmit = tasks.trim().length >= 3 && !mut.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="AI Task Planner" description="List your tasks with deadlines or priorities — get a prioritized, time-blocked plan." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="tasks">Your tasks</Label>
              <Textarea
                id="tasks"
                placeholder={EXAMPLE}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                className="min-h-[280px] font-mono text-sm"
              />
              <Button size="sm" variant="ghost" onClick={() => setTasks(EXAMPLE)} className="h-7 px-2 text-xs">
                Insert example
              </Button>
            </div>
            <Button className="w-full" onClick={() => mut.mutate()} disabled={!canSubmit}>
              {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Build my plan
            </Button>
          </CardContent>
        </Card>
        <AiOutputCard
          title="Your plan"
          text={text}
          isLoading={mut.isPending}
          onRegenerate={canSubmit || text ? () => mut.mutate() : undefined}
          onChange={setText}
        />
      </div>
    </div>
  );
}
