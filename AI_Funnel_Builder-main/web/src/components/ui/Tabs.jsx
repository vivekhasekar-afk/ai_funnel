// =============================================================================
// AI FUNNEL PLATFORM - Tabs Component (Self-Contained)
// =============================================================================
// Tab navigation with active state, content panels, variants, and animations
// Depends on: Button component (optional)
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const TABS_STYLES = `
/* Tabs Container */
.tabs {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Tab List */
.tabs-list {
  display: flex;
  position: relative;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-list::-webkit-scrollbar {
  display: none;
}

.tabs-list--pills {
  border-bottom: none;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tabs-list--enclosed {
  border-bottom: 1px solid #e5e7eb;
  gap: 0.25rem;
}

.tabs-list--vertical {
  flex-direction: column;
  border-bottom: none;
  border-right: 1px solid #e5e7eb;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Active Indicator */
.tabs-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background-color: #3b82f6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.tabs-list--pills .tabs-indicator,
.tabs-list--enclosed .tabs-indicator,
.tabs-list--vertical .tabs-indicator {
  display: none;
}

/* Tab Button */
.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background-color: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
  outline: none;
  flex-shrink: 0;
}

.tab:hover {
  color: #374151;
  background-color: #f9fafb;
}

.tab:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-radius: 4px;
}

.tab--active {
  color: #3b82f6;
}

.tab--disabled {
  color: #d1d5db;
  cursor: not-allowed;
  pointer-events: none;
}

/* Tab Icon */
.tab__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab__icon svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* Tab Badge */
.tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #ef4444;
  border-radius: 9999px;
  line-height: 1;
}

.tab--active .tab__badge {
  background-color: #3b82f6;
}

/* Pills Variant */
.tabs-list--pills .tab {
  border-radius: 6px;
  padding: 0.5rem 1rem;
}

.tabs-list--pills .tab--active {
  background-color: #3b82f6;
  color: #ffffff;
}

.tabs-list--pills .tab--active:hover {
  background-color: #2563eb;
}

.tabs-list--pills .tab--active .tab__badge {
  background-color: #1e40af;
}

/* Enclosed Variant */
.tabs-list--enclosed .tab {
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  margin-bottom: -1px;
}

.tabs-list--enclosed .tab--active {
  background-color: #ffffff;
  border-color: #e5e7eb;
  color: #111827;
}

/* Vertical Variant */
.tabs-list--vertical .tab {
  justify-content: flex-start;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
}

.tabs-list--vertical .tab--active {
  background-color: #f0f9ff;
  border-right: 2px solid #3b82f6;
}

/* Sizes */
.tabs-list--sm .tab {
  padding: 0.5rem 0.75rem;
  font-size: 0.813rem;
}

.tabs-list--lg .tab {
  padding: 1rem 1.5rem;
  font-size: 1rem;
}

/* Tab Panels */
.tabs-panels {
  flex: 1;
  position: relative;
}

/* Tab Panel */
.tab-panel {
  display: none;
  padding: 1.5rem 0;
  animation: tab-panel-enter 0.2s ease-out;
}

.tab-panel--active {
  display: block;
}

.tab-panel--lazy {
  display: none;
}

.tab-panel--lazy.tab-panel--active {
  display: block;
}

@keyframes tab-panel-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fitted Tabs */
.tabs-list--fitted .tab {
  flex: 1;
}

/* Scrollable Tabs */
.tabs-list--scrollable {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.tabs-list--scrollable::-webkit-scrollbar {
  display: block;
  height: 4px;
}

.tabs-list--scrollable::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.tabs-list--scrollable::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

/* Responsive */
@media (max-width: 640px) {
  .tabs-list:not(.tabs-list--pills) {
    overflow-x: auto;
  }
  
  .tab {
    padding: 0.625rem 0.875rem;
    font-size: 0.813rem;
  }
  
  .tab-panel {
    padding: 1rem 0;
  }
}

/* Dark Mode */
.dark .tabs-list,
.dark .tabs-list--enclosed,
.dark .tabs-list--vertical {
  border-color: #374151;
}

.dark .tab {
  color: #9ca3af;
}

.dark .tab:hover {
  color: #e5e7eb;
  background-color: #374151;
}

.dark .tab--active {
  color: #60a5fa;
}

.dark .tabs-indicator {
  background-color: #60a5fa;
}

.dark .tabs-list--pills .tab--active {
  background-color: #3b82f6;
  color: #ffffff;
}

.dark .tabs-list--enclosed .tab--active {
  background-color: #1f2937;
  border-color: #374151;
  color: #f3f4f6;
}

.dark .tabs-list--vertical .tab--active {
  background-color: #1e3a5f;
  border-right-color: #60a5fa;
}

.dark .tab--disabled {
  color: #4b5563;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .tabs-indicator,
  .tab,
  .tab-panel {
    animation: none !important;
    transition: none !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'tabs');
  styleElement.textContent = TABS_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// TABS CONTEXT
// =============================================================================

const TabsContext = createContext(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
};

// =============================================================================
// TABS COMPONENT
// =============================================================================

const Tabs = ({
  children,
  defaultValue,
  value,
  onChange,
  orientation = 'horizontal',
  variant = 'line',
  size = 'md',
  fitted = false,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [activeTab, setActiveTab] = useState(defaultValue || value);
  const isControlled = value !== undefined;
  const currentTab = isControlled ? value : activeTab;

  const handleTabChange = (newValue) => {
    if (!isControlled) {
      setActiveTab(newValue);
    }
    onChange?.(newValue);
  };

  const contextValue = {
    activeTab: currentTab,
    setActiveTab: handleTabChange,
    orientation,
    variant,
    size,
    fitted,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`tabs ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// =============================================================================
