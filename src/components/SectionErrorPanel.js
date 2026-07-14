import React from 'react';
import { TRIP_FORM_SECTIONS } from '../utils/tripValidation';

/**
 * Compact list of errors shown at the top of a tab.
 *
 * Renders nothing if there are no errors. Otherwise:
 *   - red box with the section's icon + label
 *   - bullet list of every error in the section, each pointing to
 *     the offending item + field (when present)
 *   - aria-live so screen readers announce the updates
 *
 * Use as a fallback for tabs where we haven't wrapped every field in
 * <FieldError>. The user always knows what to fix, even without the
 * full inline error UI on every input.
 */
const SectionErrorPanel = ({ section, errors = [] }) => {
  if (!errors || errors.length === 0) return null;

  const meta = TRIP_FORM_SECTIONS[section];
  if (!meta) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid={`section-error-panel-${section}`}
      style={{
        backgroundColor: '#fff5f5',
        border: '1px solid #e74c3c',
        borderLeft: '4px solid #e74c3c',
        borderRadius: '6px',
        padding: '12px 16px',
        margin: '12px 0',
        color: '#2c3e50',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
          fontWeight: 600,
          color: '#c0392b',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '18px' }}>⚠️</span>
        <span>
          {meta.icon} {meta.label} — {errors.length === 1 ? 'falta 1 campo' : `faltam ${errors.length} campos`} para preencher
        </span>
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '13px',
          color: '#555',
          lineHeight: 1.6,
        }}
      >
        {errors.map((err, idx) => (
          <li key={idx} data-testid="section-error-row">
            {err.itemLabel && (
              <strong style={{ color: '#2c3e50' }}>{err.itemLabel}: </strong>
            )}
            {err.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SectionErrorPanel;
