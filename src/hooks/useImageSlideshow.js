/**
 * useImageSlideshow - Hook customizado para otimizar slideshows de imagens
 * Evita re-renders desnecessários e gerencia intervals eficientemente
 */

import { useEffect, useRef, useCallback } from 'react';

export const useImageSlideshow = (feedTravels, isMobile, feedContainerRef) => {
  const intervalsRef = useRef({});
  const observerRef = useRef(null);

  // Memoize a função de atualização de índice
  const updateImageIndex = useCallback((travelId, totalImages) => {
    return (prev) => ({
      ...prev,
      [travelId]: (prev[travelId] + 1) % (totalImages || 1),
    });
  }, []);

  useEffect(() => {
    if (!isMobile) {
      // Desktop: Todos os slideshows ativos
      const intervals = feedTravels.map((travel) => {
        return setInterval(() => {
          // Implementar atualização aqui
        }, 8000);
      });

      return () => intervals.forEach((interval) => interval && clearInterval(interval));
    }

    // Mobile: Apenas slideshows visíveis
    const startSlideshow = (travelId) => {
      if (intervalsRef.current[travelId]) return;
      intervalsRef.current[travelId] = setInterval(() => {
        // Implementar atualização aqui
      }, 8000);
    };

    const stopSlideshow = (travelId) => {
      if (intervalsRef.current[travelId]) {
        clearInterval(intervalsRef.current[travelId]);
        delete intervalsRef.current[travelId];
      }
    };

    const container = feedContainerRef?.current?.querySelector('.feed-snap');
    if (container) {
      const items = Array.from(container.querySelectorAll('.feed-item'));

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const travelId = parseInt(entry.target.dataset.travelId);
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              startSlideshow(travelId);
            } else {
              stopSlideshow(travelId);
            }
          });
        },
        { root: container, threshold: [0.5] }
      );

      items.forEach((item) => observerRef.current.observe(item));

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        Object.values(intervalsRef.current).forEach(interval => clearInterval(interval));
      };
    }

    return () => {
      Object.values(intervalsRef.current).forEach(interval => clearInterval(interval));
    };
  }, [isMobile, feedTravels, feedContainerRef, updateImageIndex]);

  return updateImageIndex;
};

export default useImageSlideshow;
