import { memo } from 'react';

/**
 * HOC para memoização de componentes
 * Previne re-renders desnecessários
 */
export const withMemo = (Component, displayName) => {
  const Memoized = memo(Component);
  Memoized.displayName = displayName || `withMemo(${Component.displayName || Component.name})`;
  return Memoized;
};

/**
 * Componente de Image com lazy loading
 * Melhora performance especialmente em feeds longos
 */
export const LazyImage = ({
  src,
  alt,
  className,
  style,
  onLoad,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={(e) => {
        e.target.src = placeholder;
      }}
    />
  );
};

/**
 * Componente com virtualization para listas longas
 * Renderiza apenas itens visíveis
 */
export const VirtualizedList = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
  const visibleItems = items.slice(startIndex, Math.min(endIndex + 1, items.length));
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default {
  withMemo,
  LazyImage,
  VirtualizedList,
};
