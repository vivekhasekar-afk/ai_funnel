import React from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options?: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  name: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  error?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: boolean;
}

const RadioGroupContext = React.createContext<{
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled: boolean;
  error: boolean;
} | null>(null);

const useRadioGroup = () => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error('Radio must be used within RadioGroup');
  }
  return context;
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  defaultValue = '',
  onChange,
  onBlur,
  name,
  orientation = 'vertical',
  disabled = false,
  error,
  className,
  children,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const groupRef = React.useRef<HTMLDivElement>(null);
  const radioRefs = React.useRef<Map<string, HTMLInputElement>>(new Map());

  const controlledValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue: string) => {
    if (disabled) return;
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const radioValues = options
      ? options.filter((opt) => !opt.disabled).map((opt) => opt.value)
      : Array.from(radioRefs.current.keys());

    if (radioValues.length === 0) return;

    const currentIndex = radioValues.indexOf(controlledValue);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < radioValues.length - 1 ? currentIndex + 1 : 0;
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : radioValues.length - 1;
        break;

      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          handleChange(radioValues[currentIndex]);
        }
        return;

      default:
        return;
    }

    const nextValue = radioValues[nextIndex];
    handleChange(nextValue);

    const nextRadio = radioRefs.current.get(nextValue);
    if (nextRadio) {
      nextRadio.focus();
    }
  };

  const contextValue = React.useMemo(
    () => ({
      value: controlledValue,
      onChange: handleChange,
      name,
      disabled,
      error: !!error,
    }),
    [controlledValue, name, disabled, error]
  );

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-disabled={disabled}
        aria-invalid={!!error}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className={cn('w-full', className)}
      >
        {options ? (
          <div
            className={cn(
              'flex gap-4',
              orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
            )}
          >
            {options.map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                label={option.label}
                description={option.description}
                disabled={option.disabled}
                error={!!error}
                ref={(el: HTMLInputElement | null) => {
                  if (el) {
                    radioRefs.current.set(option.value, el);
                  } else {
                    radioRefs.current.delete(option.value);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'flex gap-4',
              orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
            )}
          >
            {children}
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </RadioGroupContext.Provider>
  );
};

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      label,
      description,
      disabled: disabledProp,
      error: errorProp,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const context = useRadioGroup();
    const uniqueId = React.useId();
    const radioId = id || `radio-${uniqueId}`;
    const descriptionId = description ? `${radioId}-description` : undefined;

    const isChecked = context.value === value;
    const isDisabled = disabledProp || context.disabled;
    const hasError = errorProp || context.error;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDisabled && e.target.checked) {
        context.onChange(value as string);
      }
    };

    if (!label) {
      console.warn(
        'Radio component should have a label for accessibility. Consider adding a label prop.'
      );
    }

    return (
      <div className={cn('flex items-start', className)}>
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={context.name}
            value={value}
            checked={isChecked}
            disabled={isDisabled}
            onChange={handleChange}
            aria-checked={isChecked}
            aria-disabled={isDisabled}
            aria-describedby={descriptionId}
            className="peer sr-only"
            tabIndex={isChecked ? 0 : -1}
            {...props}
          />
          <label
            htmlFor={radioId}
            className={cn(
              'relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 transition-all',
              'before:absolute before:h-2.5 before:w-2.5 before:rounded-full before:bg-white before:scale-0 before:transition-transform',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
              isChecked && 'before:scale-100',
              hasError
                ? 'border-red-500 peer-checked:bg-red-600 peer-focus-visible:ring-red-600'
                : 'border-gray-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus-visible:ring-blue-600',
              !isDisabled && !isChecked && 'hover:border-gray-400',
              isDisabled && 'cursor-not-allowed opacity-50'
            )}
            aria-hidden="true"
          >
            {isChecked && (
              <span className="absolute h-2.5 w-2.5 rounded-full bg-white animate-in zoom-in-50 duration-200" />
            )}
          </label>
        </div>

        {(label || description) && (
          <div className="ml-3 flex-1">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'block text-sm font-medium leading-6 cursor-pointer select-none',
                  isChecked ? 'text-gray-900' : 'text-gray-700',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={descriptionId}
                className={cn(
                  'mt-0.5 text-sm text-gray-500',
                  isDisabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
RadioGroup.displayName = 'RadioGroup';
