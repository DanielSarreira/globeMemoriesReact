/**
 * Componente LazyImage reutilizável
 * Usa IntersectionObserver para carregar imagens quando visíveis
 * Suporta placeholder, fallback, responsive images
 */

import React, { useEffect, useState } from 'react';
import { useLazyImage } from '../hooks/useLazyImage';
import '../styles/LazyImage.css';

/**
 * Componente que carrega imagem de forma lazy
 * @param {string} src - URL da imagem
 * @param {string} alt - Texto alternativo (importante para a11y)
 * @param {string} placeholder - URL do placeholder
 * @param {string} fallback - URL da imagem fallback se carregar falhar
 * @param {string} className - Classes CSS adicionais
 * @param {Object} style - Estilos inline
 * @param {number} width - Largura da imagem
 * @param {number} height - Altura da imagem
 * @param {string} objectFit - CSS object-fit (cover, contain, fill)
 * @param {boolean} showLoader - Mostrar loader enquanto carrega
 * @param {Function} onLoad - Callback quando imagem carrega
 * @param {Function} onError - Callback quando imagem falha
 * @param {Object} observerOptions - Opções do IntersectionObserver
 */
const LazyImage = ({
  src,
  alt = 'Imagem',
  placeholder = null,
  fallback = null,
  className = '',
  style = {},
  width = null,
  height = null,
  objectFit = 'cover',
  showLoader = true,
  onLoad = null,
  onError = null,
  observerOptions = {}
}) => {
  const [showError, setShowError] = useState(false);
  const { ref, imageSrc, isLoaded, error } = useLazyImage(src, placeholder, observerOptions);

  useEffect(() => {
    if (error) {
      setShowError(true);
      onError?.(error);
    } else {
      setShowError(false);
    }
  }, [error, onError]);

  useEffect(() => {
    if (isLoaded) {
      onLoad?.();
    }
  }, [isLoaded, onLoad]);

  const displaySrc = showError ? (fallback || placeholder) : imageSrc;

  const imgStyle = {
    ...style,
    objectFit,
    width: width || '100%',
    height: height || 'auto',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0.7
  };

  return (
    <div
      ref={ref}
      className={`lazy-image-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      {showLoader && !isLoaded && !showError && (
        <div className="lazy-image-loader">
          <div className="spinner"></div>
          <span>Carregando...</span>
        </div>
      )}

      {showError && (
        <div className="lazy-image-error">
          <span>Erro ao carregar imagem</span>
        </div>
      )}

      <img
        src={displaySrc || placeholder}
        alt={alt}
        style={imgStyle}
        className={`lazy-image ${isLoaded ? 'loaded' : ''} ${showError ? 'error' : ''}`}
        loading="lazy"
        onError={() => {
          setShowError(true);
          onError?.('Erro ao carregar imagem');
        }}
        onLoad={() => {
          onLoad?.();
        }}
      />
    </div>
  );
};

export default LazyImage;
