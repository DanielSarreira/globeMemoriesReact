/**
 * ProgressRing.jsx — compact circular progress indicator.
 *
 * Used in the wizard's Step 4 header to show "3 de 7 secções
 * concluídas" — a small donut with the percentage filled in the
 * centre. The ring is SVG-based so it scales crisply on any DPI.
 *
 * Props:
 *   - value:   completed count (number)
 *   - total:   total count (number)
 *   - size:    diameter in pixels (default 36)
 *   - stroke:  ring thickness in pixels (default 3)
 *   - label:   optional text inside the ring (overrides percentage)
 *   - tone:    'brand' (default blue) or 'accent' (orange)
 */
import React from 'react';
import PropTypes from 'prop-types';
import './ProgressRing.css';

const ProgressRing = ({
  value,
  total,
  size = 36,
  stroke = 3,
  label,
  tone = 'brand',
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div
      className={`gm-progress-ring gm-progress-ring--${tone}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label || `${value} de ${total} secções concluídas`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          className="gm-progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="gm-progress-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ strokeWidth: stroke }}
        />
      </svg>
      <span className="gm-progress-ring__label">
        {label || `${Math.round(pct * 100)}%`}
      </span>
    </div>
  );
};

ProgressRing.propTypes = {
  value: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  size: PropTypes.number,
  stroke: PropTypes.number,
  label: PropTypes.string,
  tone: PropTypes.oneOf(['brand', 'accent']),
};

export default ProgressRing;
