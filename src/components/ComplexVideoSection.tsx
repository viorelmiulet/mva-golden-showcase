import { Play, Video } from "lucide-react";
import { useMarketingConsent, openCookieSettings } from "@/hooks/useMarketingConsent";
import type { ResolvedVideo } from "@/lib/videoEmbed";

interface Props {
  video: ResolvedVideo;
  title: string;
}

/**
 * Development video, server-rendered. The iframe (youtube-nocookie) is only
 * mounted after marketing consent, mirroring the property gallery gating.
 */
const ComplexVideoSection = ({ video, title }: Props) => {
  const marketingConsent = useMarketingConsent();

  return (
    <section className="mt-8 sm:mt-10" aria-label={`Videoclip ${title}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Video className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Video prezentare</h2>
      </div>

      <div className="aspect-video w-full md:w-1/2 md:max-w-[24rem] mr-auto overflow-hidden rounded-xl bg-ink">
        {marketingConsent ? (
          <iframe
            src={video.embedUrl}
            title={`Videoclip: ${title}`}
            className="w-full h-full"
            loading="lazy"
            frameBorder={0}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-paper">
            {video.thumbnailUrl && (
              <img
                src={video.thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <Play className="relative w-10 h-10 text-brass" aria-hidden="true" fill="currentColor" />
            <p className="relative text-small max-w-sm">
              Videoclipul se încarcă de pe YouTube. Activează cookie-urile de marketing pentru a-l reda.
            </p>
            <button
              type="button"
              onClick={openCookieSettings}
              className="relative rounded-sm bg-brass text-ink px-4 py-2 text-small font-medium"
            >
              Activează
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ComplexVideoSection;
