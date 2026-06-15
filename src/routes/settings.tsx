import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { clearChat } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Worksmith AI" },
      { name: "description", content: "Manage appearance and conversation data." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [dark, setDark] = useState(false);
  const clearFn = useServerFn(clearChat);
  const qc = useQueryClient();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Settings" description="Personalize Worksmith AI and manage your data." />
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="dark-mode" className="text-sm font-medium">Dark mode</Label>
                <p className="text-xs text-muted-foreground">Easier on the eyes in low light.</p>
              </div>
              <Switch id="dark-mode" checked={dark} onCheckedChange={toggleDark} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">Clear chatbot history</div>
                <p className="text-xs text-muted-foreground">Deletes every message in the AI chatbot conversation.</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await clearFn();
                  qc.invalidateQueries();
                  toast.success("Conversation cleared");
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Responsible AI</p>
            <p className="mt-1">
              AI-generated content may contain inaccuracies. Always review, verify, and edit outputs before using them in
              professional or business environments.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
