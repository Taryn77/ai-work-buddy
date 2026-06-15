import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, FileText, CalendarCheck, Telescope, MessageSquare, Plus, ArrowRight } from "lucide-react";
import { getStats } from "@/lib/ai.functions";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

const statsQuery = queryOptions({
  queryKey: ["stats"],
  queryFn: () => getStats(),
  staleTime: 10_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Worksmith AI" },
      { name: "description", content: "Your AI productivity dashboard: emails, summaries, plans, research, and chat." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  component: Dashboard,
});

const quickActions = [
  { to: "/email", title: "New Email", desc: "Draft a professional email", icon: Mail, tint: "from-sky-500 to-indigo-500" },
  { to: "/summarize", title: "Summarize Notes", desc: "Turn notes into key points", icon: FileText, tint: "from-emerald-500 to-teal-500" },
  { to: "/planner", title: "Create Task Plan", desc: "Prioritize and schedule", icon: CalendarCheck, tint: "from-amber-500 to-orange-500" },
  { to: "/research", title: "Start Research", desc: "Get insights on a topic", icon: Telescope, tint: "from-fuchsia-500 to-pink-500" },
  { to: "/chat", title: "Open Chatbot", desc: "Ask your AI assistant", icon: MessageSquare, tint: "from-violet-500 to-purple-500" },
] as const;

function Dashboard() {
  // refetch on focus
  useServerFn(getStats);
  const { data } = useSuspenseQuery(statsQuery);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Good day 👋"
        description="Your AI workspace at a glance. Pick a tool to get started."
      />

      <section aria-label="Usage stats" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Emails Generated" value={data.email} icon={Mail} tint="bg-gradient-to-br from-sky-500 to-indigo-500" />
        <StatCard label="Notes Summarized" value={data.summary} icon={FileText} tint="bg-gradient-to-br from-emerald-500 to-teal-500" />
        <StatCard label="Tasks Planned" value={data.plan} icon={CalendarCheck} tint="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard label="Research Reports" value={data.research} icon={Telescope} tint="bg-gradient-to-br from-fuchsia-500 to-pink-500" />
      </section>

      <section aria-label="Quick actions" className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${a.tint} text-white`}>
                    <a.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{a.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{a.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <Card className="bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-fuchsia-500/5 border-dashed">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold">Responsible AI</h3>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
              Worksmith AI generates drafts to accelerate your workflow — not to replace your judgment. Always review,
              verify, and edit outputs before sending them to colleagues, clients, or stakeholders.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
