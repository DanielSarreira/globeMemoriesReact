import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './TextExpandable.css';

/**
 * TextExpandable — shows a clamped preview of long text. Expands smoothly
 * when the user clicks "Ler mais" / "Read more".
 *
 * Measures actual overflow to decide whether the toggle is even needed.
 */
const TextExpandable = ({ text = '', clamp = 6, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    setOverflow(ref.current.scrollHeight > ref.current.clientHeight + 1);
  }, [text, clamp]);

  return (
    <div
      className={`gm-text-expand ${className}`}
      style={{ '--gm-clamp': clamp }}
    >
      <p
        ref={ref}
        className={`gm-text-expand__text ${open ? 'gm-text-expand__text--open' : ''}`}
      >
        {text}
      </p>
      {(overflow || open) && (
        <button
          type="button"
          className="gm-text-expand__more"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        >
          {open ? 'Mostrar menos' : 'Ler mais'}
        </button>
      )}
    </div>
  );
};

TextExpandable.propTypes = {
  text: PropTypes.string,
  clamp: PropTypes.number,
  className: PropTypes.string,
};

export default TextExpandable;
