import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai.functions";
import { PageHeader } from "@/components/page-header";
import { AiOutputCard } from "@/components/ai-output-card";
import { HistoryPanel } from "@/components/history-panel";
import { useLocalHistory } from "@/hooks/use-local-history";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Worksmith AI" },
      { name: "description", content: "Generate polished professional emails in seconds." },
    ],
  }),
  component: EmailPage,
});

type Tone = "Professional" | "Casual" | "Assertive" | "Empathetic";
type Length = "Short" | "Medium" | "Detailed";

const LENGTH_LABEL: Record<Length, string> = {
  Short: "Short / Bullet Points",
  Medium: "Medium",
  Detailed: "Detailed",
};

interface EmailInput {
  recipient: string;
  subject: string;
  purpose: string;
  tone: Tone;
  length: Length;
}

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const qc = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [length, setLength] = useState<Length>("Medium");
  const [text, setText] = useState("");
  const history = useLocalHistory<EmailInput>("history:email");

  const mut = useMutation({
    mutationFn: () => fn({ data: { recipient, subject, purpose, tone, length } }),
    onSuccess: (r) => {
      setText(r.text);
      history.add({
        label: subject || recipient || "Untitled email",
        input: { recipient, subject, purpose, tone, length },
        output: r.text,
      });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Generation failed"),
  });

  const canSubmit = recipient.trim() && subject.trim() && purpose.trim() && !mut.isPending;

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Smart Email Generator" description="Generate professional emails tailored to your tone and purpose." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="recipient">Recipient</Label>
                <Input id="recipient" placeholder="e.g. Sarah from Marketing" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g. Q3 campaign review" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Assertive">Assertive</SelectItem>
                      <SelectItem value="Empathetic">Empathetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Length</Label>
                  <Select value={length} onValueChange={(v) => setLength(v as Length)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Short">{LENGTH_LABEL.Short}</SelectItem>
                      <SelectItem value="Medium">{LENGTH_LABEL.Medium}</SelectItem>
                      <SelectItem value="Detailed">{LENGTH_LABEL.Detailed}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea id="purpose" placeholder="Briefly describe what this email should accomplish…" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="min-h-[140px]" />
              </div>
              <Button className="w-full" onClick={() => mut.mutate()} disabled={!canSubmit}>
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Email
              </Button>
            </CardContent>
          </Card>
          <HistoryPanel
            title="Local history"
            entries={history.entries}
            onLoad={(e) => {
              setRecipient(e.input.recipient);
              setSubject(e.input.subject);
              setPurpose(e.input.purpose);
              setTone(e.input.tone);
              setLength(e.input.length ?? "Medium");
              setText(e.output);
              toast.success("Loaded from history");
            }}
            onRemove={history.remove}
            onClear={history.clear}
          />
        </div>
        <AiOutputCard
          title="Generated Email"
          text={text}
          isLoading={mut.isPending}
          onRegenerate={canSubmit || text ? () => mut.mutate() : undefined}
          onChange={setText}
        />
      </div>
    </div>
  );
}
