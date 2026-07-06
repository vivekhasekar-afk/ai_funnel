// =============================================================================
// AI FUNNEL PLATFORM - Textarea Component
// =============================================================================

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  resize = 'vertical',
  className = '',
  disabled = false,
  required = false,
  fullWidth = true,
  maxLength,
  showCount = false,
  value = '',
  onChange,
  ...props
}, ref) => {
  const textareaId = props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);
  const characterCount = value?.length || 0;

  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <div className={`textarea-wrapper ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`textarea-label block text-sm font-medium mb-2 ${
            hasError ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        className={`
          textarea
          block w-full px-4 py-3 
          text-base text-gray-900 dark:text-white
          bg-white dark:bg-gray-800
          border rounded-lg
          transition-all duration-200
          ${resizeClasses[resize] || resizeClasses.vertical}
          ${hasError
            ? 'border-red-500 focus:border-red-600 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled
            ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-60'
            : 'hover:border-gray-400 dark:hover:border-gray-500'
          }
          focus:outline-none focus:ring-2 focus:ring-opacity-50
          placeholder:text-gray-400 dark:placeholder:text-gray-500
        `}
        {...props}
      />

      <div className="textarea-footer mt-2 flex items-center justify-between">
        <div className="flex-1">
          {hasError && error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {!hasError && helperText && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </div>

        {showCount && maxLength && (
          <p className={`text-xs ml-4 ${
            characterCount > maxLength * 0.9
              ? 'text-orange-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  rows: PropTypes.number,
  resize: PropTypes.oneOf(['none', 'vertical', 'horizontal', 'both']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string,
};

export default Textarea;
