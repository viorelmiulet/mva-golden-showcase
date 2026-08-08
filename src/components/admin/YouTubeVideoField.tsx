import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { extractYouTubeId, youtubeThumb } from "@/lib/videoEmbed";

interface YouTubeVideoFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** When provided, renders a "Șterge videoclipul" action that clears both columns on save. */
  onClear?: () => void;
  label?: string;
  hint?: string;
}

/**
 * Manual YouTube entry for properties and developments.
 * Accepts watch/youtu.be/embed/shorts URLs or a bare ID; extra query params are stripped.
 * Shows an inline error plus a live thumbnail so a wrong link is obvious immediately.
 */
const YouTubeVideoField = ({
  value,
  onChange,
  onClear,
  label = "Video YouTube",
  hint = "Link YouTube (watch, youtu.be, embed, shorts) sau ID-ul de 11 caractere.",
}: YouTubeVideoFieldProps) => {
  const raw = (value || "").trim();
  const id = extractYouTubeId(raw);
  const invalid = raw.length > 0 && !id;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {onClear && raw.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onClear}>
            <Trash2 className="mr-1 h-4 w-4" />
            Șterge videoclipul
          </Button>
        )}
      </div>
      <Input
        value={value || ""}
        placeholder="https://www.youtube.com/watch?v=..."
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
      />
      {invalid ? (
        <p className="text-sm text-destructive">
          Link YouTube invalid — nu am putut extrage un ID valid.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
      {id && (
        <div className="flex items-center gap-3">
          <img
            src={youtubeThumb(id)}
            alt={`Previzualizare video YouTube ${id}`}
            loading="lazy"
            className="w-40 aspect-video object-cover rounded-sm border border-border"
          />
          <code className="text-xs text-muted-foreground">{id}</code>
        </div>
      )}
    </div>
  );
};

export default YouTubeVideoField;

/** Shared save guard: returns the columns to persist, or null when the input is invalid. */
export function videoColumnsFrom(value: string): { video_manual: string | null; video_id: string | null } | null {
  const raw = (value || "").trim();
  if (!raw) return { video_manual: null, video_id: null };
  const id = extractYouTubeId(raw);
  if (!id) return null;
  return { video_manual: raw, video_id: id };
}
