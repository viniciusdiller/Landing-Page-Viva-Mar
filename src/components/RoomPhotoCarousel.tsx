"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const SLIDE_INTERVAL_MS = 4500;

interface RoomPhotoCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  sizeClassName?: string;
  // Em miniaturas pequenas as setas de navegação (36px) cobrem quase toda a
  // área e "roubam" o clique de abrir o lightbox — nesses casos desativa as
  // setas/bolinhas inline, deixando o clique inteiro dedicado a ampliar.
  showInlineControls?: boolean;
}

export default function RoomPhotoCarousel({
  images,
  alt,
  className = "",
  sizeClassName = "aspect-[4/3]",
  showInlineControls = true,
}: RoomPhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [images]);

  useEffect(() => {
    if (images.length < 2 || lightboxOpen) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [images.length, lightboxOpen]);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [lightboxOpen, showPrev, showNext]);

  if (images.length === 0) {
    return (
      <div
        className={`w-full ${sizeClassName} bg-gray-200 flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest ${className}`}
      >
        Sem foto
      </div>
    );
  }

  return (
    <>
      <div
        className={`group relative w-full ${sizeClassName} overflow-hidden bg-gray-100 cursor-zoom-in ${className}`}
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Ampliar foto"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setLightboxOpen(true);
        }}
      >
        {images.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={index === activeIndex ? alt : ""}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 h-full w-full object-cover grayscale-[10%] transition-opacity duration-700 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {images.length > 1 && showInlineControls && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
              aria-label="Próxima foto"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveIndex(index);
                  }}
                  aria-label={`Ver foto ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da foto"
        >
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
          />

          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 text-white/80 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={28} />
          </button>

          {images.length > 1 && (
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
            src={images[activeIndex]}
            alt={alt}
            className="relative z-[5] max-h-[85vh] max-w-[92vw] object-contain shadow-2xl"
          />

          {images.length > 1 && (
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
    </>
  );
}
