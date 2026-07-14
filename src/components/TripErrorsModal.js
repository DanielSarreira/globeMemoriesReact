import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { groupErrorsBySection } from '../utils/tripValidation';

/**
 * Modal that shows ALL form errors grouped by section, with a "Jump to
 * section" button per group and a click-to-close overlay.
 *
 * Props:
 *   - isOpen:        whether the modal is visible
 *   - errors:        array of structured errors from validateTripForm
 *   - onClose:       called when the user dismisses the modal
 *   - onJumpToSection: called with the tab key when a user clicks
 *                      "Ir para a secção X" (we use it to switch the
 *                      active tab in MyTravels so the user lands on
 *                      the right place)
 */
const TripErrorsModal = ({ isOpen, errors = [], onClose, onJumpToSection }) => {
  // The TripErrorsModal lives inside the trip-planner form (which has
  // its own z-index stacking context with z-index 2147483647, the max
  // int). A normal render would put us below the form. We use
  // createPortal to mount the modal at the document root, escaping
  // the form's stacking context. Combined with z-index 2147483648
  // (above max int via the `2147483647 + 1` trick), the modal always
  // sits on top of everything.
  const [container] = useState(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.setAttribute('data-trip-errors-modal-portal', '');
    // The container itself is `position: fixed` so the modal anchors
    // to the viewport regardless of where in the DOM tree it is
    // mounted.
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '0';
    el.style.height = '0';
    el.style.zIndex = '2147483648';
    return el;
  });

  useEffect(() => {
    if (!container) return undefined;
    document.body.appendChild(container);
    return () => {
      // Only remove if still attached (React StrictMode mounts twice).
      if (container.parentNode === document.body) {
        document.body.removeChild(container);
      }
    };
  }, [container]);

  if (!isOpen || !container) return null;

  const grouped = groupErrorsBySection(errors);
  const totalErrors = errors.length;
  const totalSections = grouped.length;

  const handleJump = (tab) => {
    if (onJumpToSection) onJumpToSection(tab);
    if (onClose) onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return createPortal(
    <div
      className="confirm-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trip-errors-modal-title"
      style={{ alignItems: 'flex-start', paddingTop: '40px' }}
    >
      <div
        className="confirm-modal-content trip-errors-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '92%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '2px solid #e74c3c',
            backgroundColor: '#fff5f5',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        >
          <div>
            <h2
              id="trip-errors-modal-title"
              style={{ margin: 0, color: '#c0392b', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span aria-hidden="true">⚠️</span>
              {totalErrors === 1
                ? 'Falta preencher 1 campo'
                : `Faltam preencher ${totalErrors} campos`}
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#7f8c8d', fontSize: '13px' }}>
              em {totalSections} secção{totalSections !== 1 ? 'es' : ''} do formulário · reveja antes de publicar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#7f8c8d',
              lineHeight: 1,
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {grouped.map((group) => (
            <section
              key={group.section}
              aria-labelledby={`err-group-${group.section}`}
              style={{
                marginBottom: '20px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                overflow: 'hidden',
              }}
            >
              {/* Group header */}
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: '#f0f0f0',
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <h3
                  id={`err-group-${group.section}`}
                  style={{ margin: 0, fontSize: '15px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span aria-hidden="true">{group.sectionIcon}</span>
                  {group.sectionLabel}
                  <span
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginLeft: '6px',
                    }}
                  >
                    {group.errors.length}
                  </span>
                </h3>
                {onJumpToSection && (
                  <button
                    type="button"
                    onClick={() => handleJump(group.tab)}
                    style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    Ir para a secção →
                  </button>
                )}
              </header>

              {/* Error list */}
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: '8px 14px',
                }}
              >
                {group.errors.map((err, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 0',
                      borderTop: idx > 0 ? '1px dashed #e0e0e0' : 'none',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        color: '#e74c3c',
                        fontSize: '14px',
                        marginTop: '2px',
                      }}
                    >
                      ●
                    </span>
                    <div style={{ flex: 1, fontSize: '14px', color: '#333' }}>
                      {err.itemLabel && (
                        <div style={{ fontWeight: 600, color: '#2c3e50', marginBottom: '2px' }}>
                          {err.itemLabel}
                          {err.field && err.field !== 'name' && (
                            <span style={{ fontWeight: 400, color: '#7f8c8d', marginLeft: '6px' }}>
                              → {err.field}
                            </span>
                          )}
                        </div>
                      )}
                      <div>{err.message}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Helpful footer note */}
          <div
            style={{
              backgroundColor: '#fff8e1',
              border: '1px solid #ffe082',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#5d4037',
              marginTop: '8px',
            }}
          >
            💡 <strong>Os seus dados foram preservados.</strong> Reveja os campos em falta e tente novamente — nada do que já preencheu se perde.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            backgroundColor: '#fafafa',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="button button-primary"
            style={{ minWidth: '120px' }}
          >
            Fechar e corrigir
          </button>
        </div>
      </div>
    </div>,
    container,
  );
};

export default TripErrorsModal;
