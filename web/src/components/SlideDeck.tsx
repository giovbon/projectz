import { useRef, useEffect, useState, useCallback } from 'preact/hooks';
import { renderMarkdown, parseSlides } from '../lib/markdown';
import type { SlidesResponse } from '../lib/api';

interface SlideDeckProps {
  slidesData: SlidesResponse;
}

export function SlideDeck({ slidesData }: SlideDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesHtml, setSlidesHtml] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = slidesData.slides.map((slide) => renderMarkdown(slide));
    setSlidesHtml(html);
    setCurrentSlide(0);
  }, [slidesData]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < slidesHtml.length) {
        setCurrentSlide(index);
      }
    },
    [slidesHtml.length]
  );

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) break;
          e.preventDefault();
          setFullscreen((f) => !f);
          break;
        case 'Escape':
          setFullscreen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  if (slidesHtml.length === 0) {
    return <div class="loading-spinner"><div class="spinner" /></div>;
  }

  return (
    <div
      ref={deckRef}
      class={`slide-deck ${fullscreen ? 'fullscreen' : ''}`}
      style={{ backgroundColor: slidesData.theme === 'black' ? '#191919' : '#fff' }}
    >
      {/* Theme class based on the slides theme */}
      <div class={`slide-viewer theme-${slidesData.theme}`}>
        <div
          class="slide-content reveal-markdown"
          dangerouslySetInnerHTML={{ __html: slidesHtml[currentSlide] }}
        />
      </div>

      {/* Controls */}
      <div class="slide-controls">
        <button class="slide-btn" onClick={prev} disabled={currentSlide === 0}>
          ← Anterior
        </button>
        <span class="slide-counter">
          {currentSlide + 1} / {slidesHtml.length}
        </span>
        <button class="slide-btn" onClick={next} disabled={currentSlide === slidesHtml.length - 1}>
          Próximo →
        </button>
        <button class="slide-btn fullscreen-btn" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? '✕ Sair' : '⛶ Tela Cheia'}
        </button>
      </div>

      {/* Dots navigation */}
      <div class="slide-dots">
        {slidesHtml.map((_, i) => (
          <button
            key={i}
            class={`slide-dot ${i === currentSlide ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
