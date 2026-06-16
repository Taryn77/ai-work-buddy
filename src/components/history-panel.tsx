import type { HistoryEntry } from "@/hooks/use-local-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, RotateCcw, Trash2, X } from "lucide-react";

interface Props<T> {
  title?: string;
  entries: HistoryEntry<T>[];
  onLoad: (entry: HistoryEntry<T>) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  emptyHint?: string;
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryPanel<T>({
  title = "Local history",
  entries,
  onLoad,
  onRemove,
  onClear,
  emptyHint = "Your last 5 generations will appear here.",
}: Props<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4" /> {title}
        </CardTitle>
        {entries.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="h-7 px-2 text-xs"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyHint}
          </p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className="group flex items-start gap-1.5 rounded-md border bg-card/40 p-2.5 transition-colors hover:bg-accent/40"
            >
              <button
                type="button"
                onClick={() => onLoad(e)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium">{e.label || "Untitled"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatRelative(e.createdAt)}
                </p>
              </button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onLoad(e)}
                className="h-7 w-7 shrink-0 p-0"
                aria-label="Reload entry"
                title="Reload"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(e.id)}
                className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove entry"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
