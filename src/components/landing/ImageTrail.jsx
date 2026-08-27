// src/components/landing/ImageTrail.jsx
//
// Round 59 — Port of the danielpetho image-trail component to plain JSX.
// We drop the TS-only types and swap the `useRef` trail buffer for
// `useState` so React actually re-renders when items are added/removed
// (the original used a mutable ref + a parent re-render trigger; here
// we own the full component so we just do it the React way).
//
// Each child passed in becomes a frame in the rotation. Every time the
// mouse moves more than `interval` ms, a new frame is spawned at the
// current cursor position with a random rotation from
// [-rotationRange, +rotationRange] degrees, animated through the
// `animationSequence` (default: scale 1.2 → 0 over 0.6s).

import React, {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  motion,
  useAnimate,
  useAnimationFrame,
} from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import { useMouseVector } from '../../hooks/useMouseVector';

const DEFAULT_SEQUENCE = [
  [{ scale: 1.2 }, { duration: 0.1, ease: 'circOut' }],
  [{ scale: 0 }, { duration: 0.5, ease: 'circIn' }],
];

const TrailItem = ({ item, onComplete }) => {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    // Each segment is [target, transition]. The framer-motion animate()
    // overload accepts a list of [element, target, transition] tuples, so
    // we map [target, transition] → [scope.current, ...target, transition].
    const sequence = item.animationSequence.map((segment) => [
      scope.current,
      ...segment,
    ]);

    let cancelled = false;
    Promise.resolve(animate(sequence))
      .then(() => {
        if (!cancelled) onComplete(item.id);
      })
      .catch(() => {
        // animation can be interrupted if the component unmounts; ignore
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      ref={scope}
      className="gm-trail__item"
      style={{
        left: item.x,
        top: item.y,
        rotate: item.rotation,
      }}
    >
      {item.child}
    </motion.div>
  );
};

const ImageTrail = ({
  children,
  newOnTop = true,
  rotationRange = 15,
  containerRef,
  animationSequence = DEFAULT_SEQUENCE,
  interval = 100,
}) => {
  const [trail, setTrail] = useState([]);
  const trailRef = useRef(trail);
  trailRef.current = trail;

  const lastAddedTimeRef = useRef(0);
  const { position: mousePosition } = useMouseVector(containerRef);
  const lastMousePosRef = useRef(mousePosition);
  const currentIndexRef = useRef(0);
  const childrenArray = useMemo(() => Children.toArray(children), [children]);

  const addToTrail = useCallback(
    (mousePos) => {
      const newItem = {
        id: uuidv4(),
        x: mousePos.x,
        y: mousePos.y,
        rotation: (Math.random() - 0.5) * rotationRange * 2,
        animationSequence,
        scale: 1,
        child: childrenArray[currentIndexRef.current],
      };

      currentIndexRef.current =
        (currentIndexRef.current + 1) % childrenArray.length;

      if (newOnTop) {
        setTrail((prev) => [...prev, newItem]);
      } else {
        setTrail((prev) => [newItem, ...prev]);
      }
    },
    [childrenArray, rotationRange, animationSequence, newOnTop]
  );

  const removeFromTrail = useCallback((itemId) => {
    setTrail((prev) => prev.filter((it) => it.id !== itemId));
  }, []);

  useAnimationFrame((time) => {
    if (
      lastMousePosRef.current.x === mousePosition.x &&
      lastMousePosRef.current.y === mousePosition.y
    ) {
      return;
    }
    lastMousePosRef.current = mousePosition;

    const currentTime = time;

    if (currentTime - lastAddedTimeRef.current < interval) {
      return;
    }

    lastAddedTimeRef.current = currentTime;

    addToTrail(mousePosition);
  });

  return (
    <div className="gm-trail">
      {trail.map((item) => (
        <TrailItem key={item.id} item={item} onComplete={removeFromTrail} />
      ))}
    </div>
  );
};

export { ImageTrail };
export default ImageTrail;
