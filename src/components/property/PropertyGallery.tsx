import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Play } from "lucide-react";
import { useSwipeCarousel, usePrefersReducedMotion } from "@/hooks/useSwipeCarousel";
import { useMarketingConsent, openCookieSettings } from "@/hooks/useMarketingConsent";

interface PropertyGalleryProps {
  images: string[];
  title: string;
  alt?: string;
  /** Normalized embed URL (youtube-nocookie / vimeo). Omitted when the listing has no video. */
  videoEmbedUrl?: string | null;
}

/**
 * Static gallery: one large 3:2 image + up to 5 thumbnails.
 * Click opens a full-screen lightbox (arrow keys + Escape).
 * Touch devices get finger-tracked horizontal swipes; the lightbox also
 * closes on swipe down. Desktop layout, thumbnails and arrows are unchanged.
 */
const PropertyGallery = ({ images, title, alt, videoEmbedUrl }: PropertyGalleryProps) => {
  const list = (images || []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const marketingConsent = useMarketingConsent();
  const hasVideo = Boolean(videoEmbedUrl);

  const next = useCallback(() => setIndex((i) => (list.length ? (i + 1) % list.length : 0)), [list.length]);
  const prev = useCallback(
    () => setIndex((i) => (list.length ? (i - 1 + list.length) % list.length : 0)),
    [list.length]
  );

  // Preload neighbours so a swipe never lands on a blank frame.
  useEffect(() => {
    if (list.length < 2 || typeof window === "undefined") return;
    [(index + 1) % list.length, (index - 1 + list.length) % list.length].forEach((i) => {
      const img = new Image();
      img.src = list[i];
    });
  }, [index, list.length]);

  const main = useSwipeCarousel<HTMLDivElement>({ onNext: next, onPrev: prev });
  const closeLightbox = useCallback(() => {
    setLightbox(false);
    setVideoOpen(false);
  }, []);

  const box = useSwipeCarousel<HTMLDivElement>({
    onNext: next,
    onPrev: prev,
    onDismiss: closeLightbox,
    enabled: lightbox && !videoOpen,
  });

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (!videoOpen && e.key === "ArrowRight") next();
      else if (!videoOpen && e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, videoOpen, next, prev, closeLightbox]);

  if (list.length === 0) {
    return (
      <div className="aspect-[3/2] w-full rounded-sm border border-stone bg-muted flex items-center justify-center">
        <ImageIcon className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  const imageAlt = alt || title;
  const transition = reducedMotion ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";

  const counter = (
    <p
      className="md:hidden absolute bottom-3 right-3 z-10 text-spec text-paper bg-ink/60 px-2 py-0.5 rounded-sm pointer-events-none"
      aria-hidden="true"
    >
      {index + 1} / {list.length}
    </p>
  );

  return (
    <div
      role="group"
      aria-roledescription="carusel"
      aria-label={`Galerie foto: ${imageAlt}`}
    >
      {/* Anunță schimbarea imaginii pentru cititoarele de ecran */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Imaginea ${index + 1} din ${list.length}`}
      </p>
      <div ref={main.ref} className="relative touch-pan-y">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block w-full rounded-sm overflow-hidden border border-stone"
          aria-label={`Deschide imaginea ${index + 1} din ${list.length} pe tot ecranul`}
          aria-haspopup="dialog"
        >
          <img
            src={list[index]}
            alt={`${imageAlt} — imagine ${index + 1} din ${list.length}`}
            width={1200}
            height={800}
            className="w-full aspect-[3/2] object-cover"
            style={{
              transform: `translate3d(${main.dx}px,0,0)`,
              transition: main.dragging ? "none" : transition,
            }}
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
          />
        </button>
        {list.length > 1 && counter}
      </div>

      {(list.length > 1 || hasVideo) && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.slice(0, 1).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              onDoubleClick={() => setLightbox(true)}
              aria-label={`Afișează imaginea ${i + 1} din ${list.length}`}
              aria-current={i === index ? "true" : undefined}
              className={`rounded-sm overflow-hidden border transition-colors ${
                i === index ? "border-brass" : "border-stone hover:border-brass/60"
              }`}
            >
              <img
                src={src}
                alt={`${imageAlt} — imagine ${i + 1} din ${list.length}`}
                className="w-full aspect-[3/2] object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}

          {/* Video tile takes the second thumbnail slot when the listing has one. */}
          {hasVideo && (
            <button
              type="button"
              onClick={() => {
                setVideoOpen(true);
                setLightbox(true);
              }}
              aria-label="Redă videoclipul proprietății"
              aria-haspopup="dialog"
              className="relative rounded-sm overflow-hidden border border-stone hover:border-brass/60 transition-colors bg-ink"
            >
              {list[1] ? (
                <img
                  src={list[1]}
                  alt=""
                  aria-hidden="true"
                  className="w-full aspect-[3/2] object-cover opacity-60"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full aspect-[3/2]" />
              )}
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-paper">
                <Play className="w-5 h-5" aria-hidden="true" fill="currentColor" />
                <span className="text-spec">Video</span>
              </span>
            </button>
          )}

          {list.slice(1, hasVideo ? 5 : 5).map((src, i) => {
            const realIndex = i + 1;
            return (
              <button
                key={`${src}-${realIndex}`}
                type="button"
                onClick={() => setIndex(realIndex)}
                onDoubleClick={() => setLightbox(true)}
                aria-label={`Afișează imaginea ${realIndex + 1} din ${list.length}`}
                aria-current={realIndex === index ? "true" : undefined}
                className={`rounded-sm overflow-hidden border transition-colors ${
                  realIndex === index ? "border-brass" : "border-stone hover:border-brass/60"
                }`}
              >
                <img
                  src={src}
                  alt={`${imageAlt} — imagine ${realIndex + 1} din ${list.length}`}
                  className="w-full aspect-[3/2] object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            );
          }).slice(0, hasVideo ? 3 : 4)}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galerie imagini"
          className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 p-2 text-paper hover:text-brass"
            aria-label="Închide galeria pe tot ecranul"
          >
            <X className="w-6 h-6" />
          </button>

          {list.length > 1 && !videoOpen && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 md:left-6 p-3 text-paper hover:text-brass"
                aria-label="Imaginea anterioară"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 md:right-6 p-3 text-paper hover:text-brass"
                aria-label="Imaginea următoare"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {videoOpen ? (
            <div
              className="w-[92vw] max-w-[1100px] aspect-video bg-ink rounded-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {marketingConsent ? (
                <iframe
                  src={videoEmbedUrl as string}
                  title={`Videoclip: ${imageAlt}`}
                  className="w-full h-full"
                  loading="lazy"
                  frameBorder={0}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-ink text-paper">
                  {videoThumb && (
                    <img
                      src={videoThumb}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                  )}
                  <Play className="relative w-10 h-10 text-brass" aria-hidden="true" fill="currentColor" />
                  <p className="relative text-small text-paper/90 max-w-sm">
                    Videoclipul se încarcă de pe YouTube. Activează cookie-urile de marketing pentru
                    a-l reda.
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
          ) : (
            <div
              ref={box.ref}
              className="touch-pan-y"
              onClick={(e) => e.stopPropagation()}
              style={{
                transform: `translate3d(${box.dx}px, ${box.dy}px, 0)`,
                transition: box.dragging ? "none" : transition,
                opacity: box.dy ? Math.max(0.4, 1 - box.dy / 400) : 1,
              }}
            >
              <img
                src={list[index]}
                alt={`${imageAlt} — imagine ${index + 1} din ${list.length}`}
                className="max-h-[88vh] max-w-[92vw] object-contain rounded-sm"
                draggable={false}
              />
            </div>
          )}

          {!videoOpen && (
            <>
              <p className="absolute bottom-5 text-spec text-paper/70" aria-hidden="true">
                {index + 1} / {list.length}
              </p>
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {`Imaginea ${index + 1} din ${list.length}`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;
