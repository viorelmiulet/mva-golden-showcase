import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";

interface PropertyGalleryProps {
  images: string[];
  title: string;
  alt?: string;
}

/**
 * Static gallery: one large 3:2 image + up to 5 thumbnails.
 * Click opens a full-screen lightbox (arrow keys + Escape).
 * No autoplay, no dots, no Ken Burns.
 */
const PropertyGallery = ({ images, title, alt }: PropertyGalleryProps) => {
  const list = (images || []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = useCallback(() => setIndex((i) => (list.length ? (i + 1) % list.length : 0)), [list.length]);
  const prev = useCallback(
    () => setIndex((i) => (list.length ? (i - 1 + list.length) % list.length : 0)),
    [list.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, next, prev]);

  if (list.length === 0) {
    return (
      <div className="aspect-[3/2] w-full rounded-sm border border-stone bg-muted flex items-center justify-center">
        <ImageIcon className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  const imageAlt = alt || title;

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="block w-full rounded-sm overflow-hidden border border-stone"
        aria-label="Deschide galeria pe tot ecranul"
      >
        <img
          src={list[index]}
          alt={`${imageAlt} — imagine ${index + 1} din ${list.length}`}
          width={1200}
          height={800}
          className="w-full aspect-[3/2] object-cover"
          fetchPriority={index === 0 ? "high" : "auto"}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      </button>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.slice(0, 5).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              onDoubleClick={() => setLightbox(true)}
              aria-label={`Imaginea ${i + 1}`}
              aria-current={i === index}
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
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galerie imagini"
          className="fixed inset-0 z-[100] bg-ink/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
            className="absolute top-4 right-4 p-2 text-paper hover:text-brass"
            aria-label="Închide"
          >
            <X className="w-6 h-6" />
          </button>

          {list.length > 1 && (
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

          <img
            src={list[index]}
            alt={`${imageAlt} — imagine ${index + 1} din ${list.length}`}
            className="max-h-[88vh] max-w-[92vw] object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />

          <p className="absolute bottom-5 text-spec text-paper/70">
            {index + 1} / {list.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;
