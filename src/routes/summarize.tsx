import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import {
  Sparkles,
  Loader2,
  ListChecks,
  Upload,
  Mic,
  Square,
  FileText,
} from "lucide-react";
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

// Minimal typings for Web Speech API
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

function SummarizePage() {
  const fn = useServerFn(summarizeNotes);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalBaseRef = useRef<string>("");
  const history = useLocalHistory<SummaryInput>("history:summary");

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    setSpeechSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

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

  const handleFile = async (file: File) => {
    setImporting(true);
    try {
      const name = file.name.toLowerCase();
      let content = "";
      if (name.endsWith(".txt") || file.type.startsWith("text/")) {
        content = await file.text();
      } else if (name.endsWith(".docx")) {
        const mammoth = await import("mammoth/mammoth.browser");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else {
        toast.error("Only .txt and .docx files are supported");
        return;
      }
      content = content.trim();
      if (!content) {
        toast.error("That file appears to be empty");
        return;
      }
      setNotes((prev) => (prev.trim() ? prev.trimEnd() + "\n\n" + content : content));
      toast.success(`Imported ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to read file");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const startRecording = () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice recording isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    finalBaseRef.current = notes.trim() ? notes.trimEnd() + "\n\n" : "";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0].transcript;
        if (res.isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      if (finalText) finalBaseRef.current += finalText;
      setNotes(finalBaseRef.current + interim);
    };
    recognition.onerror = (e) => {
      if (e.error !== "aborted") toast.error(`Mic error: ${e.error}`);
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
      toast.success("Listening… speak now");
    } catch {
      toast.error("Could not start microphone");
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Meeting Notes Summarizer" description="Paste raw notes, upload a transcript, or dictate live — get a structured summary with decisions, actions, and deadlines." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-5 text-center transition-colors hover:bg-muted/50"
              >
                <FileText className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">Upload a transcript</p>
                <p className="text-xs text-muted-foreground">Drag & drop or browse — .txt or .docx</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={importing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {importing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Choose file
                  </Button>
                  {!recording ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={startRecording}
                      disabled={!speechSupported}
                      title={speechSupported ? "Start voice dictation" : "Voice recording unavailable in this browser"}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Record voice
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={stopRecording}
                    >
                      <Square className="mr-2 h-4 w-4 fill-current" />
                      Stop recording
                    </Button>
                  )}
                </div>
                {recording && (
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-destructive">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                    </span>
                    Listening…
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Meeting notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Paste your full meeting notes here, or upload / dictate above…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[280px] font-mono text-sm"
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
