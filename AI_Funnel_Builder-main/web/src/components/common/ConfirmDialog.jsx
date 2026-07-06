// =============================================================================
// AI FUNNEL PLATFORM - ConfirmDialog Component (Self-Contained)
// =============================================================================
// Confirmation dialog with variants, icons, input confirmation, and animations
// Depends on: Modal, Button, Input components from UI library
// All styles included - no external CSS dependencies
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalFooter, Button, Input } from '../ui';

// =============================================================================
// STYLES INJECTION
// =============================================================================

const CONFIRM_DIALOG_STYLES = `
/* Confirm Dialog Content */
.confirm-dialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem 0;
}

.confirm-dialog__content--left {
  align-items: flex-start;
  text-align: left;
}

/* Icon */
.confirm-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.confirm-dialog__icon svg {
  width: 32px;
  height: 32px;
}

.confirm-dialog__icon--sm {
  width: 48px;
  height: 48px;
}

.confirm-dialog__icon--sm svg {
  width: 24px;
  height: 24px;
}

.confirm-dialog__icon--lg {
  width: 80px;
  height: 80px;
}

.confirm-dialog__icon--lg svg {
  width: 40px;
  height: 40px;
}

/* Icon Variants */
.confirm-dialog__icon--danger {
  background-color: #fee2e2;
  color: #dc2626;
}

.confirm-dialog__icon--warning {
  background-color: #fef3c7;
  color: #d97706;
}

.confirm-dialog__icon--info {
  background-color: #dbeafe;
  color: #2563eb;
}

.confirm-dialog__icon--success {
  background-color: #d1fae5;
  color: #059669;
}

/* Animated Icon */
.confirm-dialog__icon--danger {
  animation: confirm-dialog-shake 0.5s ease-in-out;
}

.confirm-dialog__icon--warning {
  animation: confirm-dialog-bounce 0.5s ease-in-out;
}

@keyframes confirm-dialog-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes confirm-dialog-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Title */
.confirm-dialog__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  margin: 0 0 0.75rem 0;
}

.confirm-dialog__content--left .confirm-dialog__title {
  margin-bottom: 0.5rem;
}

/* Message */
.confirm-dialog__message {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.confirm-dialog__content--left .confirm-dialog__message {
  margin-bottom: 1rem;
}

/* Details */
.confirm-dialog__details {
  width: 100%;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.confirm-dialog__details-title {
  font-size: 0.813rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.confirm-dialog__details-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.confirm-dialog__details-item {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confirm-dialog__details-item::before {
  content: '•';
  color: #9ca3af;
  font-weight: bold;
}

/* Input Confirmation */
.confirm-dialog__input-section {
  width: 100%;
  margin-bottom: 1.5rem;
}

.confirm-dialog__input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  text-align: left;
}

.confirm-dialog__input-hint {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: 0.375rem;
  text-align: left;
}

.confirm-dialog__input-code {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.813rem;
  color: #dc2626;
  font-weight: 600;
}

/* Checkbox */
.confirm-dialog__checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: 100%;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  text-align: left;
}

.confirm-dialog__checkbox input[type="checkbox"] {
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.confirm-dialog__checkbox-label {
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.5;
  font-weight: 500;
}

/* Footer */
.confirm-dialog__footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.confirm-dialog__footer--reverse {
  flex-direction: row-reverse;
}

.confirm-dialog__footer--stack {
  flex-direction: column-reverse;
}

.confirm-dialog__footer--stack button {
  width: 100%;
}

/* Loading State */
.confirm-dialog--loading {
  pointer-events: none;
}

.confirm-dialog__spinner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.confirm-dialog__spinner::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: confirm-dialog-spin 0.6s linear infinite;
}

@keyframes confirm-dialog-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Countdown Timer */
.confirm-dialog__countdown {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background-color: #e5e7eb;
  color: #6b7280;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
}

/* Responsive */
@media (max-width: 640px) {
  .confirm-dialog__icon {
    width: 56px;
    height: 56px;
  }
  
  .confirm-dialog__icon svg {
    width: 28px;
    height: 28px;
  }
  
  .confirm-dialog__title {
    font-size: 1.125rem;
  }
  
  .confirm-dialog__footer {
    flex-direction: column-reverse;
  }
  
  .confirm-dialog__footer button {
    width: 100%;
  }
}

/* Dark Mode */
.dark .confirm-dialog__title {
  color: #f3f4f6;
}

.dark .confirm-dialog__message {
  color: #9ca3af;
}

.dark .confirm-dialog__details {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .confirm-dialog__details-title {
  color: #e5e7eb;
}

.dark .confirm-dialog__details-item {
  color: #9ca3af;
}

.dark .confirm-dialog__input-label {
  color: #e5e7eb;
}

.dark .confirm-dialog__input-hint {
  color: #9ca3af;
}

.dark .confirm-dialog__input-code {
  background-color: #374151;
  border-color: #4b5563;
  color: #f87171;
}

.dark .confirm-dialog__checkbox {
  background-color: #78350f;
  border-color: #92400e;
}

.dark .confirm-dialog__checkbox-label {
  color: #fde68a;
}

.dark .confirm-dialog__countdown {
  background-color: #374151;
  color: #9ca3af;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .confirm-dialog__icon--danger,
  .confirm-dialog__icon--warning,
  .confirm-dialog__spinner::before {
    animation: none !important;
  }
}
`;

// Inject styles once
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'confirm-dialog');
  styleElement.textContent = CONFIRM_DIALOG_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// DEFAULT ICONS
// =============================================================================

