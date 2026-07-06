// =============================================================================
// AI FUNNEL PLATFORM - Toast Component (Self-Contained)
// =============================================================================
// Toast notifications with variants, auto-dismiss, actions, and animations
// Depends on: Button component
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Button from './Button';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const TOAST_STYLES = `
/* Toast Container */
.toast-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
  max-width: 420px;
  width: 100%;
  padding: 1rem;
}

/* Positions */
.toast-container--top-left {
  top: 0;
  left: 0;
}

.toast-container--top-center {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container--top-right {
  top: 0;
  right: 0;
}

.toast-container--bottom-left {
  bottom: 0;
  left: 0;
}

.toast-container--bottom-center {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.toast-container--bottom-right {
  bottom: 0;
  right: 0;
}

/* Toast */
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
  position: relative;
  overflow: hidden;
  min-width: 300px;
  max-width: 100%;
}

/* Animations */
.toast--enter-top {
  animation: toast-enter-top 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast--enter-bottom {
  animation: toast-enter-bottom 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast--exit-top {
  animation: toast-exit-top 0.2s ease-in forwards;
}

.toast--exit-bottom {
  animation: toast-exit-bottom 0.2s ease-in forwards;
}

.toast--exit-right {
  animation: toast-exit-right 0.2s ease-in forwards;
}

.toast--exit-left {
  animation: toast-exit-left 0.2s ease-in forwards;
}

@keyframes toast-enter-top {
  from {
    opacity: 0;
    transform: translateY(-100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-enter-bottom {
  from {
    opacity: 0;
    transform: translateY(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-exit-top {
  to {
    opacity: 0;
    transform: translateY(-100%) scale(0.9);
  }
}

@keyframes toast-exit-bottom {
  to {
    opacity: 0;
    transform: translateY(100%) scale(0.9);
  }
}

@keyframes toast-exit-right {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@keyframes toast-exit-left {
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

/* Progress Bar */
.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: currentColor;
  opacity: 0.3;
  transform-origin: left;
  animation: toast-progress linear forwards;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Toast Icon */
.toast__icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast__icon svg {
  width: 16px;
  height: 16px;
}

/* Toast Content */
.toast__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toast__title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: #111827;
  margin: 0;
}

.toast__description {
  font-size: 0.813rem;
  line-height: 1.5;
  color: #6b7280;
  margin: 0;
}

/* Toast Actions */
.toast__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

/* Toast Close Button */
.toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #6b7280;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  padding: 0;
  margin-top: -4px;
  margin-right: -4px;
}

.toast__close:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.toast__close svg {
  width: 16px;
  height: 16px;
}

/* Variants */
.toast--success {
  border-left: 4px solid #10b981;
}

.toast--success .toast__icon {
  background-color: #d1fae5;
  color: #10b981;
}

.toast--error {
  border-left: 4px solid #ef4444;
}

.toast--error .toast__icon {
  background-color: #fee2e2;
  color: #ef4444;
}

.toast--warning {
  border-left: 4px solid #f59e0b;
}

.toast--warning .toast__icon {
  background-color: #fef3c7;
  color: #f59e0b;
}

.toast--info {
  border-left: 4px solid #3b82f6;
}

.toast--info .toast__icon {
  background-color: #dbeafe;
  color: #3b82f6;
}

.toast--default {
  border-left: 4px solid #6b7280;
}

.toast--default .toast__icon {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* Loading Variant */
.toast--loading .toast__icon {
  background-color: #dbeafe;
  color: #3b82f6;
}

.toast__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: toast-spin 0.6s linear infinite;
}

@keyframes toast-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .toast-container {
    max-width: 100%;
    padding: 0.75rem;
  }
  
  .toast {
    min-width: 0;
  }
}

/* Dark Mode */
.dark .toast {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .toast__title {
  color: #f3f4f6;
}

.dark .toast__description {
  color: #9ca3af;
}

.dark .toast__close {
  color: #9ca3af;
}

.dark .toast__close:hover {
  background-color: #374151;
  color: #f3f4f6;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .toast,
  .toast__progress {
    animation-duration: 0.01ms !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'toast');
  styleElement.textContent = TOAST_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// TOAST CONTEXT
// =============================================================================

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// =============================================================================
// TOAST ICONS
// =============================================================================

const ToastIcons = {
  success: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  loading: <div className="toast__spinner" />,
};

const CloseIcon = (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// =============================================================================
// TOAST COMPONENT
// =============================================================================

const Toast = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  closable = true,
  showProgress = true,
  action,
  onClose,
  position = 'top-right',
  icon,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = React.useRef(null);
  const startTimeRef = React.useRef(Date.now());
  const remainingTimeRef = React.useRef(duration);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 200);
  }, [id, onClose]);

  const startTimer = useCallback(() => {
    if (duration === Infinity || duration === 0) return;

    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(() => {
      handleClose();
    }, remainingTimeRef.current);
  }, [duration, handleClose]);

  const pauseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      remainingTimeRef.current -= Date.now() - startTimeRef.current;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (!isPaused) {
      startTimer();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPaused, startTimer]);

  const toastClasses = [
    'toast',
    `toast--${variant}`,
    isExiting
      ? position.includes('right')
        ? 'toast--exit-right'
        : position.includes('left')
        ? 'toast--exit-left'
        : position.includes('top')
        ? 'toast--exit-top'
        : 'toast--exit-bottom'
      : position.includes('top')
      ? 'toast--enter-top'
      : 'toast--enter-bottom',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={toastClasses}
      onMouseEnter={() => {
        setIsPaused(true);
        pauseTimer();
      }}
      onMouseLeave={() => {
        setIsPaused(false);
        resumeTimer();
      }}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      {(icon !== false && variant !== 'default') && (
        <div className="toast__icon">
          {icon || ToastIcons[variant]}
        </div>
      )}

      {/* Content */}
      <div className="toast__content">
        {title && <div className="toast__title">{title}</div>}
        {description && <div className="toast__description">{description}</div>}
        
        {/* Actions */}
        {action && (
          <div className="toast__actions">
            {typeof action === 'function' ? action({ close: handleClose }) : action}
          </div>
        )}
      </div>

      {/* Close Button */}
      {closable && (
        <button
          type="button"
          className="toast__close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          {CloseIcon}
        </button>
      )}

      {/* Progress Bar */}
      {showProgress && duration !== Infinity && duration > 0 && !isPaused && (
        <div
          className="toast__progress"
          style={{
            animationDuration: `${remainingTimeRef.current}ms`,
          }}
        />
      )}
    </div>
  );
};

// =============================================================================
// TOAST CONTAINER
// =============================================================================

const ToastContainer = ({ toasts, position, removeToast }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={`toast-container toast-container--${position}`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          position={position}
          onClose={removeToast}
        />
      ))}
    </div>,
    document.body
  );
};

// =============================================================================
// TOAST PROVIDER
// =============================================================================

export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toastOptions) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    setToasts((prev) => {
      const newToasts = [{ id, ...toastOptions }, ...prev];
      return newToasts.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const removeAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const toast = useCallback((options) => addToast(options), [addToast]);
  toast.success = useCallback((title, options = {}) => 
    addToast({ title, variant: 'success', ...options }), [addToast]);
  toast.error = useCallback((title, options = {}) => 
    addToast({ title, variant: 'error', ...options }), [addToast]);
  toast.warning = useCallback((title, options = {}) => 
    addToast({ title, variant: 'warning', ...options }), [addToast]);
  toast.info = useCallback((title, options = {}) => 
    addToast({ title, variant: 'info', ...options }), [addToast]);
  toast.loading = useCallback((title, options = {}) => 
    addToast({ title, variant: 'loading', duration: Infinity, closable: false, ...options }), [addToast]);
  toast.promise = useCallback(async (promise, messages) => {
    const id = addToast({
      title: messages.loading,
      variant: 'loading',
      duration: Infinity,
      closable: false,
    });

    try {
      const result = await promise;
      updateToast(id, {
        title: messages.success,
        variant: 'success',
        duration: 5000,
        closable: true,
      });
      return result;
    } catch (error) {
      updateToast(id, {
        title: messages.error,
        variant: 'error',
        duration: 5000,
        closable: true,
      });
      throw error;
    }
  }, [addToast, updateToast]);

  const contextValue = {
    toast,
    removeToast,
    updateToast,
    removeAll,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        removeToast={removeToast}
      />
    </ToastContext.Provider>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'success', 'error', 'warning', 'info', 'loading']),
  duration: PropTypes.number,
  closable: PropTypes.bool,
  showProgress: PropTypes.bool,
  action: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onClose: PropTypes.func,
  position: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ]),
  maxToasts: PropTypes.number,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Toast;