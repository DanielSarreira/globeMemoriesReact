// src/hooks/useMouseVector.js
//
// Round 59 — Port of the useMouseVector hook from danielpetho/use-mouse-vector.
// TypeScript types dropped, behaviour preserved verbatim. Returns the current
// cursor position (relative to the supplied containerRef or the window) and
// the per-event movement vector (dx, dy). Listens to both `mousemove` and
// `touchmove` so the ImageTrail works on touch devices too.

import { useEffect, useState } from 'react';

export const useMouseVector = (containerRef) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [vector, setVector] = useState({ dx: 0, dy: 0 });

  useEffect(() => {
    let lastPosition = { x: 0, y: 0 };

    const updatePosition = (x, y) => {
      let newX;
      let newY;

      if (containerRef && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        newX = x - rect.left;
        newY = y - rect.top;
      } else {
        newX = x;
        newY = y;
      }

      // Calculate the movement vector
      const dx = newX - lastPosition.x;
      const dy = newY - lastPosition.y;

      setVector({ dx, dy });
      setPosition({ x: newX, y: newY });
      lastPosition = { x: newX, y: newY };
    };

    const handleMouseMove = (ev) => {
      updatePosition(ev.clientX, ev.clientY);
    };

    const handleTouchMove = (ev) => {
      const touch = ev.touches && ev.touches[0];
      if (touch) updatePosition(touch.clientX, touch.clientY);
    };

    // Listen for both mouse and touch events
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [containerRef]);

  return { position, vector };
};

export default useMouseVector;
