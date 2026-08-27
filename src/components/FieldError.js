import React from 'react';

/**
 * Inline error display for a single form field.
 *
 * Renders nothing when `error` is null. Otherwise:
 *   - sets a red border on the input (or attaches `aria-invalid` so
 *     screen readers announce the field as bad)
 *   - shows the error message under the field with an icon
 *
 * The component is intentionally tiny and dependency-free so it can
 * be wrapped around any input (text, select, textarea, custom widgets)
 * without restructuring the surrounding form.
 *
 * Usage:
 *
 *   <FieldError error={errorFor('general', 'title')}>
 *     <input name="title" value={...} onChange={...} />
 *   </FieldError>
 */
const FieldError = ({ error, children, className = '' }) => {
  const hasError = !!error;

  // Clone the single child to add the red border + aria-invalid.
  // We do not override value/onChange because the child owns those.
  let styledChild = children;
  if (hasError && React.isValidElement(children)) {
    const isInputLike =
      children.type === 'input' ||
      children.type === 'textarea' ||
      children.type === 'select' ||
      (typeof children.type === 'function' && children.props.name);
    if (isInputLike) {
      styledChild = React.cloneElement(children, {
        'aria-invalid': 'true',
        style: {
          ...(children.props.style || {}),
          borderColor: '#DC2626',
          borderWidth: '2px',
          backgroundColor: '#fff5f5',
        },
      });
    }
  }

  return (
    <div
      className={`field-error-wrapper ${className} ${hasError ? 'has-error' : ''}`}
      data-has-error={hasError || undefined}
    >
      {styledChild}
      {hasError && (
        <div
          role="alert"
          className="field-error-message"
          data-testid="field-error"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#c0392b',
            fontSize: '12px',
            fontWeight: 500,
            marginTop: '4px',
            padding: '4px 0',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '14px' }}>⚠️</span>
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default FieldError;
