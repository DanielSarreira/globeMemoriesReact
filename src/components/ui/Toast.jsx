import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, X, AlertTriangle, Loader2 } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

const DURATIONS = { info: 4000, success: 6000, danger: 6000, loading: 60000 };
const ICONS = { success: CheckCircle2, info: Info, danger: AlertTriangle, loading: Loader2 };

let nextId = 1;

const ToastItem = ({ toast, onDismiss }) => {
  const Icon = ICONS[toast.kind] || Info;
  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      className={`gm-toast gm-toast--${toast.kind}`}
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="gm-toast__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <span className="gm-toast__body">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          className="gm-toast__action"
          onClick={() => { toast.action.onClick?.(); onDismiss(toast.id); }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className="gm-toast__dismiss"
        aria-label="Fechar"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={16} strokeWidth={2} />
      </button>
      <span
        className="gm-toast__progress"
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </motion.div>
  );
};

ToastItem.propTypes = {
  toast: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const show = useCallback((message, opts = {}) => {
    const kind = opts.kind || 'info';
    const id = nextId++;
    const duration = opts.duration ?? DURATIONS[kind] ?? 4000;
    const toast = { id, message, kind, duration, action: opts.action };
    setToasts((p) => [...p, toast]);
    // Round 85 — loading toasts don't auto-dismiss (the caller
    // dismisses them when the async work finishes via `toast.dismiss`).
    // We still register a long-fallback timer (60s) so a leaked loading
    // toast doesn't stay on screen forever if the caller forgets to
    // dismiss it.
    const t = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, t);
    return id;
  }, [dismiss]);

  useEffect(() => {
    const local = timers.current;
    return () => { local.forEach((t) => clearTimeout(t)); local.clear(); };
  }, []);

  const value = useMemo(() => ({
    show,
    success: (m, o) => show(m, { ...o, kind: 'success' }),
    info: (m, o) => show(m, { ...o, kind: 'info' }),
    danger: (m, o) => show(m, { ...o, kind: 'danger' }),
    loading: (m, o) => show(m, { ...o, kind: 'loading' }),
    dismiss,
  }), [show, dismiss]);

  if (typeof document === 'undefined') {
    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="gm-toast-host" aria-live="polite" aria-relevant="additions">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = { children: PropTypes.node };

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
  return ctx;
};
