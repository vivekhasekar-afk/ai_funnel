// =============================================================================
// AI FUNNEL PLATFORM - Theme Context (Production Grade)
// =============================================================================
// Provides theme management (light/dark mode), color schemes, and UI preferences
// Persists theme settings to localStorage with system preference detection
// =============================================================================

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const ThemeContext = createContext(null);

// =============================================================================
// CONSTANTS
// =============================================================================

const THEME_STORAGE_KEY = 'ai-funnel-theme';
const COLOR_SCHEME_STORAGE_KEY = 'ai-funnel-color-scheme';

const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

const COLOR_SCHEMES = {
  BLUE: 'blue',
  PURPLE: 'purple',
  GREEN: 'green',
  ORANGE: 'orange',
  RED: 'red',
  PINK: 'pink',
};

const DEFAULT_THEME = THEMES.SYSTEM;
const DEFAULT_COLOR_SCHEME = COLOR_SCHEMES.BLUE;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get system theme preference
 */
const getSystemTheme = () => {
  if (typeof window === 'undefined') return THEMES.LIGHT;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEMES.DARK
    : THEMES.LIGHT;
};

/**
 * Get stored theme from localStorage
 */
const getStoredTheme = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to read theme from localStorage:', error);
    return null;
  }
};

/**
 * Store theme to localStorage
 */
const storeTheme = (theme) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme to localStorage:', error);
  }
};

/**
 * Get stored color scheme from localStorage
 */
const getStoredColorScheme = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to read color scheme from localStorage:', error);
    return null;
  }
};

/**
 * Store color scheme to localStorage
 */
const storeColorScheme = (scheme) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  } catch (error) {
    console.error('Failed to save color scheme to localStorage:', error);
  }
};

/**
 * Apply theme to document
 */
const applyTheme = (theme, colorScheme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove(THEMES.LIGHT, THEMES.DARK);
  
  // Add new theme class
  root.classList.add(theme);
  
  // Set data attributes for CSS
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-color-scheme', colorScheme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === THEMES.DARK ? '#1F2937' : '#FFFFFF'
    );
  }
};

// =============================================================================
// THEME PROVIDER COMPONENT
// =============================================================================

export const ThemeProvider = ({ children, defaultTheme = DEFAULT_THEME }) => {
  // =========================================================================
  // STATE
  // =========================================================================

  const [themeMode, setThemeMode] = useState(() => {
    return getStoredTheme() || defaultTheme;
  });

  const [colorScheme, setColorScheme] = useState(() => {
    return getStoredColorScheme() || DEFAULT_COLOR_SCHEME;
  });

  const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  // Resolve actual theme (handle 'system' mode)
  const resolvedTheme = useMemo(() => {
    if (themeMode === THEMES.SYSTEM) {
      return systemTheme;
    }
    return themeMode;
  }, [themeMode, systemTheme]);

  // =========================================================================
  // SYSTEM THEME LISTENER
  // =========================================================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      setSystemTheme(newSystemTheme);
      console.log('🌓 System theme changed to:', newSystemTheme);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  // =========================================================================
  // APPLY THEME TO DOM
  // =========================================================================

  useEffect(() => {
    applyTheme(resolvedTheme, colorScheme);
    console.log(`🎨 Theme applied: ${resolvedTheme} (${colorScheme})`);
  }, [resolvedTheme, colorScheme]);

  // =========================================================================
  // THEME ACTIONS
  // =========================================================================

  /**
   * Set theme mode
   */
  const setTheme = useCallback((newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.error(`Invalid theme: ${newTheme}`);
      return;
    }

    setThemeMode(newTheme);
    storeTheme(newTheme);
    console.log('✅ Theme changed to:', newTheme);
  }, []);

  /**
   * Toggle between light and dark
   */
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  /**
   * Set color scheme
   */
  const changeColorScheme = useCallback((newScheme) => {
    if (!Object.values(COLOR_SCHEMES).includes(newScheme)) {
      console.error(`Invalid color scheme: ${newScheme}`);
      return;
    }

    setColorScheme(newScheme);
    storeColorScheme(newScheme);
    console.log('✅ Color scheme changed to:', newScheme);
  }, []);

  /**
   * Reset to system theme
   */
  const useSystemTheme = useCallback(() => {
    setTheme(THEMES.SYSTEM);
  }, [setTheme]);

  /**
   * Reset to defaults
   */
  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
    changeColorScheme(DEFAULT_COLOR_SCHEME);
  }, [setTheme, changeColorScheme]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const contextValue = useMemo(
    () => ({
      // Current state
      theme: resolvedTheme,
      themeMode,
      colorScheme,
      systemTheme,

      // Theme checks
      isDark: resolvedTheme === THEMES.DARK,
      isLight: resolvedTheme === THEMES.LIGHT,
      isSystemMode: themeMode === THEMES.SYSTEM,

      // Actions
      setTheme,
      toggleTheme,
      changeColorScheme,
      useSystemTheme,
      resetTheme,

      // Constants
      availableThemes: Object.values(THEMES),
      availableColorSchemes: Object.values(COLOR_SCHEMES),
    }),
    [
      resolvedTheme,
      themeMode,
      colorScheme,
      systemTheme,
      setTheme,
      toggleTheme,
      changeColorScheme,
      useSystemTheme,
      resetTheme,
    ]
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

// PropTypes validation
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultTheme: PropTypes.oneOf(Object.values(THEMES)),
};

// =============================================================================
// CUSTOM HOOK
// =============================================================================

/**
 * Hook to access theme context
 * @throws {Error} if used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ThemeContext;

export { THEMES, COLOR_SCHEMES };
