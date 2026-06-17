import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, RotateCcw, Pencil, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  title: string;
  text: string;
  isLoading?: boolean;
  onRegenerate?: () => void;
  onChange?: (v: string) => void;
  footer?: React.ReactNode;
}

export function AiOutputCard({
  title,
  text,
  isLoading,
  onRegenerate,
  onChange,
  footer,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [copied, setCopied] = useState(false);

  useEffect(() => setDraft(text), [text]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(editing ? draft : text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing((e) => !e)}
            disabled={!text || isLoading}
          >
            {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            <span className="ml-1.5">{editing ? "Done" : "Edit"}</span>
          </Button>
          <Tooltip open={copied}>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={copy}
                disabled={!text || isLoading}
                aria-label="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
                <span className="ml-1.5">Copy</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Copied!</TooltipContent>
          </Tooltip>
          {onRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRegenerate}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="ml-1.5">Regenerate</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-2" aria-busy="true" aria-label="Generating AI response">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="mt-5 h-5 w-1/4" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[82%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : !text ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Your AI-generated content will appear here.
          </div>
        ) : editing ? (
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onChange?.(e.target.value);
            }}
            className="min-h-[320px] font-mono text-sm"
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_h2]:mb-1.5 [&_h2]:mt-4 [&_p]:my-2 [&_ul]:my-2">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
        {footer && !isLoading && text ? <div className="mt-4">{footer}</div> : null}
        <p className="mt-6 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
          AI-generated content may contain inaccuracies. Always review, verify, and edit outputs before using them in professional or business environments.
        </p>
      </CardContent>
    </Card>
  );
}
