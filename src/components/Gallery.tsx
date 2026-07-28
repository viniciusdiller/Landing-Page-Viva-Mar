"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { fetchPublicGallery } from "@/lib/api/gallery";
import type { GalleryPhoto } from "@/types";

const PHOTOS_PER_PAGE = 8;
const PAGE_ROTATE_INTERVAL_MS = 5000;
const PAGE_FADE_MS = 400;

export default function Gallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [displayPage, setDisplayPage] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const pages = useMemo(() => {
    const chunks: GalleryPhoto[][] = [];
    for (let i = 0; i < photos.length; i += PHOTOS_PER_PAGE) {
      chunks.push(photos.slice(i, i + PHOTOS_PER_PAGE));
    }
    return chunks;
  }, [photos]);

  useEffect(() => {
    setActivePage((current) => (current < pages.length ? current : 0));
    setDisplayPage((current) => (current < pages.length ? current : 0));
  }, [pages.length]);

  useEffect(() => {
    if (pages.length < 2) return;

    const interval = setInterval(() => {
      setActivePage((current) => (current + 1) % pages.length);
    }, PAGE_ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pages.length]);

  // Faz o crossfade: some com a página atual e só troca o conteúdo
  // (displayPage) quando já está invisível, evitando o corte seco de troca
  // instantânea de fotos.
  useEffect(() => {
    if (activePage === displayPage) return;

    setIsFading(true);
    const timeout = setTimeout(() => {
      setDisplayPage(activePage);
      setIsFading(false);
    }, PAGE_FADE_MS);

    return () => clearTimeout(timeout);
  }, [activePage, displayPage]);

  useEffect(() => {
    let cancelled = false;

    fetchPublicGallery()
      .then((data) => {
        if (!cancelled) setPhotos(data);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const closeLightbox = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null || photos.length === 0) return current;
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null || photos.length === 0) return current;
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [activeIndex, closeLightbox, showPrev, showNext]);

  if (!loading && photos.length === 0) {
    return null;
  }

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <section
      id="galeria"
      className="py-20 md:py-32 bg-[var(--color-bg)]"
      aria-labelledby="galeria-heading"
    >
      <div className="container-wide max-w-[90rem] mx-auto px-4 md:px-8">
        <div className="text-center mb-16 md:mb-24">
          <h2
            id="galeria-heading"
            className="text-[var(--color-text)] uppercase mb-4"
            style={{
              fontSize: "clamp(1.25rem, 2vw, 2.1rem)",
              letterSpacing: "0.36em",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
            }}
          >
            Galeria
          </h2>
          <p className="text-[var(--color-text-muted)] text-xs md:text-sm tracking-[0.2em] uppercase">
            Momentos e vistas da Pousada Viva Mar
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)] py-10">
            <Images size={18} className="animate-pulse" aria-hidden="true" />
            <span className="text-sm uppercase tracking-[0.2em]">Carregando fotos...</span>
          </div>
        ) : (
          <>
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 transition-opacity ease-in-out ${
                isFading ? "opacity-0" : "opacity-100"
              }`}
              style={{ transitionDuration: `${PAGE_FADE_MS}ms` }}
            >
              {(pages[displayPage] ?? []).map((photo, localIndex) => {
                const globalIndex = displayPage * PHOTOS_PER_PAGE + localIndex;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActiveIndex(globalIndex)}
                    className="group relative aspect-square overflow-hidden bg-[var(--color-surface-2)]"
                    aria-label={photo.caption || `Ampliar foto ${globalIndex + 1} da galeria`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || "Foto da Pousada Viva Mar"}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/15" />
                  </button>
                );
              })}
            </div>

            {pages.length > 1 && (
              <div
                className="mt-8 flex items-center justify-center gap-2.5"
                role="tablist"
                aria-label="Páginas da galeria"
              >
                {pages.map((_, pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    role="tab"
                    aria-selected={pageIndex === activePage}
                    aria-label={`Ver página ${pageIndex + 1} da galeria`}
                    onClick={() => setActivePage(pageIndex)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      pageIndex === activePage
                        ? "w-6 bg-[var(--color-primary)]"
                        : "w-2 bg-[var(--color-border)] hover:bg-[var(--color-text-muted)]"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {activePhoto && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da foto"
        >
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={closeLightbox}
          />

          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 text-white/80 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={28} />
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={showPrev}
              className="absolute left-2 sm:left-6 z-10 text-white/80 hover:text-white transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          <img
            src={activePhoto.url}
            alt={activePhoto.caption || "Foto da Pousada Viva Mar"}
            className="relative z-[5] max-h-[85vh] max-w-[92vw] object-contain shadow-2xl"
          />

          {photos.length > 1 && (
            <button
              type="button"
              onClick={showNext}
              className="absolute right-2 sm:right-6 z-10 text-white/80 hover:text-white transition-colors"
              aria-label="Próxima foto"
            >
              <ChevronRight size={36} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
