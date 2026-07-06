// =============================================================================
// AI FUNNEL PLATFORM - Skeleton Component (Self-Contained)
// =============================================================================
// Loading skeleton with multiple shapes, animations, and sizes
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const SKELETON_STYLES = `
/* Skeleton Base Styles */
.skeleton {
  display: inline-block;
  position: relative;
  overflow: hidden;
  background-color: #e5e7eb;
  border-radius: 4px;
  cursor: wait;
}

.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transform: translateX(-100%);
}

/* Shapes */
.skeleton--text {
  height: 1em;
  width: 100%;
  border-radius: 4px;
}

.skeleton--circle {
  border-radius: 50%;
  aspect-ratio: 1;
}

.skeleton--rectangle {
  border-radius: 4px;
}

.skeleton--square {
  aspect-ratio: 1;
  border-radius: 4px;
}

.skeleton--rounded {
  border-radius: 8px;
}

.skeleton--pill {
  border-radius: 9999px;
}

/* Sizes */
.skeleton--xs { font-size: 0.75rem; }
.skeleton--sm { font-size: 0.875rem; }
.skeleton--md { font-size: 1rem; }
.skeleton--lg { font-size: 1.125rem; }
.skeleton--xl { font-size: 1.25rem; }

/* Width presets */
.skeleton--width-full { width: 100%; }
.skeleton--width-3-4 { width: 75%; }
.skeleton--width-1-2 { width: 50%; }
.skeleton--width-1-3 { width: 33.333%; }
.skeleton--width-1-4 { width: 25%; }

/* Height presets for non-text shapes */
.skeleton--height-xs { height: 20px; }
.skeleton--height-sm { height: 40px; }
.skeleton--height-md { height: 60px; }
.skeleton--height-lg { height: 100px; }
.skeleton--height-xl { height: 150px; }

/* Animations */
.skeleton--pulse::after {
  animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton--wave::after {
  animation: skeleton-wave 1.5s linear infinite;
}

.skeleton--shimmer::after {
  animation: skeleton-shimmer 2s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes skeleton-wave {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%) skewX(-15deg);
  }
  100% {
    transform: translateX(100%) skewX(-15deg);
  }
}

/* Block level */
.skeleton--block {
  display: block;
}

/* Avatar specific */
.skeleton--avatar-sm { width: 32px; height: 32px; }
.skeleton--avatar-md { width: 40px; height: 40px; }
.skeleton--avatar-lg { width: 48px; height: 48px; }
.skeleton--avatar-xl { width: 64px; height: 64px; }

/* Card specific */
.skeleton--card {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

/* Button specific */
.skeleton--button-sm {
  height: 32px;
  width: 80px;
  border-radius: 6px;
}

.skeleton--button-md {
  height: 40px;
  width: 100px;
  border-radius: 6px;
}

.skeleton--button-lg {
  height: 48px;
  width: 120px;
  border-radius: 6px;
}

/* Container */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-container--row {
  flex-direction: row;
  align-items: center;
}

/* Dark Mode */
.dark .skeleton {
  background-color: #374151;
}

.dark .skeleton::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation-duration: 3s;
  }
}

/* Accessibility */
.skeleton[aria-busy="true"] {
  pointer-events: none;
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'skeleton');
  styleElement.textContent = SKELETON_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// SKELETON COMPONENT
// =============================================================================

/**
 * Skeleton - Loading placeholder component
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Shape variant: 'text' | 'circle' | 'rectangle' | 'square' | 'avatar' | 'button' | 'card'
 * @param {string} props.animation - Animation type: 'pulse' | 'wave' | 'shimmer' | 'none'
 * @param {string} props.size - Size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {string|number} props.width - Custom width (e.g., '200px', '100%', 200)
 * @param {string|number} props.height - Custom height (e.g., '100px', '50%', 100)
 * @param {string} props.widthPreset - Width preset: 'full' | '3/4' | '1/2' | '1/3' | '1/4'
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.rounded - Use rounded corners (8px)
 * @param {boolean} props.pill - Use pill shape (full border-radius)
 * @param {number} props.count - Number of skeletons to render
 * @param {boolean} props.block - Display as block element
 * @param {React.CSSProperties} props.style - Inline styles
 * 
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="circle" size="lg" />
 * <Skeleton variant="rectangle" width={300} height={200} />
 */
const Skeleton = ({
  variant = 'text',
  animation = 'wave',
  size = 'md',
  width,
  height,
  widthPreset,
  className = '',
  rounded = false,
  pill = false,
  count = 1,
  block = false,
  style = {},
  ...props
}) => {
  // Inject styles on mount
  useEffect(() => {
    injectStyles();
  }, []);

  // Build CSS classes
  const getSkeletonClasses = () => {
    const classes = [
      'skeleton',
      `skeleton--${variant}`,
      animation !== 'none' && `skeleton--${animation}`,
      `skeleton--${size}`,
      widthPreset && `skeleton--width-${widthPreset}`,
      rounded && 'skeleton--rounded',
      pill && 'skeleton--pill',
      block && 'skeleton--block',
      className,
    ].filter(Boolean);

    // Add preset classes for specific variants
    if (variant === 'avatar' && !width && !height) {
      classes.push(`skeleton--avatar-${size}`);
    }
    if (variant === 'button' && !width && !height) {
      classes.push(`skeleton--button-${size}`);
    }
    if (variant === 'card') {
      classes.push('skeleton--card');
    }

    return classes.join(' ');
  };

  // Build inline styles
  const getSkeletonStyle = () => {
    const inlineStyle = { ...style };

    // Custom width
    if (width) {
      inlineStyle.width = typeof width === 'number' ? `${width}px` : width;
    }

    // Custom height
    if (height) {
      inlineStyle.height = typeof height === 'number' ? `${height}px` : height;
    }

    // Circle needs equal width and height
    if (variant === 'circle' && width && !height) {
      inlineStyle.height = inlineStyle.width;
    }

    // Square needs equal width and height
    if (variant === 'square' && width && !height) {
      inlineStyle.height = inlineStyle.width;
    }

    return inlineStyle;
  };

  // Render single skeleton
  const renderSkeleton = (key) => (
    <span
      key={key}
      className={getSkeletonClasses()}
      style={getSkeletonStyle()}
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      {...props}
    />
  );

  // Render multiple skeletons
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }, (_, index) => renderSkeleton(index))}
      </>
    );
  }

  return renderSkeleton(0);
};

// =============================================================================
// SKELETON GROUP COMPONENT
// =============================================================================

/**
 * SkeletonGroup - Container for multiple skeletons
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Skeleton components
 * @param {string} props.direction - Layout direction: 'column' | 'row'
 * @param {string|number} props.gap - Gap between skeletons
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <SkeletonGroup>
 *   <Skeleton variant="circle" size="lg" />
 *   <Skeleton variant="text" count={3} />
 * </SkeletonGroup>
 */
export const SkeletonGroup = ({
  children,
  direction = 'column',
  gap = '0.5rem',
  className = '',
  style = {},
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const containerClasses = [
    'skeleton-container',
    direction === 'row' && 'skeleton-container--row',
    className,
  ].filter(Boolean).join(' ');

  const containerStyle = {
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    ...style,
  };

  return (
    <div className={containerClasses} style={containerStyle} {...props}>
      {children}
    </div>
  );
};

// =============================================================================
// PRESET SKELETONS
// =============================================================================

/**
 * SkeletonText - Text line skeleton
 */
export const SkeletonText = ({ lines = 3, ...props }) => (
  <SkeletonGroup>
    <Skeleton variant="text" count={lines - 1} {...props} />
    <Skeleton variant="text" widthPreset="3/4" {...props} />
  </SkeletonGroup>
);

/**
 * SkeletonAvatar - Avatar skeleton
 */
export const SkeletonAvatar = ({ size = 'md', ...props }) => (
  <Skeleton variant="circle" size={size} {...props} />
);

/**
 * SkeletonCard - Card skeleton
 */
export const SkeletonCard = ({ ...props }) => (
  <Skeleton variant="card" {...props} />
);

/**
 * SkeletonButton - Button skeleton
 */
export const SkeletonButton = ({ size = 'md', ...props }) => (
  <Skeleton variant="button" size={size} {...props} />
);

/**
 * SkeletonPost - Social media post skeleton
 */
export const SkeletonPost = () => (
  <SkeletonGroup gap="1rem">
    <SkeletonGroup direction="row" gap="1rem">
      <SkeletonAvatar size="lg" />
      <SkeletonGroup gap="0.5rem" style={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="30%" size="sm" />
      </SkeletonGroup>
    </SkeletonGroup>
    <Skeleton variant="rectangle" height={200} />
    <SkeletonText lines={2} />
  </SkeletonGroup>
);

/**
 * SkeletonTable - Table row skeleton
 */
export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <SkeletonGroup gap="1rem">
    {Array.from({ length: rows }, (_, rowIndex) => (
      <SkeletonGroup key={rowIndex} direction="row" gap="1rem">
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton key={colIndex} variant="text" style={{ flex: 1 }} />
        ))}
      </SkeletonGroup>
    ))}
  </SkeletonGroup>
);

/**
 * SkeletonForm - Form field skeleton
 */
export const SkeletonForm = ({ fields = 3 }) => (
  <SkeletonGroup gap="1.5rem">
    {Array.from({ length: fields }, (_, index) => (
      <SkeletonGroup key={index} gap="0.5rem">
        <Skeleton variant="text" width="30%" size="sm" />
        <Skeleton variant="rectangle" height={40} />
      </SkeletonGroup>
    ))}
  </SkeletonGroup>
);

// =============================================================================
// PROP TYPES
// =============================================================================

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'circle', 'rectangle', 'square', 'avatar', 'button', 'card']),
  animation: PropTypes.oneOf(['pulse', 'wave', 'shimmer', 'none']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  widthPreset: PropTypes.oneOf(['full', '3/4', '1/2', '1/3', '1/4']),
  className: PropTypes.string,
  rounded: PropTypes.bool,
  pill: PropTypes.bool,
  count: PropTypes.number,
  block: PropTypes.bool,
  style: PropTypes.object,
};

SkeletonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['column', 'row']),
  gap: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  style: PropTypes.object,
};

SkeletonText.propTypes = {
  lines: PropTypes.number,
};

SkeletonAvatar.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};

SkeletonButton.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

SkeletonTable.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
};

SkeletonForm.propTypes = {
  fields: PropTypes.number,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Skeleton;