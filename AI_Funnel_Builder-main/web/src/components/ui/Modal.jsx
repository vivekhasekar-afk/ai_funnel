// =============================================================================
// AI FUNNEL PLATFORM - Modal Component (Self-Contained)
// =============================================================================
// Modal dialog with animations, backdrop, focus trap, and accessibility
// Depends on: Button component
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Button from './Button';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const MODAL_STYLES = `
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  padding: 1rem;
  overflow-y: auto;
}

.modal-overlay--enter {
  animation: modal-overlay-enter 0.2s ease-out;
}

.modal-overlay--exit {
  animation: modal-overlay-exit 0.2s ease-in;
}

@keyframes modal-overlay-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-overlay-exit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Modal Container */
.modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 2rem);
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  margin: auto;
}

.modal--enter {
  animation: modal-enter 0.2s ease-out;
}

.modal--exit {
  animation: modal-exit 0.2s ease-in;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modal-exit {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
}

/* Sizes */
.modal--sm {
  max-width: 400px;
}

.modal--md {
  max-width: 600px;
}

.modal--lg {
  max-width: 800px;
}

.modal--xl {
  max-width: 1024px;
}

.modal--full {
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-header--no-border {
  border-bottom: none;
}

.modal-header__content {
  flex: 1;
  min-width: 0;
}

.modal-header__title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  margin: 0;
}

.modal-header__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 0.25rem;
}

.modal-header__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6b7280;
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  padding: 0;
}

.modal-header__close:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.modal-header__close:active {
  background-color: #e5e7eb;
}

.modal-header__close svg {
  width: 20px;
  height: 20px;
}

/* Modal Body */
.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.modal-body--compact {
  padding: 1rem 1.5rem;
}

.modal-body--spacious {
  padding: 2rem;
}

.modal-body--no-padding {
  padding: 0;
}

/* Scrollbar Styling */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
  background-color: #f9fafb;
}

.modal-footer--no-border {
  border-top: none;
}

.modal-footer--no-background {
  background-color: transparent;
}

.modal-footer--space-between {
  justify-content: space-between;
}

.modal-footer--center {
  justify-content: center;
}

.modal-footer--start {
  justify-content: flex-start;
}

/* Modal Centered Content */
.modal-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.modal-centered__icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.modal-centered__icon--primary {
  background-color: #dbeafe;
  color: #3b82f6;
}

.modal-centered__icon--success {
  background-color: #d1fae5;
  color: #10b981;
}

.modal-centered__icon--warning {
  background-color: #fef3c7;
  color: #f59e0b;
}

.modal-centered__icon--danger {
  background-color: #fee2e2;
  color: #ef4444;
}

.modal-centered__icon svg {
  width: 32px;
  height: 32px;
}

.modal-centered__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.modal-centered__description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }
  
  .modal {
    max-height: 90vh;
    border-radius: 12px 12px 0 0;
    margin: 0;
  }
  
  .modal--full {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Dark Mode */
.dark .modal {
  background-color: #1f2937;
}

.dark .modal-header,
.dark .modal-footer {
  border-color: #374151;
}

.dark .modal-header__title {
  color: #f3f4f6;
}

.dark .modal-header__subtitle {
  color: #9ca3af;
}

.dark .modal-header__close {
  color: #9ca3af;
}

.dark .modal-header__close:hover {
  background-color: #374151;
  color: #f3f4f6;
}

.dark .modal-header__close:active {
  background-color: #4b5563;
}

.dark .modal-footer {
  background-color: #111827;
}

.dark .modal-body::-webkit-scrollbar-track {
  background: #374151;
}

.dark .modal-body::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark .modal-body::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.dark .modal-centered__title {
  color: #f3f4f6;
}

.dark .modal-centered__description {
  color: #9ca3af;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .modal-overlay,
  .modal,
  .modal-header__close {
    animation: none !important;
    transition: none !important;
  }
}

/* Prevent body scroll when modal is open */
.modal-open {
  overflow: hidden;
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'modal');
  styleElement.textContent = MODAL_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// FOCUS TRAP HOOK
// =============================================================================

const useFocusTrap = (ref, isActive) => {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const modal = ref.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [ref, isActive]);
};

// =============================================================================
// MODAL COMPONENT
// =============================================================================

const Modal = ({
  // State
  open = false,
  onClose,
  
  // Content
  title,
  subtitle,
  children,
  
  // Styling
  size = 'md',
  className = '',
  
  // Behavior
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  
  // Animation
  animated = true,
  
  // Advanced
  preventScroll = true,
  initialFocus,
  
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [isExiting, setIsExiting] = useState(false);
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus trap
  useFocusTrap(modalRef, open);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (!onClose) return;

    if (animated) {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
        setIsExiting(false);
      }, 200);
    } else {
      onClose();
    }
  }, [onClose, animated]);

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, handleClose]);

  // Prevent body scroll
  useEffect(() => {
    if (!open || !preventScroll) return;

    previousActiveElement.current = document.activeElement;
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [open, preventScroll]);

  // Overlay click handler
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!open && !isExiting) return null;

  const overlayClasses = [
    'modal-overlay',
    animated && (isExiting ? 'modal-overlay--exit' : 'modal-overlay--enter'),
  ].filter(Boolean).join(' ');

  const modalClasses = [
    'modal',
    `modal--${size}`,
    animated && (isExiting ? 'modal--exit' : 'modal--enter'),
    className,
  ].filter(Boolean).join(' ');

  return createPortal(
    <div
      className={overlayClasses}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div ref={modalRef} className={modalClasses} {...props}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            <div className="modal-header__content">
              {title && (
                <h2 id="modal-title" className="modal-header__title">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="modal-header__subtitle">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="modal-header__close"
                onClick={handleClose}
                aria-label="Close modal"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

// =============================================================================
// MODAL HEADER
// =============================================================================

export const ModalHeader = ({
  title,
  subtitle,
  children,
  noBorder = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const headerClasses = [
    'modal-header',
    noBorder && 'modal-header--no-border',
    className,
  ].filter(Boolean).join(' ');

  if (children) {
    return <div className={headerClasses}>{children}</div>;
  }

  return (
    <div className={headerClasses}>
      <div className="modal-header__content">
        {title && <h2 className="modal-header__title">{title}</h2>}
        {subtitle && <p className="modal-header__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

// =============================================================================
// MODAL BODY
// =============================================================================

export const ModalBody = ({
  children,
  compact = false,
  spacious = false,
  noPadding = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const bodyClasses = [
    'modal-body',
    compact && 'modal-body--compact',
    spacious && 'modal-body--spacious',
    noPadding && 'modal-body--no-padding',
    className,
  ].filter(Boolean).join(' ');

  return <div className={bodyClasses}>{children}</div>;
};

// =============================================================================
// MODAL FOOTER
// =============================================================================

export const ModalFooter = ({
  children,
  noBorder = false,
  noBackground = false,
  spaceBetween = false,
  center = false,
  start = false,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const footerClasses = [
    'modal-footer',
    noBorder && 'modal-footer--no-border',
    noBackground && 'modal-footer--no-background',
    spaceBetween && 'modal-footer--space-between',
    center && 'modal-footer--center',
    start && 'modal-footer--start',
    className,
  ].filter(Boolean).join(' ');

  return <div className={footerClasses}>{children}</div>;
};

// =============================================================================
// MODAL CENTERED (for alerts/confirmations)
// =============================================================================

export const ModalCentered = ({
  icon,
  iconVariant = 'primary',
  title,
  description,
  actions,
  children,
  className = '',
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className={`modal-centered ${className}`}>
      {icon && (
        <div className={`modal-centered__icon modal-centered__icon--${iconVariant}`}>
          {icon}
        </div>
      )}
      {title && <h3 className="modal-centered__title">{title}</h3>}
      {description && <p className="modal-centered__description">{description}</p>}
      {children}
      {actions && <div style={{ display: 'flex', gap: '0.75rem' }}>{actions}</div>}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  className: PropTypes.string,
  closeOnOverlayClick: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  animated: PropTypes.bool,
  preventScroll: PropTypes.bool,
  initialFocus: PropTypes.object,
};

ModalHeader.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node,
  noBorder: PropTypes.bool,
  className: PropTypes.string,
};

ModalBody.propTypes = {
  children: PropTypes.node.isRequired,
  compact: PropTypes.bool,
  spacious: PropTypes.bool,
  noPadding: PropTypes.bool,
  className: PropTypes.string,
};

ModalFooter.propTypes = {
  children: PropTypes.node.isRequired,
  noBorder: PropTypes.bool,
  noBackground: PropTypes.bool,
  spaceBetween: PropTypes.bool,
  center: PropTypes.bool,
  start: PropTypes.bool,
  className: PropTypes.string,
};

ModalCentered.propTypes = {
  icon: PropTypes.node,
  iconVariant: PropTypes.oneOf(['primary', 'success', 'warning', 'danger']),
  title: PropTypes.string,
  description: PropTypes.string,
  actions: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default Modal;