import React from 'react';
import PropTypes from 'prop-types';
import './input.css';

/** A text input field component with label and hint support */
export const Input = ({
  label = '',
  placeholder = '',
  value,
  onChange,
  hint = '',
  error = false,
  disabled = false,
  type = 'text',
  id,
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="storybook-input-wrapper">
      {label && (
        <label htmlFor={inputId} className="storybook-input-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={[
          'storybook-input',
          error ? 'storybook-input--error' : '',
          disabled ? 'storybook-input--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {hint && (
        <span className={['storybook-input-hint', error ? 'storybook-input-hint--error' : ''].filter(Boolean).join(' ')}>
          {hint}
        </span>
      )}
    </div>
  );
};

Input.propTypes = {
  /** Label text shown above the input */
  label: PropTypes.string,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Current value */
  value: PropTypes.string,
  /** Change handler */
  onChange: PropTypes.func,
  /** Helper / hint text shown below the input */
  hint: PropTypes.string,
  /** Whether the input is in an error state */
  error: PropTypes.bool,
  /** Whether the input is disabled */
  disabled: PropTypes.bool,
  /** HTML input type */
  type: PropTypes.oneOf(['text', 'email', 'password', 'number', 'search', 'tel', 'url']),
  /** Optional explicit id for the input element */
  id: PropTypes.string,
};
