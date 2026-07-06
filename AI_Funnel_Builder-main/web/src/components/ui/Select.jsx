// =============================================================================
// AI FUNNEL PLATFORM - Select Component (Self-Contained)
// =============================================================================
// Dropdown select with search, multi-select, loading, and accessibility
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const SELECT_STYLES = `
/* Select Wrapper */
.select-wrapper {
  position: relative;
  width: 100%;
}

/* Label */
.select-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
}

.select-label--required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.125rem;
}

/* Select Container */
.select-container {
  position: relative;
  width: 100%;
}

/* Select Trigger */
.select-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-family: inherit;
  font-size: 0.875rem;
  color: #111827;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
  text-align: left;
}

.select-trigger:hover:not(:disabled) {
  border-color: #9ca3af;
}

.select-trigger:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-trigger:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.select-trigger--open {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-trigger--error {
  border-color: #ef4444;
}

.select-trigger--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Sizes */
.select-trigger--sm {
  height: 36px;
  padding: 0 2rem 0 0.75rem;
  font-size: 0.813rem;
}

.select-trigger--md {
  height: 40px;
  padding: 0 2.5rem 0 0.875rem;
  font-size: 0.875rem;
}

.select-trigger--lg {
  height: 48px;
  padding: 0 2.5rem 0 1rem;
  font-size: 1rem;
}

/* Select Value */
.select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-placeholder {
  color: #9ca3af;
}

/* Multi-select tags */
.select-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex: 1;
  overflow: hidden;
}

.select-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 0.75rem;
  border-radius: 4px;
}

.select-tag__remove {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
}

.select-tag__remove:hover {
  opacity: 0.8;
}

.select-tag__remove svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* Icons */
.select-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #6b7280;
  pointer-events: none;
  transition: transform 0.2s ease-in-out;
}

.select-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.select-trigger--open .select-icon {
  transform: translateY(-50%) rotate(180deg);
}

.select-icon--loading {
  animation: select-spin 1s linear infinite;
}

@keyframes select-spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

/* Clear Button */
.select-clear {
  position: absolute;
  right: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  padding: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
}

.select-clear:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.select-clear svg {
  width: 1rem;
  height: 1rem;
}

/* Dropdown */
.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 300px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 50;
  animation: select-dropdown-appear 0.15s ease-out;
}

@keyframes select-dropdown-appear {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Search Input */
.select-search {
  position: sticky;
  top: 0;
  padding: 0.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.select-search input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  outline: none;
}

.select-search input:focus {
  border-color: #3b82f6;
}

/* Options List */
.select-options {
  max-height: 240px;
  overflow-y: auto;
  padding: 0.25rem;
}

.select-options::-webkit-scrollbar {
  width: 8px;
}

.select-options::-webkit-scrollbar-track {
  background-color: #f3f4f6;
  border-radius: 4px;
}

.select-options::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 4px;
}

.select-options::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

/* Option */
.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s ease-in-out;
  user-select: none;
}

.select-option:hover {
  background-color: #f3f4f6;
}

.select-option--selected {
  background-color: #eff6ff;
  color: #3b82f6;
}

.select-option--disabled {
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.select-option--disabled:hover {
  background-color: transparent;
}

.select-option__label {
  flex: 1;
}

.select-option__check {
  display: flex;
  color: #3b82f6;
}

.select-option__check svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* Empty State */
.select-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Loading State */
.select-loading {
  padding: 2rem 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Helper Text */
.select-helper {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: 0.813rem;
  line-height: 1.4;
  color: #6b7280;
  margin-top: 0.375rem;
}

.select-error {
  color: #ef4444;
}

.select-error svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

/* Dark Mode */
.dark .select-label {
  color: #e5e7eb;
}

.dark .select-trigger {
  color: #f3f4f6;
  background-color: #1f2937;
  border-color: #374151;
}

.dark .select-trigger:hover:not(:disabled) {
  border-color: #4b5563;
}

.dark .select-trigger:disabled {
  background-color: #111827;
  color: #6b7280;
}

.dark .select-placeholder {
  color: #6b7280;
}

.dark .select-dropdown {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .select-search {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .select-search input {
  background-color: #111827;
  border-color: #374151;
  color: #e5e7eb;
}

.dark .select-options::-webkit-scrollbar-track {
  background-color: #111827;
}

.dark .select-options::-webkit-scrollbar-thumb {
  background-color: #374151;
}

.dark .select-option {
  color: #e5e7eb;
}

.dark .select-option:hover {
  background-color: #374151;
}

.dark .select-option--selected {
  background-color: #1e3a5f;
}

.dark .select-helper {
  color: #9ca3af;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .select-trigger,
  .select-option,
  .select-dropdown {
    transition: none;
    animation: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'select');
  styleElement.textContent = SELECT_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// SELECT COMPONENT
// =============================================================================

const Select = forwardRef(({
  // Options
  options = [],
  value,
  defaultValue,
  onChange,
  
  // Configuration
  multiple = false,
  searchable = false,
  clearable = false,
  disabled = false,
  loading = false,
  
  // Styling
  size = 'md',
  className = '',
  
  // Label
  label,
  placeholder = 'Select...',
  
  // Validation
  error,
  helperText,
  required = false,
  
  // Search
  onSearch,
  searchPlaceholder = 'Search...',
  
  // Custom rendering
  renderOption,
  renderValue,
  
  // Other
  name,
  id,
  
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState(
    multiple 
      ? (value || defaultValue || [])
      : (value !== undefined ? [value] : defaultValue ? [defaultValue] : [])
  );
  
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Filter options based on search
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Handle option selection
  const handleSelectOption = (option) => {
    if (option.disabled) return;

    if (multiple) {
      const isSelected = selectedValues.includes(option.value);
      const newValues = isSelected
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      
      setSelectedValues(newValues);
      onChange?.(newValues);
    } else {
      setSelectedValues([option.value]);
      onChange?.(option.value);
      setIsOpen(false);
    }
  };

  // Handle clear
  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedValues([]);
    onChange?.(multiple ? [] : null);
  };

  // Handle remove tag
  const handleRemoveTag = (e, optionValue) => {
    e.stopPropagation();
    const newValues = selectedValues.filter(v => v !== optionValue);
    setSelectedValues(newValues);
    onChange?.(newValues);
  };

  // Get display value
  const getDisplayValue = () => {
    if (selectedValues.length === 0) {
      return <span className="select-placeholder">{placeholder}</span>;
    }

    if (multiple) {
      const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));
      return (
        <div className="select-tags">
          {selectedOptions.map(option => (
            <span key={option.value} className="select-tag">
              {option.label}
              <button
                type="button"
                className="select-tag__remove"
                onClick={(e) => handleRemoveTag(e, option.value)}
                aria-label={`Remove ${option.label}`}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      );
    }

    const selectedOption = options.find(opt => opt.value === selectedValues[0]);
    if (renderValue) {
      return renderValue(selectedOption);
    }
    return <span className="select-value">{selectedOption?.label}</span>;
  };

  // Build classes
  const triggerClasses = [
    'select-trigger',
    `select-trigger--${size}`,
    isOpen && 'select-trigger--open',
    error && 'select-trigger--error',
  ].filter(Boolean).join(' ');

  const selectId = id || `select-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`select-wrapper ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className={`select-label ${required ? 'select-label--required' : ''}`}
        >
          {label}
        </label>
      )}

      <div className="select-container">
        <button
          ref={ref}
          id={selectId}
          type="button"
          className={triggerClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label}
          {...props}
        >
          {getDisplayValue()}
          
          {clearable && selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              className="select-clear"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          <span className={`select-icon ${loading ? 'select-icon--loading' : ''}`}>
            {loading ? (
              <svg fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
              </svg>
            ) : (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </span>
        </button>

        {isOpen && (
          <div className="select-dropdown">
            {searchable && (
              <div className="select-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                />
              </div>
            )}

            <div className="select-options" role="listbox">
              {loading ? (
                <div className="select-loading">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="select-empty">No options found</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const optionClasses = [
                    'select-option',
                    isSelected && 'select-option--selected',
                    option.disabled && 'select-option--disabled',
                  ].filter(Boolean).join(' ');

                  return (
                    <div
                      key={option.value}
                      className={optionClasses}
                      onClick={() => handleSelectOption(option)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled}
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <>
                          <span className="select-option__label">{option.label}</span>
                          {isSelected && (
                            <span className="select-option__check">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {(error || helperText) && (
        <div className={`select-helper ${error ? 'select-error' : ''}`}>
          {error && (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// =============================================================================
// PROP TYPES
// =============================================================================

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  defaultValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  ]),
  onChange: PropTypes.func,
  multiple: PropTypes.bool,
  searchable: PropTypes.bool,
  clearable: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  onSearch: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  renderOption: PropTypes.func,
  renderValue: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Select;
export { Select };
