import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import './Sheet.css';

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Sheet = ({ open, onClose, title, children, closeOnBackdrop = true }) => {
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
          className="gm-sheet__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => { if (closeOnBackdrop) onClose?.(); }}
        >
          <motion.div
            ref={ref}
            className="gm-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gm-sheet__handle" aria-hidden="true" />
            {title && (
              <header className="gm-sheet__header">
                <h2 className="gm-sheet__title">{title}</h2>
                <button type="button" className="gm-sheet__close" aria-label="Fechar" onClick={onClose}>
                  <X size={18} strokeWidth={1.75} />
                </button>
              </header>
            )}
            <div className="gm-sheet__body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

Sheet.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  closeOnBackdrop: PropTypes.bool,
};

export default Sheet;
