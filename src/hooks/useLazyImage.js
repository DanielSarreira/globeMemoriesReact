/**
 * Hook para lazy loading otimizado de imagens
 * @module useLazyImage
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Hook para lazy loading de imagens com IntersectionObserver
 * @param {string} src - URL da imagem
 * @param {string} placeholder - URL da imagem placeholder
 * @param {Object} options - Opções do IntersectionObserver
 * @returns {Object} {ref, imageSrc, isLoaded, error}
 */
export const useLazyImage = (src, placeholder, options = {}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!src) {
      setError('Nenhuma imagem fornecida');
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = new Image();
          
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            observer.unobserve(entry.target);
          };

          img.onerror = () => {
            setError('Erro ao carregar imagem');
            observer.unobserve(entry.target);
          };

          img.src = src;
        }
      });
    }, observerOptions);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [src, placeholder, options]);

  return {
    ref,
    imageSrc,
    isLoaded,
    error
  };
};

/**
 * Hook para pré-carregar imagens
 * @param {string[]} srcs - URLs das imagens a pré-carregar
 * @returns {Object} {loading, loaded, failed}
 */
export const usePreloadImages = (srcs = []) => {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState([]);
  const [failed, setFailed] = useState([]);

  useEffect(() => {
    if (!srcs || srcs.length === 0) {
      setLoading(false);
      return;
    }

    let loadedCount = 0;
    const failedImages = [];

    srcs.forEach((src) => {
      const img = new Image();

      img.onload = () => {
        loadedCount++;
        setLoaded(prev => [...prev, src]);
        if (loadedCount === srcs.length) {
          setLoading(false);
        }
      };

      img.onerror = () => {
        failedImages.push(src);
        loadedCount++;
        setFailed(prev => [...prev, src]);
        if (loadedCount === srcs.length) {
          setLoading(false);
        }
      };

      img.src = src;
    });

    return () => {
      // Cleanup
    };
  }, [srcs]);

  return { loading, loaded, failed };
};

/**
 * Hook para observar intersecção (visibilidade) de elemento
 * Útil para analytics (quando elemento fica visível)
 * @param {Object} options - Opções do IntersectionObserver
 * @returns {Object} {ref, isVisible}
 */
export const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Não remove observer automaticamente, pode ser útil
        } else {
          setIsVisible(false);
        }
      });
    }, observerOptions);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [options]);

  return { ref, isVisible };
};

/**
 * Hook para responsive images com srcset
 * @param {string} src - URL base da imagem
 * @param {Object} sizes - Mapeamento de sizes
 * @returns {Object} {srcSet, sizes}
 */
export const useResponsiveImage = (src, sizes = {}) => {
  const defaultSizes = {
    mobile: `${src}?w=400`,
    tablet: `${src}?w=768`,
    desktop: `${src}?w=1280`
  };

  const finalSizes = { ...defaultSizes, ...sizes };

  const srcSet = `
    ${finalSizes.mobile} 400w,
    ${finalSizes.tablet} 768w,
    ${finalSizes.desktop} 1280w
  `.trim();

  return {
    srcSet,
    sizes: '(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw'
  };
};

export default {
  useLazyImage,
  usePreloadImages,
  useIntersectionObserver,
  useResponsiveImage
};
