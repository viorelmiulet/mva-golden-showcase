import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { extractYouTubeId, youtubeThumb } from "@/lib/videoEmbed";

export interface VideoEntry {
  /** Raw URL or bare ID as typed by the admin. */
  url: string;
  title: string;
}

interface Props {
  value: VideoEntry[];
  onChange: (next: VideoEntry[]) => void;
  label?: string;
  hint?: string;
}

/**
 * Repeatable YouTube list for a development: add, retitle, reorder by drag and
 * remove. Each row previews its thumbnail so a wrong link is obvious at once.
 */
const DevelopmentVideosField = ({
  value,
  onChange,
  label = "Videoclipuri YouTube",
  hint = "Primul videoclip este cel principal. Trage rândurile pentru a schimba ordinea.",
}: Props) => {
  const invalidCount = useMemo(
    () => value.filter((v) => v.url.trim() && !extractYouTubeId(v.url)).length,
    [value],
  );

  const update = (index: number, patch: Partial<VideoEntry>) =>
    onChange(value.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { url: "", title: "" }])}
        >
          <Plus className="mr-1 h-4 w-4" />
          Adaugă videoclip
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{hint}</p>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">Niciun videoclip adăugat.</p>
      )}

      <ul className="space-y-3">
        {value.map((entry, index) => {
          const raw = (entry.url || "").trim();
          const id = extractYouTubeId(raw);
          const invalid = raw.length > 0 && !id;
          return (
            <li
              key={index}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData("text/plain"));
                if (!Number.isNaN(from)) move(from, index);
              }}
              className="rounded-md border border-border p-3 bg-card"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-2 text-muted-foreground">
                  <GripVertical className="h-4 w-4 cursor-grab" aria-hidden="true" />
                  <button
                    type="button"
                    className="text-xs px-1"
                    onClick={() => move(index, index - 1)}
                    aria-label="Mută mai sus"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="text-xs px-1"
                    onClick={() => move(index, index + 1)}
                    aria-label="Mută mai jos"
                  >
                    ↓
                  </button>
                </div>

                {id ? (
                  <img
                    src={youtubeThumb(id)}
                    alt={`Previzualizare video YouTube ${id}`}
                    loading="lazy"
                    className="w-32 aspect-video object-cover rounded-sm border border-border shrink-0"
                  />
                ) : (
                  <div className="w-32 aspect-video rounded-sm border border-dashed border-border shrink-0" />
                )}

                <div className="flex-1 space-y-2">
                  <Input
                    value={entry.url}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onChange={(e) => update(index, { url: e.target.value })}
                    aria-invalid={invalid}
                    aria-label="Link YouTube"
                  />
                  <Input
                    value={entry.title}
                    placeholder="Titlu scurt (ex: Stadiu lucrări august 2026)"
                    onChange={(e) => update(index, { title: e.target.value })}
                    aria-label="Titlu videoclip"
                  />
                  {invalid && (
                    <p className="text-sm text-destructive">
                      Link YouTube invalid — nu am putut extrage un ID valid.
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => remove(index)}
                  aria-label="Șterge videoclipul"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {invalidCount > 0 && (
        <p className="text-sm text-destructive">
          {invalidCount} link(uri) invalide — corectează-le înainte de salvare.
        </p>
      )}
    </div>
  );
};

export default DevelopmentVideosField;

/** Save guard: normalized payload rows, or null when any link is invalid. */
export function videoRowsFrom(
  entries: VideoEntry[],
): { youtube_id: string; title: string | null }[] | null {
  const rows: { youtube_id: string; title: string | null }[] = [];
  for (const entry of entries) {
    const raw = (entry.url || "").trim();
    if (!raw) continue;
    const id = extractYouTubeId(raw);
    if (!id) return null;
    rows.push({ youtube_id: id, title: (entry.title || "").trim() || null });
  }
  return rows;
}
