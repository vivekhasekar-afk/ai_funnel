// =============================================================================
// AI FUNNEL PLATFORM - Badge Component (Self-Contained)
// =============================================================================
// Status badge with colors, sizes, variants, icons, and shapes
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const BADGE_STYLES = `
/* Badge Base Styles */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.badge:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Sizes */
.badge--xs {
  padding: 2px 6px;
  font-size: 10px;
  min-height: 16px;
}

.badge--sm {
  padding: 3px 8px;
  font-size: 11px;
  min-height: 20px;
}

.badge--md {
  padding: 4px 10px;
  font-size: 12px;
  min-height: 24px;
}

.badge--lg {
  padding: 6px 12px;
  font-size: 14px;
  min-height: 28px;
}

/* Shapes */
.badge--rounded {
  border-radius: 4px;
}

.badge--pill {
  border-radius: 9999px;
}

.badge--square {
  border-radius: 0;
}

/* Icon Sizes */
.badge__icon {
  display: inline-flex;
  flex-shrink: 0;
}

.badge--xs .badge__icon {
  width: 10px;
  height: 10px;
}

.badge--sm .badge__icon {
  width: 12px;
  height: 12px;
}

.badge--md .badge__icon {
  width: 14px;
  height: 14px;
}

.badge--lg .badge__icon {
  width: 16px;
  height: 16px;
}

/* Dot Indicator */
.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge--xs .badge__dot {
  width: 4px;
  height: 4px;
}

.badge--sm .badge__dot {
  width: 5px;
  height: 5px;
}

.badge--lg .badge__dot {
  width: 7px;
  height: 7px;
}

/* Close Button */
.badge__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-left: 2px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 2px;
  transition: opacity 0.2s ease;
  opacity: 0.7;
}

.badge__close:hover {
  opacity: 1;
}

.badge__close:focus {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}

.badge--xs .badge__close {
  width: 12px;
  height: 12px;
}

.badge--sm .badge__close {
  width: 14px;
  height: 14px;
}

.badge--md .badge__close {
  width: 16px;
  height: 16px;
}

.badge--lg .badge__close {
  width: 18px;
  height: 18px;
}

/* Interactive Badge */
.badge--interactive {
  cursor: pointer;
  user-select: none;
}

.badge--interactive:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.badge--interactive:active {
  transform: translateY(0);
}

/* Pulsing Animation */
.badge--pulse {
  animation: badge-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes badge-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .badge {
    transition: none;
  }
  .badge--pulse {
    animation: none;
  }
  .badge--interactive:hover {
    transform: none;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'badge');
  styleElement.textContent = BADGE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// COLOR CONFIGURATIONS
// =============================================================================

const COLOR_CONFIGS = {
  primary: {
    solid: {
      bg: '#3b82f6',
      text: '#ffffff',
      border: '#3b82f6',
    },
    outline: {
      bg: 'transparent',
      text: '#3b82f6',
      border: '#3b82f6',
    },
    soft: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#dbeafe',
    },
  },
  secondary: {
    solid: {
      bg: '#10b981',
      text: '#ffffff',
      border: '#10b981',
    },
    outline: {
      bg: 'transparent',
      text: '#10b981',
      border: '#10b981',
    },
    soft: {
      bg: '#d1fae5',
      text: '#065f46',
      border: '#d1fae5',
    },
  },
  success: {
    solid: {
      bg: '#10b981',
      text: '#ffffff',
      border: '#10b981',
    },
    outline: {
      bg: 'transparent',
      text: '#10b981',
      border: '#10b981',
    },
    soft: {
      bg: '#d1fae5',
      text: '#065f46',
      border: '#d1fae5',
    },
  },
  warning: {
    solid: {
      bg: '#f59e0b',
      text: '#ffffff',
      border: '#f59e0b',
    },
    outline: {
      bg: 'transparent',
      text: '#f59e0b',
      border: '#f59e0b',
    },
    soft: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#fef3c7',
    },
  },
  error: {
    solid: {
      bg: '#ef4444',
      text: '#ffffff',
      border: '#ef4444',
    },
    outline: {
      bg: 'transparent',
      text: '#ef4444',
      border: '#ef4444',
    },
    soft: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#fee2e2',
    },
  },
  info: {
    solid: {
      bg: '#0ea5e9',
      text: '#ffffff',
      border: '#0ea5e9',
    },
    outline: {
      bg: 'transparent',
      text: '#0ea5e9',
      border: '#0ea5e9',
    },
    soft: {
      bg: '#e0f2fe',
      text: '#075985',
      border: '#e0f2fe',
    },
  },
  gray: {
    solid: {
      bg: '#6b7280',
      text: '#ffffff',
      border: '#6b7280',
    },
    outline: {
      bg: 'transparent',
      text: '#6b7280',
      border: '#6b7280',
    },
    soft: {
      bg: '#f3f4f6',
      text: '#374151',
      border: '#f3f4f6',
    },
  },
  dark: {
    solid: {
      bg: '#1f2937',
      text: '#ffffff',
      border: '#1f2937',
    },
    outline: {
      bg: 'transparent',
      text: '#1f2937',
      border: '#1f2937',
    },
    soft: {
      bg: '#e5e7eb',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  },
};

// =============================================================================
// CLOSE ICON SVG
// =============================================================================

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    style={{ width: '100%', height: '100%' }}
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

// =============================================================================
// BADGE COMPONENT
// =============================================================================

/**
 * Badge - Status indicator component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.color - Color variant
 * @param {string} props.size - Size: 'xs' | 'sm' | 'md' | 'lg'
 * @param {string} props.variant - Style variant: 'solid' | 'outline' | 'soft'
 * @param {string} props.shape - Shape: 'rounded' | 'pill' | 'square'
 * @param {React.ReactNode} props.icon - Icon element (left side)
 * @param {React.ReactNode} props.iconRight - Icon element (right side)
 * @param {boolean} props.dot - Show dot indicator
 * @param {string} props.dotColor - Dot color (defaults to current color)
 * @param {boolean} props.closable - Show close button
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.pulse - Enable pulsing animation
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <Badge color="primary" size="md">New</Badge>
 * <Badge color="success" dot>Active</Badge>
 * <Badge color="warning" closable onClose={handleClose}>Beta</Badge>
 */
const Badge = ({
  children,
  color = 'primary',
  size = 'md',
  variant = 'solid',
  shape = 'rounded',
  icon = null,
  iconRight = null,
  dot = false,
  dotColor = null,
  closable = false,
  onClose,
  onClick,
  pulse = false,
  className = '',
  ...props
}) => {
  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Get color configuration
  const colorConfig = COLOR_CONFIGS[color]?.[variant] || COLOR_CONFIGS.primary.solid;

  // Build CSS classes
  const badgeClasses = [
    'badge',
    `badge--${size}`,
    `badge--${shape}`,
    onClick && 'badge--interactive',
    pulse && 'badge--pulse',
    className,
  ].filter(Boolean).join(' ');

  // Badge styles
  const badgeStyle = {
    backgroundColor: colorConfig.bg,
    color: colorConfig.text,
    borderColor: colorConfig.border,
  };

  // Dot color
  const dotStyle = {
    backgroundColor: dotColor || colorConfig.text,
  };

  // Handle close
  const handleClose = (e) => {
    e.stopPropagation();
    if (onClose) {
      onClose(e);
    }
  };

  // Handle click
  const handleClick = (e) => {
    if (onClick && !closable) {
      onClick(e);
    }
  };

  return (
    <span
      className={badgeClasses}
      style={badgeStyle}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {/* Dot indicator */}
      {dot && <span className="badge__dot" style={dotStyle} />}
      
      {/* Left icon */}
      {icon && <span className="badge__icon">{icon}</span>}
      
      {/* Content */}
      {children && <span className="badge__content">{children}</span>}
      
      {/* Right icon */}
      {iconRight && <span className="badge__icon">{iconRight}</span>}
      
      {/* Close button */}
      {closable && (
        <button
          type="button"
          className="badge__close"
          onClick={handleClose}
          aria-label="Remove badge"
          style={{ color: colorConfig.text }}
        >
          <CloseIcon />
        </button>
      )}
    </span>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Badge.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'warning',
    'error',
    'info',
    'gray',
    'dark',
  ]),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['solid', 'outline', 'soft']),
  shape: PropTypes.oneOf(['rounded', 'pill', 'square']),
  icon: PropTypes.node,
  iconRight: PropTypes.node,
  dot: PropTypes.bool,
  dotColor: PropTypes.string,
  closable: PropTypes.bool,
  onClose: PropTypes.func,
  onClick: PropTypes.func,
  pulse: PropTypes.bool,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Badge;
export { Badge };
