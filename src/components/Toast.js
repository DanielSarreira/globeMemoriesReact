// Legacy Toast component (replaced by src/components/ui/Toast.jsx).
// Kept as a stub so admin pages and legacy imports don't break.
// New code should use the global useToast() from src/components/ui.

import React, { useEffect } from "react";

const Toast = ({ message, type, show, onClose, isVisible }) => {
  const visible = show ?? isVisible;
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => onClose && onClose(), 2400);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  if (!visible || !message) return null;
  return (
    <div className={`toast ${type || "info"}`} role="status" aria-live="polite">
      {message}
    </div>
  );
};

export default Toast;
