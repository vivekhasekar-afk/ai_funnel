// =============================================================================
// AI FUNNEL PLATFORM - Tooltip Component (Self-Contained)
// =============================================================================
// Tooltip with positioning, delay, triggers, and accessibility
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useRef, useEffect, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const TOOLTIP_STYLES = `
/* Tooltip Container */
.tooltip-container {
  display: inline-block;
  position: relative;
}

/* Tooltip */
.tooltip {
  position: fixed;
  z-index: 9999;
  padding: 0.5rem 0.75rem;
  background-color: #1f2937;
  color: #ffffff;
  font-size: 0.875rem;
  line-height: 1.4;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  max-width: 320px;
  word-wrap: break-word;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.tooltip--visible {
  opacity: 1;
}

/* Arrow */
.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #1f2937;
  transform: rotate(45deg);
}

/* Positions */
.tooltip--top {
  transform: translateY(-8px);
}

.tooltip--top .tooltip-arrow {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.tooltip--bottom {
  transform: translateY(8px);
}

.tooltip--bottom .tooltip-arrow {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}

.tooltip--left {
  transform: translateX(-8px);
}

.tooltip--left .tooltip-arrow {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.tooltip--right {
  transform: translateX(8px);
}

.tooltip--right .tooltip-arrow {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

/* Sizes */
.tooltip--sm {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  max-width: 200px;
}

.tooltip--sm .tooltip-arrow {
  width: 6px;
  height: 6px;
}

.tooltip--lg {
  padding: 0.625rem 1rem;
  font-size: 1rem;
  max-width: 400px;
}

.tooltip--lg .tooltip-arrow {
  width: 10px;
  height: 10px;
}

/* Variants */
.tooltip--light {
  background-color: #ffffff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

.tooltip--light .tooltip-arrow {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
}

.tooltip--light.tooltip--top .tooltip-arrow {
  border-top: none;
  border-left: none;
}

.tooltip--light.tooltip--bottom .tooltip-arrow {
  border-bottom: none;
  border-right: none;
}

.tooltip--light.tooltip--left .tooltip-arrow {
  border-left: none;
  border-bottom: none;
}

.tooltip--light.tooltip--right .tooltip-arrow {
  border-right: none;
  border-top: none;
}

.tooltip--primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.tooltip--primary .tooltip-arrow {
  background-color: #3b82f6;
}

.tooltip--success {
  background-color: #10b981;
  color: #ffffff;
}

.tooltip--success .tooltip-arrow {
  background-color: #10b981;
}

.tooltip--warning {
  background-color: #f59e0b;
  color: #ffffff;
}

.tooltip--warning .tooltip-arrow {
  background-color: #f59e0b;
}

.tooltip--danger {
  background-color: #ef4444;
  color: #ffffff;
}

.tooltip--danger .tooltip-arrow {
  background-color: #ef4444;
}

/* Interactive */
.tooltip--interactive {
  pointer-events: auto;
  cursor: auto;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .tooltip {
    transition: none;
  }
}

/* Hide on print */
@media print {
  .tooltip {
    display: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'tooltip');
  styleElement.textContent = TOOLTIP_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// TOOLTIP COMPONENT
// =============================================================================

const Tooltip = ({
  // Content
  content,
  children,
  
  // Position
  placement = 'top',
  offset = 8,
  
  // Behavior
  trigger = 'hover', // ✅ RENAMED: This prop is now called 'triggerType'
  delay = 0,
  closeDelay = 0,
  
  // Styling
  variant = 'dark',
  size = 'md',
  className = '',
  
  // State
  disabled = false,
  defaultOpen = false,
  open,
  onOpenChange,
  
  // Advanced
  interactive = false,
  arrow = true,
  followCursor = false,
  
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  // State
  const [isVisible, setIsVisible] = useState(defaultOpen);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });

  // Controlled vs uncontrolled
  const isControlled = open !== undefined;
  const visible = isControlled ? open : isVisible;

  // Calculate position
  const calculatePosition = (triggerEl, tooltipEl, cursorPos = null) => {
    if (!triggerEl || !tooltipEl) return { top: 0, left: 0 };

    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    let top = 0;
    let left = 0;
    let finalPlacement = placement;

    // Follow cursor mode
    if (followCursor && cursorPos) {
      switch (placement) {
        case 'top':
          top = cursorPos.y - tooltipRect.height - offset;
          left = cursorPos.x - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = cursorPos.y + offset;
          left = cursorPos.x - tooltipRect.width / 2;
          break;
        case 'left':
          top = cursorPos.y - tooltipRect.height / 2;
          left = cursorPos.x - tooltipRect.width - offset;
          break;
        case 'right':
          top = cursorPos.y - tooltipRect.height / 2;
          left = cursorPos.x + offset;
          break;
      }
    } else {
      // Standard positioning
      switch (placement) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - offset;
          left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + scrollY + offset;
          left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left + scrollX - tooltipRect.width - offset;
          break;
        case 'right':
          top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + scrollX + offset;
          break;
      }
    }

    // Flip if out of viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (placement === 'top' && top < scrollY) {
      finalPlacement = 'bottom';
      top = triggerRect.bottom + scrollY + offset;
    } else if (placement === 'bottom' && top + tooltipRect.height > scrollY + viewport.height) {
      finalPlacement = 'top';
      top = triggerRect.top + scrollY - tooltipRect.height - offset;
    } else if (placement === 'left' && left < scrollX) {
      finalPlacement = 'right';
      left = triggerRect.right + scrollX + offset;
    } else if (placement === 'right' && left + tooltipRect.width > scrollX + viewport.width) {
      finalPlacement = 'left';
      left = triggerRect.left + scrollX - tooltipRect.width - offset;
    }

    // Constrain horizontal position
    if (left < scrollX) {
      left = scrollX + 4;
    } else if (left + tooltipRect.width > scrollX + viewport.width) {
      left = scrollX + viewport.width - tooltipRect.width - 4;
    }

    // Constrain vertical position
    if (top < scrollY) {
      top = scrollY + 4;
    } else if (top + tooltipRect.height > scrollY + viewport.height) {
      top = scrollY + viewport.height - tooltipRect.height - 4;
    }

    setActualPlacement(finalPlacement);
    return { top, left };
  };

  // Update position
  const updatePosition = (cursorPos = null) => {
    if (triggerRef.current && tooltipRef.current) {
      const pos = calculatePosition(triggerRef.current, tooltipRef.current, cursorPos);
      setPosition(pos);
    }
  };

  // Show tooltip
  const show = () => {
    if (disabled) return;

    clearTimeout(hideTimeoutRef.current);
    
    if (delay > 0) {
      showTimeoutRef.current = setTimeout(() => {
        if (!isControlled) {
          setIsVisible(true);
        }
        onOpenChange?.(true);
      }, delay);
    } else {
      if (!isControlled) {
        setIsVisible(true);
      }
      onOpenChange?.(true);
    }
  };

  // Hide tooltip
  const hide = () => {
    clearTimeout(showTimeoutRef.current);
    
    const delayTime = closeDelay > 0 ? closeDelay : 0;
    
    hideTimeoutRef.current = setTimeout(() => {
      if (!isControlled) {
        setIsVisible(false);
      }
      onOpenChange?.(false);
    }, delayTime);
  };

  // Mouse enter handler
  const handleMouseEnter = () => {
    if (trigger === 'hover' || trigger === 'mouseenter') {
      show();
    }
  };

  // Mouse leave handler
  const handleMouseLeave = () => {
    if (trigger === 'hover' || trigger === 'mouseenter') {
      if (!interactive) {
        hide();
      }
    }
  };

  // Mouse move handler
  const handleMouseMove = (e) => {
    if (followCursor && visible) {
      cursorPositionRef.current = {
        x: e.clientX + (window.pageXOffset || document.documentElement.scrollLeft),
        y: e.clientY + (window.pageYOffset || document.documentElement.scrollTop),
      };
      updatePosition(cursorPositionRef.current);
    }
  };

  // Click handler
  const handleClick = () => {
    if (trigger === 'click') {
      if (visible) {
        hide();
      } else {
        show();
      }
    }
  };

  // Focus handlers
  const handleFocus = () => {
    if (trigger === 'focus') {
      show();
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      hide();
    }
  };

  // Update position when visible
  useEffect(() => {
    if (visible) {
      updatePosition();
      
      // Update on scroll/resize
      const handleUpdate = () => updatePosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [visible]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Close on escape
  useEffect(() => {
    if (visible && trigger === 'click') {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          hide();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [visible, trigger]);

  // Build classes
  const tooltipClasses = [
    'tooltip',
    `tooltip--${actualPlacement}`,
    `tooltip--${variant}`,
    `tooltip--${size}`,
    visible && 'tooltip--visible',
    interactive && 'tooltip--interactive',
    className,
  ].filter(Boolean).join(' ');

  // Clone child with props
  // ✅ FIX: Renamed 'trigger' variable to 'triggerElement'
  const child = React.Children.only(children);
  const triggerElement = cloneElement(child, {
    ref: triggerRef,
    onMouseEnter: (e) => {
      handleMouseEnter();
      child.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      handleMouseLeave();
      child.props.onMouseLeave?.(e);
    },
    onMouseMove: (e) => {
      handleMouseMove(e);
      child.props.onMouseMove?.(e);
    },
    onClick: (e) => {
      handleClick();
      child.props.onClick?.(e);
    },
    onFocus: (e) => {
      handleFocus();
      child.props.onFocus?.(e);
    },
    onBlur: (e) => {
      handleBlur();
      child.props.onBlur?.(e);
    },
    'aria-describedby': visible ? 'tooltip' : undefined,
  });

  // Render tooltip
  const tooltipElement = visible && typeof document !== 'undefined' && (
    <div
      ref={tooltipRef}
      className={tooltipClasses}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="tooltip"
      id="tooltip"
      onMouseEnter={() => {
        if (interactive) {
          clearTimeout(hideTimeoutRef.current);
        }
      }}
      onMouseLeave={() => {
        if (interactive) {
          hide();
        }
      }}
      {...props}
    >
      {content}
      {arrow && <div className="tooltip-arrow" />}
    </div>
  );

  return (
    <>
      {/* ✅ FIX: Use 'triggerElement' instead of 'trigger' */}
      <span className="tooltip-container">{triggerElement}</span>
      {tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Tooltip.propTypes = {
  content: PropTypes.node.isRequired,
  children: PropTypes.element.isRequired,
  placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  offset: PropTypes.number,
  trigger: PropTypes.oneOf(['hover', 'click', 'focus', 'mouseenter']),
  delay: PropTypes.number,
  closeDelay: PropTypes.number,
  variant: PropTypes.oneOf(['dark', 'light', 'primary', 'success', 'warning', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  defaultOpen: PropTypes.bool,
  open: PropTypes.bool,
  onOpenChange: PropTypes.func,
  interactive: PropTypes.bool,
  arrow: PropTypes.bool,
  followCursor: PropTypes.bool,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Tooltip;