const DefaultIcons = {
  danger: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  warning: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  question: (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// =============================================================================
// CONFIRM DIALOG COMPONENT
// =============================================================================

const ConfirmDialog = ({
  // Visibility
  open = false,
  onClose,
  
  // Content
  title,
  message,
  icon,
  variant = 'info',
  
  // Details
  details,
  detailsTitle = 'Details',
  
  // Actions
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  
  // Variants
  dangerous = false,
  
  // Input Confirmation
  requireTextConfirmation = false,
  confirmationText,
  confirmationPlaceholder = 'Type to confirm',
  confirmationLabel,
  confirmationHint,
  
  // Checkbox Confirmation
  requireCheckbox = false,
  checkboxLabel = 'I understand the consequences',
  
  // Layout
  alignLeft = false,
  reverseButtons = false,
  stackButtons = false,
  iconSize = 'md',
  
  // Loading
  loading = false,
  loadingText = 'Processing...',
  
  // Countdown
  countdown,
  
  // Modal Props
  size = 'sm',
  closeOnOverlayClick = false,
  
  // Custom
  children,
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [inputValue, setInputValue] = useState('');
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(countdown);
  const confirmButtonRef = useRef(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setInputValue('');
      setCheckboxChecked(false);
      setTimeLeft(countdown);
    }
  }, [open, countdown]);

  // Countdown timer
  useEffect(() => {
    if (!countdown || !open || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, open, timeLeft]);

  // Check if confirm is disabled
  const isConfirmDisabled =
    loading ||
    (timeLeft > 0) ||
    (requireTextConfirmation && inputValue !== confirmationText) ||
    (requireCheckbox && !checkboxChecked);

  // Handle confirm
  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    
    if (onConfirm) {
      const result = onConfirm();
      if (result instanceof Promise) {
        await result;
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (loading) return;
    onCancel?.();
    onClose?.();
  };

  // Determine actual variant
  const actualVariant = dangerous ? 'danger' : variant;

  // Content classes
  const contentClasses = [
    'confirm-dialog__content',
    alignLeft && 'confirm-dialog__content--left',
    loading && 'confirm-dialog--loading',
  ].filter(Boolean).join(' ');

  const iconClasses = [
    'confirm-dialog__icon',
    `confirm-dialog__icon--${actualVariant}`,
    `confirm-dialog__icon--${iconSize}`,
  ].filter(Boolean).join(' ');

  const footerClasses = [
    'confirm-dialog__footer',
    reverseButtons && 'confirm-dialog__footer--reverse',
    stackButtons && 'confirm-dialog__footer--stack',
  ].filter(Boolean).join(' ');

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={!loading}
      showCloseButton={!loading}
      {...props}
    >
      <ModalBody noPadding>
        <div className={contentClasses}>
          {/* Icon */}
          {icon !== false && (
            <div className={iconClasses}>
              {icon || DefaultIcons[actualVariant] || DefaultIcons.question}
            </div>
          )}

          {/* Title */}
          {title && <h3 className="confirm-dialog__title">{title}</h3>}

          {/* Message */}
          {message && <p className="confirm-dialog__message">{message}</p>}

          {/* Details */}
          {details && (
            <div className="confirm-dialog__details">
              {detailsTitle && (
                <h4 className="confirm-dialog__details-title">{detailsTitle}</h4>
              )}
              <ul className="confirm-dialog__details-list">
                {details.map((detail, index) => (
                  <li key={index} className="confirm-dialog__details-item">
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Text Confirmation Input */}
          {requireTextConfirmation && (
            <div className="confirm-dialog__input-section">
              {confirmationLabel && (
                <label className="confirm-dialog__input-label">
                  {confirmationLabel}
                </label>
              )}
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmationPlaceholder}
                disabled={loading}
                autoFocus
              />
              {confirmationHint && (
                <p className="confirm-dialog__input-hint">
                  {confirmationHint}{' '}
                  {confirmationText && (
                    <span className="confirm-dialog__input-code">
                      {confirmationText}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Checkbox Confirmation */}
          {requireCheckbox && (
            <div className="confirm-dialog__checkbox">
              <input
                type="checkbox"
                id="confirm-checkbox"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="confirm-checkbox" className="confirm-dialog__checkbox-label">
                {checkboxLabel}
              </label>
            </div>
          )}

          {/* Custom Children */}
          {children}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className={footerClasses}>
          {/* Cancel Button */}
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>

          {/* Confirm Button */}
          <Button
            ref={confirmButtonRef}
            variant={dangerous ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            loading={loading}
            loadingText={loadingText}
          >
            <span className={loading ? 'confirm-dialog__spinner' : ''}>
              {confirmText}
            </span>
            {timeLeft > 0 && (
              <span className="confirm-dialog__countdown">{timeLeft}s</span>
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  message: PropTypes.node,
  icon: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
  variant: PropTypes.oneOf(['info', 'success', 'warning', 'danger']),
  details: PropTypes.arrayOf(PropTypes.node),
  detailsTitle: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  dangerous: PropTypes.bool,
  requireTextConfirmation: PropTypes.bool,
  confirmationText: PropTypes.string,
  confirmationPlaceholder: PropTypes.string,
  confirmationLabel: PropTypes.string,
  confirmationHint: PropTypes.string,
  requireCheckbox: PropTypes.bool,
  checkboxLabel: PropTypes.string,
  alignLeft: PropTypes.bool,
  reverseButtons: PropTypes.bool,
  stackButtons: PropTypes.bool,
  iconSize: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  countdown: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  closeOnOverlayClick: PropTypes.bool,
  children: PropTypes.node,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ConfirmDialog;
export { ConfirmDialog, DefaultIcons };
