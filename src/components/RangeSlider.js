import React from 'react';
import '../styles/components/range-slider.css';

/**
 * Dual-handle range slider built on two overlapping native <input type="range">.
 *
 * Props:
 *   value:      [number, number] — current [low, high]
 *   onChange:   (newValue: [number, number]) => void
 *   min, max:   number — bounds
 *   step:       number — granularity (default 1)
 *   marks:      optional [{ value, label }] — drawn below the track
 */
const RangeSlider = ({ value, onChange, min = 0, max = 100, step = 1, marks = null }) => {
  const [low, high] = value;

  const handleLow = (e) => {
    const newLow = Math.min(Number(e.target.value), high);
    onChange([newLow, high]);
  };

  const handleHigh = (e) => {
    const newHigh = Math.max(Number(e.target.value), low);
    onChange([low, newHigh]);
  };

  const span = max - min || 1;
  const lowPct = ((low - min) / span) * 100;
  const highPct = ((high - min) / span) * 100;

  return (
    <div className="range-slider">
      <div className="range-slider__track" />
      <div
        className="range-slider__range"
        style={{ left: `${lowPct}%`, width: `${Math.max(highPct - lowPct, 0)}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={handleLow}
        className="range-slider__input range-slider__input--low"
        aria-label="Minimum value"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={handleHigh}
        className="range-slider__input range-slider__input--high"
        aria-label="Maximum value"
      />
      {marks && marks.length > 0 && (
        <div className="range-slider__marks">
          {marks.map((m) => (
            <span
              key={m.value}
              className="range-slider__mark"
              style={{ left: `${((m.value - min) / span) * 100}%` }}
            >
              {m.label !== undefined ? m.label : m.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default RangeSlider;
