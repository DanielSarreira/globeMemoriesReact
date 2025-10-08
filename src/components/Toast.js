import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const Toast = ({ message, type, isVisible, show, onClose }) => {
  // Suportar tanto 'isVisible' quanto 'show' para compatibilidade
  const shouldShow = isVisible !== undefined ? isVisible : show;
  
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        onClose();
      }, 2600); // Aumentado para 2600ms (1000ms + 1600ms conforme solicitado)
      return () => clearTimeout(timer);
    }
  }, [shouldShow, onClose]);

  if (!shouldShow) return null;

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
  isVisible: PropTypes.bool,
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default Toast;