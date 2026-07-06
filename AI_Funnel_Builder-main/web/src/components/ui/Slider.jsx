// =============================================================================
// AI FUNNEL PLATFORM - Slider Component (Self-Contained)
// =============================================================================
// Range slider with single/dual handles, min/max, step, and value display
// All styles included - no external CSS dependencies
// =============================================================================

import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const SLIDER_STYLES = `
/* Slider Container */
.slider-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

/* Label */
.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.slider-label__value {
  font-weight: 600;
  color: #3b82f6;
}

/* Slider Container */
.slider-container {
  position: relative;
  width: 100%;
  padding: 0.75rem 0;
}

/* Track */
.slider-track {
  position: relative;
  width: 100%;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  cursor: pointer;
}

.slider-track--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Range (filled portion) */
.slider-range {
  position: absolute;
  height: 100%;
  background-color: #3b82f6;
  border-radius: 3px;
  pointer-events: none;
  transition: background-color 0.2s ease-in-out;
}

.slider-track--disabled .slider-range {
  background-color: #9ca3af;
}

/* Thumb */
.slider-thumb {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background-color: #ffffff;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider-thumb:hover {
  border-width: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.slider-thumb:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.1);
}

.slider-thumb:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.slider-track--disabled .slider-thumb {
  cursor: not-allowed;
  border-color: #9ca3af;
}

.slider-track--disabled .slider-thumb:hover {
  border-width: 2px;
  transform: translate(-50%, -50%);
}

/* Tooltip */
.slider-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.5rem;
  background-color: #1f2937;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.slider-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1f2937;
}

.slider-thumb:hover .slider-tooltip,
.slider-thumb:active .slider-tooltip {
  opacity: 1;
}

.slider--always-show-tooltip .slider-tooltip {
  opacity: 1;
}

/* Marks */
.slider-marks {
  position: relative;
  width: 100%;
  height: 20px;
  margin-top: 0.5rem;
}

.slider-mark {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.slider-mark__dot {
  width: 4px;
  height: 4px;
  background-color: #d1d5db;
  border-radius: 50%;
}

.slider-mark--active .slider-mark__dot {
  background-color: #3b82f6;
}

.slider-mark__label {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Sizes */
.slider-track--sm {
  height: 4px;
}

.slider-track--sm .slider-thumb {
  width: 16px;
  height: 16px;
}

.slider-track--lg {
  height: 8px;
}

.slider-track--lg .slider-thumb {
  width: 24px;
  height: 24px;
}

/* Variants */
.slider--success .slider-range {
  background-color: #10b981;
}

.slider--success .slider-thumb {
  border-color: #10b981;
}

.slider--warning .slider-range {
  background-color: #f59e0b;
}

.slider--warning .slider-thumb {
  border-color: #f59e0b;
}

.slider--danger .slider-range {
  background-color: #ef4444;
}

.slider--danger .slider-thumb {
  border-color: #ef4444;
}

/* Min/Max Labels */
.slider-minmax {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Dark Mode */
.dark .slider-label {
  color: #e5e7eb;
}

.dark .slider-track {
  background-color: #374151;
}

.dark .slider-thumb {
  background-color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark .slider-mark__dot {
  background-color: #6b7280;
}

.dark .slider-mark__label,
.dark .slider-minmax {
  color: #9ca3af;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .slider-thumb,
  .slider-range,
  .slider-tooltip {
    transition: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'slider');
  styleElement.textContent = SLIDER_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// SLIDER COMPONENT
// =============================================================================

const Slider = forwardRef(({
  // Value
  value,
  defaultValue,
  onChange,
  
  // Range
  min = 0,
  max = 100,
  step = 1,
  
  // Dual handle (range mode)
  range = false,
  
  // Styling
  size = 'md',
  variant = 'primary',
  className = '',
  
  // Label
  label,
  showValue = true,
  formatValue,
  
  // Tooltip
  showTooltip = true,
  alwaysShowTooltip = false,
  tooltipFormatter,
  
  // Marks
  marks,
  showMinMax = false,
  
  // State
  disabled = false,
  
  // Events
  onChangeCommitted,
  
  ...props
}, ref) => {
  useEffect(() => {
    injectStyles();
  }, []);

  // State
  const [internalValue, setInternalValue] = useState(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    return range ? [min, max / 2] : min;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [activeThumb, setActiveThumb] = useState(null);
  const trackRef = useRef(null);

  // Controlled vs uncontrolled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  // Normalize value to array
  const normalizedValue = Array.isArray(currentValue) ? currentValue : [currentValue];
  const [minValue, maxValue] = range ? normalizedValue : [normalizedValue[0], max];

  // Format value for display
  const formatDisplayValue = useCallback((val) => {
    if (formatValue) return formatValue(val);
    if (tooltipFormatter) return tooltipFormatter(val);
    return val.toString();
  }, [formatValue, tooltipFormatter]);

  // Calculate percentage
  const getPercentage = useCallback((val) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  // Get value from position
  const getValueFromPosition = useCallback((clientX) => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    
    // Snap to step
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step]);

  // Handle value change
  const handleValueChange = useCallback((newValue) => {
    if (disabled) return;

    const clampedValue = Array.isArray(newValue)
      ? newValue.map(v => Math.max(min, Math.min(max, v)))
      : Math.max(min, Math.min(max, newValue));

    if (!isControlled) {
      setInternalValue(clampedValue);
    }
    
    onChange?.(clampedValue);
  }, [disabled, isControlled, min, max, onChange]);

  // Mouse/Touch handlers
  const handleThumbMouseDown = useCallback((thumbIndex) => (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    setActiveThumb(thumbIndex);
  }, [disabled]);

  const handleTrackClick = useCallback((e) => {
    if (disabled || isDragging) return;
    
    const newValue = getValueFromPosition(e.clientX);
    
    if (range) {
      const [currentMin, currentMax] = normalizedValue;
      const distToMin = Math.abs(newValue - currentMin);
      const distToMax = Math.abs(newValue - currentMax);
      
      if (distToMin < distToMax) {
        handleValueChange([newValue, currentMax]);
      } else {
        handleValueChange([currentMin, newValue]);
      }
    } else {
      handleValueChange(newValue);
    }
  }, [disabled, isDragging, range, normalizedValue, getValueFromPosition, handleValueChange]);

  // Mouse move handler
  useEffect(() => {
    if (!isDragging || disabled) return;

    const handleMouseMove = (e) => {
      const newValue = getValueFromPosition(e.clientX);
      
      if (range) {
        const [currentMin, currentMax] = normalizedValue;
        if (activeThumb === 0) {
          handleValueChange([Math.min(newValue, currentMax), currentMax]);
        } else {
          handleValueChange([currentMin, Math.max(newValue, currentMin)]);
        }
      } else {
        handleValueChange(newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveThumb(null);
      onChangeCommitted?.(currentValue);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, disabled, range, activeThumb, normalizedValue, currentValue, getValueFromPosition, handleValueChange, onChangeCommitted]);

  // Keyboard handlers
  const handleKeyDown = useCallback((thumbIndex) => (e) => {
    if (disabled) return;

    let newValue;
    const currentVal = normalizedValue[thumbIndex];

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(min, currentVal - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(max, currentVal + step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      case 'PageDown':
        e.preventDefault();
        newValue = Math.max(min, currentVal - step * 10);
        break;
      case 'PageUp':
        e.preventDefault();
        newValue = Math.min(max, currentVal + step * 10);
        break;
      default:
        return;
    }

    if (range) {
      const [currentMin, currentMax] = normalizedValue;
      if (thumbIndex === 0) {
        handleValueChange([Math.min(newValue, currentMax), currentMax]);
      } else {
        handleValueChange([currentMin, Math.max(newValue, currentMin)]);
      }
    } else {
      handleValueChange(newValue);
    }
  }, [disabled, range, normalizedValue, min, max, step, handleValueChange]);

  // Build classes
  const wrapperClasses = [
    'slider-wrapper',
    `slider--${variant}`,
    alwaysShowTooltip && 'slider--always-show-tooltip',
    className,
  ].filter(Boolean).join(' ');

  const trackClasses = [
    'slider-track',
    `slider-track--${size}`,
    disabled && 'slider-track--disabled',
  ].filter(Boolean).join(' ');

  // Render marks
  const renderMarks = () => {
    if (!marks) return null;

    const markPositions = Array.isArray(marks)
      ? marks
      : Array.from({ length: Math.floor((max - min) / marks) + 1 }, (_, i) => min + i * marks);

    return (
      <div className="slider-marks">
        {markPositions.map((mark) => {
          const markValue = typeof mark === 'object' ? mark.value : mark;
          const markLabel = typeof mark === 'object' ? mark.label : markValue;
          const percentage = getPercentage(markValue);
          const isActive = range
            ? markValue >= minValue && markValue <= maxValue
            : markValue <= minValue;

          return (
            <div
              key={markValue}
              className={`slider-mark ${isActive ? 'slider-mark--active' : ''}`}
              style={{ left: `${percentage}%` }}
            >
              <span className="slider-mark__dot" />
              <span className="slider-mark__label">{markLabel}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={wrapperClasses} ref={ref} {...props}>
      {/* Label */}
      {label && (
        <div className="slider-label">
          <span>{label}</span>
          {showValue && (
            <span className="slider-label__value">
              {range
                ? `${formatDisplayValue(minValue)} - ${formatDisplayValue(maxValue)}`
                : formatDisplayValue(minValue)}
            </span>
          )}
        </div>
      )}

      {/* Slider */}
      <div className="slider-container">
        <div
          ref={trackRef}
          className={trackClasses}
          onClick={handleTrackClick}
        >
          {/* Range */}
          <div
            className="slider-range"
            style={{
              left: `${getPercentage(minValue)}%`,
              right: `${100 - getPercentage(maxValue)}%`,
            }}
          />

          {/* Thumb(s) */}
          {normalizedValue.map((val, index) => (
            <div
              key={index}
              className="slider-thumb"
              style={{ left: `${getPercentage(val)}%` }}
              onMouseDown={handleThumbMouseDown(index)}
              onTouchStart={handleThumbMouseDown(index)}
              onKeyDown={handleKeyDown(index)}
              role="slider"
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={val}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
            >
              {showTooltip && (
                <div className="slider-tooltip">
                  {formatDisplayValue(val)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Marks */}
        {renderMarks()}
      </div>

      {/* Min/Max Labels */}
      {showMinMax && (
        <div className="slider-minmax">
          <span>{formatDisplayValue(min)}</span>
          <span>{formatDisplayValue(max)}</span>
        </div>
      )}
    </div>
  );
});

Slider.displayName = 'Slider';

// =============================================================================
// PROP TYPES
// =============================================================================

Slider.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  defaultValue: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(PropTypes.number),
  ]),
  onChange: PropTypes.func,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  range: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  className: PropTypes.string,
  label: PropTypes.string,
  showValue: PropTypes.bool,
  formatValue: PropTypes.func,
  showTooltip: PropTypes.bool,
  alwaysShowTooltip: PropTypes.bool,
  tooltipFormatter: PropTypes.func,
  marks: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.shape({
          value: PropTypes.number.isRequired,
          label: PropTypes.node,
        }),
      ])
    ),
  ]),
  showMinMax: PropTypes.bool,
  disabled: PropTypes.bool,
  onChangeCommitted: PropTypes.func,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Slider;
export { Slider };
