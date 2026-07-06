import React from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  onClear?: () => void;
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      disabled = false,
      required = false,
      id,
      onClear,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const uniqueId = React.useId();
    const inputId = id || `input-${uniqueId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = !!error;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const handleClear = () => {
      if (onClear && !disabled) {
        onClear();
      }
    };

    const inputPaddingLeft = leftIcon
      ? size === 'sm'
        ? 'pl-9'
        : size === 'md'
        ? 'pl-10'
        : 'pl-12'
      : '';

    const inputPaddingRight =
      rightIcon || isPassword || onClear
        ? size === 'sm'
          ? 'pr-9'
          : size === 'md'
          ? 'pr-10'
          : 'pr-12'
        : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'mb-1.5 block text-sm font-medium text-gray-700',
              disabled && 'opacity-60'
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-red-600" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500',
                hasError && 'text-red-600',
                disabled && 'opacity-60'
              )}
            >
              <span className={cn(iconSizeClasses[size])}>{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            id={inputId}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full rounded-md border bg-white font-normal text-gray-900 placeholder:text-gray-400 transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              sizeClasses[size],
              inputPaddingLeft,
              inputPaddingRight,
              hasError
                ? 'border-red-500 focus-visible:ring-red-600'
                : 'border-gray-300 focus-visible:ring-blue-600 hover:border-gray-400',
              disabled && 'cursor-not-allowed bg-gray-50 opacity-60',
              className
            )}
            aria-invalid={hasError}
            aria-errormessage={hasError ? errorId : undefined}
            aria-describedby={
              helperText && !hasError ? helperId : hasError ? errorId : undefined
            }
            aria-required={required}
            {...props}
          />

          <div
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1',
              disabled && 'opacity-60'
            )}
          >
            {hasError && !rightIcon && !isPassword && (
              <AlertCircle
                className={cn(iconSizeClasses[size], 'text-red-600')}
                aria-hidden="true"
              />
            )}

            {isPassword && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={disabled}
                className={cn(
                  'text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm',
                  disabled && 'cursor-not-allowed'
                )}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={disabled ? -1 : 0}
              >
                {showPassword ? (
                  <EyeOff className={iconSizeClasses[size]} />
                ) : (
                  <Eye className={iconSizeClasses[size]} />
                )}
              </button>
            )}

            {rightIcon && !isPassword && (
              <span className="text-gray-500">{rightIcon}</span>
            )}
          </div>
        </div>

        {hasError && (
          <p
            id={errorId}
            className="mt-1.5 flex items-start gap-1 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        {helperText && !hasError && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
