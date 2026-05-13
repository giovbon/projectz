import { useEffect, useState } from 'preact/hooks';
import { fetchPage, fetchSlides, type PageResponse, type SlidesResponse } from '../lib/api';

export function useMarkdown(slug: string | undefined) {
  const [page, setPage] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSlides, setIsSlides] = useState(false);
  const [slidesData, setSlidesData] = useState<SlidesResponse | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchPage(slug)
      .then((data) => {
        setPage(data);

        // If this is a slides type, also fetch slides data
        if (data.type === 'slides') {
          setIsSlides(true);
          return fetchSlides(slug);
        } else {
          setIsSlides(false);
          setSlidesData(null);
        }

        setLoading(false);
      })
      .then((slides) => {
        if (slides) {
          setSlidesData(slides);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  return { page, slidesData, loading, error, isSlides };
}