// TAB LIST COMPONENT
// =============================================================================

export const TabList = ({ children, className = '', ...props }) => {
  const { orientation, variant, size, fitted } = useTabsContext();
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const listRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    if (variant === 'line' && activeTabRef.current) {
      const activeTab = activeTabRef.current;
      const list = listRef.current;
      
      if (orientation === 'horizontal') {
        setIndicatorStyle({
          width: activeTab.offsetWidth,
          left: activeTab.offsetLeft,
        });
      }
    }
  }, [variant, orientation]);

  const listClasses = [
    'tabs-list',
    `tabs-list--${variant}`,
    orientation === 'vertical' && 'tabs-list--vertical',
    `tabs-list--${size}`,
    fitted && 'tabs-list--fitted',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div ref={listRef} className={listClasses} role="tablist" {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTabRef });
        }
        return child;
      })}
      {variant === 'line' && orientation === 'horizontal' && (
        <span
          className="tabs-indicator"
          style={indicatorStyle}
        />
      )}
    </div>
  );
};

// =============================================================================
// TAB COMPONENT
// =============================================================================

export const Tab = ({
  value,
  children,
  icon,
  badge,
  disabled = false,
  className = '',
  activeTabRef,
  ...props
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const tabRef = useRef(null);
  const isActive = activeTab === value;

  useEffect(() => {
    if (isActive && activeTabRef) {
      activeTabRef.current = tabRef.current;
    }
  }, [isActive, activeTabRef]);

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const tabClasses = [
    'tab',
    isActive && 'tab--active',
    disabled && 'tab--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      className={tabClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {icon && <span className="tab__icon">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && (
        <span className="tab__badge">{badge}</span>
      )}
    </button>
  );
};

// =============================================================================
// TAB PANELS COMPONENT
// =============================================================================

export const TabPanels = ({ children, className = '', ...props }) => {
  return (
    <div className={`tabs-panels ${className}`} {...props}>
      {children}
    </div>
  );
};

// =============================================================================
// TAB PANEL COMPONENT
// =============================================================================

export const TabPanel = ({
  value,
  children,
  lazy = false,
  keepMounted = false,
  className = '',
  ...props
}) => {
  const { activeTab } = useTabsContext();
  const [hasBeenActive, setHasBeenActive] = useState(false);
  const isActive = activeTab === value;

  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  const shouldRender = isActive || (keepMounted && hasBeenActive) || !lazy;

  if (!shouldRender) return null;

  const panelClasses = [
    'tab-panel',
    isActive && 'tab-panel--active',
    lazy && !isActive && 'tab-panel--lazy',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={panelClasses}
      {...props}
    >
      {children}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  variant: PropTypes.oneOf(['line', 'pills', 'enclosed']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fitted: PropTypes.bool,
  className: PropTypes.string,
};

TabList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Tab.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node.isRequired,
  icon: PropTypes.node,
  badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  activeTabRef: PropTypes.object,
};

TabPanels.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabPanel.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node.isRequired,
  lazy: PropTypes.bool,
  keepMounted: PropTypes.bool,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Tabs;