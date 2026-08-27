/**
 * Segmented.jsx — pill-style multi-option switch.
 *
 * Used in Step 5 (Rever) for the trip privacy selector
 * (🌍 Pública / 🔒 Privada) and anywhere else the user picks
 * one of N mutually-exclusive options inline (no dropdown).
 *
 * Props:
 *   - value:    currently selected option's value
 *   - onChange: (newValue) => void
 *   - options:  [{ value, label, icon?, hint? }]
 *   - tone:     'brand' (default) or 'accent'
 */
import React from 'react';
import PropTypes from 'prop-types';
import './Segmented.css';

const Segmented = ({ value, onChange, options, tone = 'brand' }) => {
  return (
    <div
      className={`gm-segmented gm-segmented--${tone}`}
      role="radiogroup"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`gm-segmented__option${isActive ? ' gm-segmented__option--active' : ''}`}
            onClick={() => onChange?.(opt.value)}
          >
            {Icon && <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />}
            <span className="gm-segmented__label">{opt.label}</span>
            {opt.hint && <span className="gm-segmented__hint">{opt.hint}</span>}
          </button>
        );
      })}
    </div>
  );
};

Segmented.propTypes = {
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
    hint: PropTypes.string,
  })).isRequired,
  tone: PropTypes.oneOf(['brand', 'accent']),
};

export default Segmented;
