import { useState } from "react";
import { Play, Video } from "lucide-react";
import type { DevelopmentVideo } from "@/lib/videoEmbed";
import { CONVERSION_EVENTS, trackConversion } from "@/lib/analytics/conversions";

interface Props {
  videos: DevelopmentVideo[];
  title: string;
}

/**
 * Development videos with a click-to-load facade. Nothing is requested from
 * YouTube until the user presses play: posters are served from our own Storage
 * bucket and the youtube-nocookie iframe is mounted on click.
 *
 * The first video is the main player; any others are listed as small
 * thumbnails beneath it and swap the main player when clicked.
 */
const ComplexVideoSection = ({ videos, title }: Props) => {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (!videos.length) return null;
  const video = videos[Math.min(active, videos.length - 1)];
  const src = playing
    ? `${video.embedUrl}${video.embedUrl.includes("?") ? "&" : "?"}autoplay=1`
    : null;
  const label = video.title || title;

  return (
    <section className="mt-8 sm:mt-10" aria-label={`Videoclipuri ${title}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Video className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Video prezentare</h2>
      </div>

      <div className="w-full md:w-1/2 md:max-w-[24rem] mr-auto">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink">
          {src ? (
            <iframe
              src={src}
              title={`Videoclip: ${label}`}
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
              aria-label={`Redă videoclipul: ${label}`}
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

        {video.title && (
          <p className="mt-2 text-sm font-medium text-foreground">{video.title}</p>
        )}

        {videos.length > 1 && (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {videos.map((v, i) => (
              <li key={v.youtubeId ?? i}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setPlaying(false);
                  }}
                  aria-current={i === active}
                  aria-label={`Vezi videoclipul: ${v.title || `${title} ${i + 1}`}`}
                  className={`w-full text-left rounded-md overflow-hidden border transition-colors ${
                    i === active ? "border-brass" : "border-border hover:border-brass/60"
                  }`}
                >
                  <span className="relative block aspect-video bg-ink">
                    {v.thumbnailUrl && (
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-5 h-5 text-brass" aria-hidden="true" fill="currentColor" />
                    </span>
                  </span>
                  {v.title && (
                    <span className="block px-1.5 py-1 text-[11px] leading-tight text-muted-foreground line-clamp-2">
                      {v.title}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default ComplexVideoSection;
