import React from 'react';
import PropTypes from 'prop-types';
import './IconButton.css';

const IconButton = React.forwardRef(function IconButton(
  { variant = 'ghost', size = 'md', icon, label, className = '', disabled, ...rest },
  ref,
) {
  const cls = [
    'gm-iconbtn',
    size !== 'md' && `gm-iconbtn--${size}`,
    variant === 'on-photo' && 'gm-iconbtn--on-photo',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      type="button"
      className={cls}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...rest}
    >
      {icon}
    </button>
  );
});

IconButton.propTypes = {
  variant: PropTypes.oneOf(['ghost', 'on-photo']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default IconButton;
