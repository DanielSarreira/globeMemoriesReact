import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const Toast = ({ message, type, isVisible, show, onClose }) => {
  // Suportar tanto 'isVisible' quanto 'show' para compatibilidade
  const shouldShow = isVisible !== undefined ? isVisible : show;
  
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        onClose();
      }, 2400); // 2400ms = 2.4 segundos
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