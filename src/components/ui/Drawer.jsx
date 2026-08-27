/**
 * Drawer.jsx — desktop right-side slide-in panel.
 *
 * The wizard's inline edit pattern: clicking a card in Step 4 opens
 * a Drawer (desktop) or a Sheet (mobile) WITHOUT leaving the wizard.
 * This file is the desktop variant — slides in from the right edge
 * with a backdrop that can be clicked to close.
 *
 * Behaviour:
 *   - Mounts to document.body via createPortal so it floats above
 *     the wizard's stacking context.
 *   - Locks body scroll while open (same as the existing Sheet).
 *   - Closes on ESC and backdrop click (configurable).
 *   - Restores focus to the previously-focused element on close.
 *   - Traps focus inside the panel for keyboard accessibility.
 *   - Framer Motion handles the slide-in animation.
 *
 * Visual contract:
 *   - Width: 480px on desktop (or 100% if prop is set).
 *   - Border-radius: 16px on the LEFT side only (the right edge
 *     sits flush against the viewport).
 *   - Shadow: large, casts left.
 */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Drawer = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 480,
  closeOnBackdrop = true,
}) => {
  const ref = useRef(null);
  const prevFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    prevFocus.current = typeof document !== 'undefined' ? document.activeElement : null;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && ref.current) {
        const nodes = ref.current.querySelectorAll(focusableSelector);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const first = ref.current?.querySelector(focusableSelector);
      first?.focus();
    }, 80);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="gm-drawer__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => { if (closeOnBackdrop) onClose?.(); }}
        >
          <motion.aside
            ref={ref}
            className="gm-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            style={{ width }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="gm-drawer__header">
              <div className="gm-drawer__titleblock">
                {title && <h2 className="gm-drawer__title">{title}</h2>}
                {subtitle && <p className="gm-drawer__subtitle">{subtitle}</p>}
              </div>
              <button type="button" className="gm-drawer__close" aria-label="Fechar" onClick={onClose}>
                <X size={18} strokeWidth={1.75} />
              </button>
            </header>
            <div className="gm-drawer__body">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

Drawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  width: PropTypes.number,
  closeOnBackdrop: PropTypes.bool,
};

export default Drawer;
