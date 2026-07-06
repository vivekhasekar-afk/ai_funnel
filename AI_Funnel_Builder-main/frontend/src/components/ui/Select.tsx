import React from 'react';
import { ChevronDown, X, Check, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Badge } from '@/components/ui/Badge';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export type SelectValue = string | string[];

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  options?: SelectOption[];
  value?: SelectValue;
  defaultValue?: SelectValue;
  onChange?: (value: SelectValue) => void;
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  maxSelections?: number;
  loadOptions?: (searchQuery: string) => Promise<SelectOption[]>;
  cacheOptions?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emptyMessage?: string;
  name?: string;
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-5 text-lg',
};

export const Select = React.forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      className,
      options: initialOptions = [],
      value,
      defaultValue,
      onChange,
      onBlur,
      placeholder = 'Select...',
      searchPlaceholder = 'Search...',
      multiple = false,
      searchable = false,
      disabled = false,
      loading = false,
      error,
      maxSelections,
      loadOptions,
      cacheOptions = true,
      clearable = false,
      size = 'md',
      emptyMessage = 'No options found',
      name,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [internalValue, setInternalValue] = React.useState<SelectValue>(
      defaultValue || (multiple ? [] : '')
    );
    const [options, setOptions] = React.useState<SelectOption[]>(initialOptions);
    const [isLoadingOptions, setIsLoadingOptions] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);
    const [optionsCache, setOptionsCache] = React.useState<Record<string, SelectOption[]>>({});

    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const hiddenInputRef = React.useRef<HTMLInputElement>(null);

    const uniqueId = React.useId();
    const triggerId = `select-trigger-${uniqueId}`;
    const dropdownId = `select-dropdown-${uniqueId}`;
    const searchId = `select-search-${uniqueId}`;

    const debouncedSearch = useDebounce(searchQuery, 300);

    const controlledValue = value !== undefined ? value : internalValue;
    const selectedValues = Array.isArray(controlledValue) ? controlledValue : [controlledValue];

    React.useImperativeHandle(ref, () => hiddenInputRef.current!);

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchQuery) return options;
      const query = searchQuery.toLowerCase();
      return options.filter((opt) =>
        opt.label.toLowerCase().includes(query)
      );
    }, [options, searchQuery, searchable]);

    const groupedOptions = React.useMemo(() => {
      const groups: Record<string, SelectOption[]> = {};
      filteredOptions.forEach((opt) => {
        const groupKey = opt.group || '__default__';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(opt);
      });
      return groups;
    }, [filteredOptions]);

    const selectedOptions = React.useMemo(() => {
      return options.filter((opt) => selectedValues.includes(opt.value));
    }, [options, selectedValues]);

    const displayValue = React.useMemo(() => {
      if (selectedValues.length === 0 || (selectedValues.length === 1 && !selectedValues[0])) {
        return placeholder;
      }
      if (multiple) {
        return `${selectedValues.length} selected`;
      }
      const selected = options.find((opt) => opt.value === selectedValues[0]);
      return selected?.label || placeholder;
    }, [selectedValues, options, placeholder, multiple]);

    const loadAsyncOptions = React.useCallback(
      async (query: string) => {
        if (!loadOptions) return;

        if (cacheOptions && optionsCache[query]) {
          setOptions(optionsCache[query]);
          return;
        }

        setIsLoadingOptions(true);
        setLoadError(null);

        try {
          const loadedOptions = await loadOptions(query);
          setOptions(loadedOptions);
          if (cacheOptions) {
            setOptionsCache((prev) => ({ ...prev, [query]: loadedOptions }));
          }
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load options');
          setOptions([]);
        } finally {
          setIsLoadingOptions(false);
        }
      },
      [loadOptions, cacheOptions, optionsCache]
    );

    React.useEffect(() => {
      if (loadOptions && isOpen) {
        loadAsyncOptions(debouncedSearch);
      }
    }, [debouncedSearch, loadOptions, isOpen, loadAsyncOptions]);

    React.useEffect(() => {
      if (!loadOptions) {
        setOptions(initialOptions);
      }
    }, [initialOptions, loadOptions]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          onBlur?.();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen, onBlur]);

    React.useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    React.useEffect(() => {
      if (isOpen && focusedIndex >= 0 && dropdownRef.current) {
        const focusedElement = dropdownRef.current.querySelector(
          `[data-option-index="${focusedIndex}"]`
        ) as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [focusedIndex, isOpen]);

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        setFocusedIndex(-1);
        setSearchQuery('');
      }
    };

    const handleSelect = (optionValue: string) => {
      if (disabled) return;

      const option = options.find((opt) => opt.value === optionValue);
      if (option?.disabled) return;

      let newValue: SelectValue;

      if (multiple) {
        const currentValues = selectedValues.filter(Boolean);
        if (currentValues.includes(optionValue)) {
          newValue = currentValues.filter((v) => v !== optionValue);
        } else {
          if (maxSelections && currentValues.length >= maxSelections) {
            return;
          }
          newValue = [...currentValues, optionValue];
        }
      } else {
        newValue = optionValue;
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }

      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleRemoveChip = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      handleSelect(optionValue);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      const newValue = multiple ? [] : '';
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }
          break;

        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchQuery('');
          }
          break;

        case 'Backspace':
          if (
            multiple &&
            searchable &&
            !searchQuery &&
            selectedValues.length > 0
          ) {
            e.preventDefault();
            handleSelect(selectedValues[selectedValues.length - 1]);
          }
          break;
      }
    };

    const hasValue = selectedValues.length > 0 && selectedValues[0] !== '';

    return (
      <div ref={containerRef} className={cn('relative w-full', className)} {...props}>
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={name}
          value={Array.isArray(controlledValue) ? controlledValue.join(',') : controlledValue}
          disabled={disabled}
        />

        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={dropdownId}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-white text-left font-normal transition-all',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            sizeClasses[size],
            error
              ? 'border-red-500 focus-visible:ring-red-600'
              : 'border-gray-300 focus-visible:ring-blue-600 hover:border-gray-400',
            disabled && 'cursor-not-allowed bg-gray-50 opacity-60',
            !hasValue && 'text-gray-400'
          )}
        >
          <span className="flex-1 truncate">{displayValue}</span>
          <div className="flex items-center gap-1 ml-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
            {clearable && hasValue && !loading && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {multiple && hasValue && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span>{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(opt.value, e)}
                  disabled={disabled}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={`Remove ${opt.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {isOpen && (
          <div
            ref={dropdownRef}
            id={dropdownId}
            role="listbox"
            aria-labelledby={triggerId}
            aria-multiselectable={multiple}
            className={cn(
              'absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg',
              'max-h-60 overflow-auto'
            )}
          >
            {searchable && (
              <div className="sticky top-0 border-b border-gray-200 bg-white p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    ref={searchInputRef}
                    id={searchId}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    aria-label="Search options"
                  />
                </div>
              </div>
            )}

            <div className="py-1">
              {isLoadingOptions ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading options...
                </div>
              ) : loadError ? (
                <div className="px-3 py-6 text-center text-sm text-red-600">
                  {loadError}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  {emptyMessage}
                </div>
              ) : (
                Object.entries(groupedOptions).map(([groupKey, groupOptions]) => (
                  <div key={groupKey}>
                    {groupKey !== '__default__' && (
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        {groupKey}
                      </div>
                    )}
                    {groupOptions.map((option) => {
                      const globalIndex = filteredOptions.indexOf(option);
                      const isSelected = selectedValues.includes(option.value);
                      const isFocused = globalIndex === focusedIndex;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-option-index={globalIndex}
                          disabled={option.disabled}
                          onClick={() => handleSelect(option.value)}
                          onMouseEnter={() => setFocusedIndex(globalIndex)}
                          className={cn(
                            'flex w-full items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                            isFocused && 'bg-gray-100',
                            isSelected && 'bg-blue-50 text-blue-700',
                            option.disabled
                              ? 'cursor-not-allowed opacity-50'
                              : 'cursor-pointer hover:bg-gray-100'
                          )}
                        >
                          <span className={cn('flex-1', multiple && 'ml-6')}>
                            {option.label}
                          </span>
                          {multiple && (
                            <div className="absolute left-3">
                              <div
                                className={cn(
                                  'h-4 w-4 rounded border flex items-center justify-center',
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300'
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          )}
                          {!multiple && isSelected && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
