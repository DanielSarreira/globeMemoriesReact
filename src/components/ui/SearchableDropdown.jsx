import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import './SearchableDropdown.css';

/**
 * SearchableDropdown — premium searchable combobox.
 *
 * Round 83 — promoted from a Q&A-local helper to a shared
 * UI primitive. We need it in two places now:
 *   1. The Q&A forum filters (already used it) — the user
 *      asked for a search box on the trip wizard's País /
 *      Cidade selects too, and the wizard has 200+ countries
 *      with thousands of cities; a native <select> is
 *      unusable on mobile.
 *   2. The TripWizard destinations row (the País + Cidade
 *      fields at the very top of the create-trip flow).
 *
 * Behaviour:
 *   - Type to filter the option list (case-insensitive,
 *     substring match on `labelKey`)
 *   - Arrow keys to move highlight, Enter to commit, Escape
 *     to close, Backspace on empty input to clear the value
 *   - Click outside to close
 *   - The `options` array is `{ [valueKey]: any, [labelKey]: string }[]`
 *   - `value` is `null` or matches one of `options[i][valueKey]`
 *   - When `value` is set, the input shows the resolved label
 *     and is read-only (single-select)
 *
 * Styled in `SearchableDropdown.css` (extracted from the
 * original `qanda.css` `.gm-dd` block so the TripWizard can
 * reuse the same look).
 */
const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  labelKey = 'label',
  valueKey = 'value',
  emptyMessage = 'Nenhum resultado encontrado',
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const filtered = options.filter((opt) =>
    String(opt[labelKey] || '').toLowerCase().includes(search.toLowerCase())
  );
  const selectedLabel = value
    ? options.find((opt) => opt[valueKey] === value)?.[labelKey] || ''
    : '';

  const handleSelect = (val) => {
    onChange(val);
    setShowOptions(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && value && !search) {
      e.preventDefault();
      onChange(null);
      setSearch('');
      setShowOptions(true);
      return;
    }
    if (!showOptions && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setShowOptions(true);
      return;
    }
    if (showOptions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((p) => (p < filtered.length - 1 ? p + 1 : p));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((p) => (p > 0 ? p - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && filtered[focusedIndex]) {
          handleSelect(filtered[focusedIndex][valueKey]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowOptions(false);
        setFocusedIndex(-1);
      }
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`gm-dd ${disabled ? 'gm-dd--disabled' : ''} ${showOptions ? 'gm-dd--open' : ''} ${className}`}
    >
      <div className="gm-dd__input-wrap">
        <input
          type="text"
          value={selectedLabel || search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => !disabled && setShowOptions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`gm-dd__input ${value ? 'has-value' : ''}`}
          autoComplete="off"
          spellCheck="false"
          role="combobox"
          aria-expanded={showOptions}
          aria-haspopup="listbox"
        />
        <ChevronDown size={14} className="gm-dd__arrow" />
      </div>
      <AnimatePresence>
        {showOptions && filtered.length > 0 && (
          <motion.ul
            className="gm-dd__list"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {filtered.map((opt, idx) => (
              <li
                key={String(opt[valueKey])}
                onMouseDown={() => handleSelect(opt[valueKey])}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={`gm-dd__option ${focusedIndex === idx ? 'gm-dd__option--focused' : ''} ${value === opt[valueKey] ? 'gm-dd__option--selected' : ''}`}
                role="option"
                aria-selected={value === opt[valueKey]}
              >
                {opt[labelKey]}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      {showOptions && filtered.length === 0 && (
        <div className="gm-dd__empty">{emptyMessage}</div>
      )}
    </div>
  );
};

SearchableDropdown.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  labelKey: PropTypes.string,
  valueKey: PropTypes.string,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

export default SearchableDropdown;
