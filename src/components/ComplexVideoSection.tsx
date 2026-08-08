import { useState } from "react";
import { Play, Video } from "lucide-react";
import type { ResolvedVideo } from "@/lib/videoEmbed";

interface Props {
  video: ResolvedVideo;
  title: string;
}

/**
 * Development video with a click-to-load facade. Nothing is requested from
 * YouTube until the user presses play: the poster is served from our own
 * Storage bucket and the youtube-nocookie iframe is mounted on click.
 */
const ComplexVideoSection = ({ video, title }: Props) => {
  const [playing, setPlaying] = useState(false);
  const src = playing
    ? `${video.embedUrl}${video.embedUrl.includes("?") ? "&" : "?"}autoplay=1`
    : null;

  return (
    <section className="mt-8 sm:mt-10" aria-label={`Videoclip ${title}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Video className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Video prezentare</h2>
      </div>

      <div className="aspect-video w-full md:w-1/2 md:max-w-[24rem] mr-auto overflow-hidden rounded-xl bg-ink">
        {src ? (
          <iframe
            src={src}
            title={`Videoclip: ${title}`}
            className="w-full h-full"
            frameBorder={0}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Redă videoclipul: ${title}`}
            className="group relative w-full h-full flex items-center justify-center text-paper"
          >
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-ink/70">
              <Play className="w-7 h-7 text-brass" aria-hidden="true" fill="currentColor" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
};

export default ComplexVideoSection;
