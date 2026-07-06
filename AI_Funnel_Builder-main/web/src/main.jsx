// =============================================================================
// AI FUNNEL PLATFORM - Application Entry Point (Production Grade)
// =============================================================================
// Browser compatibility + Performance monitoring + Error handling + React 18
// =============================================================================

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// =============================================================================
// APP CONFIGURATION
// =============================================================================

const APP_CONFIG = {
  name: 'AI Funnel Platform',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE || 'development',
  apiUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableStrictMode: import.meta.env.VITE_STRICT_MODE !== 'false',
};

// =============================================================================
// CONSOLE BRANDING (Development)
// =============================================================================

const setupConsoleBranding = () => {
  if (APP_CONFIG.isDevelopment) {
    console.log(
      '%c🚀 AI Funnel Platform',
      'font-size: 28px; font-weight: bold; color: #667eea; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); padding: 10px;'
    );
    console.log(
      `%cVersion: ${APP_CONFIG.version} | Environment: ${APP_CONFIG.environment}`,
      'font-size: 14px; color: #764ba2; font-weight: 600;'
    );
    console.log(
      `%cAPI: ${APP_CONFIG.apiUrl}`,
      'font-size: 12px; color: #6b7280;'
    );
    console.log(
      '%c\n💡 Tip: Press Ctrl+Shift+D for debug info\n',
      'font-size: 12px; color: #10b981; font-style: italic;'
    );
  }
};

// =============================================================================
// BROWSER COMPATIBILITY CHECK
// =============================================================================

const checkBrowserCompatibility = () => {
  const requiredFeatures = {
    'ES6 Classes': () => {
      try {
        eval('class Test {}');
        return true;
      } catch (e) {
        return false;
      }
    },
    'Arrow Functions': () => {
      try {
        eval('() => {}');
        return true;
      } catch (e) {
        return false;
      }
    },
    'Fetch API': () => typeof fetch === 'function',
    'Promises': () => typeof Promise !== 'undefined',
    'Local Storage': () => {
      try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        return true;
      } catch (e) {
        return false;
      }
    },
    'Session Storage': () => {
      try {
        sessionStorage.setItem('__test__', 'test');
        sessionStorage.removeItem('__test__');
        return true;
      } catch (e) {
        return false;
      }
    },
  };

  const unsupportedFeatures = Object.entries(requiredFeatures)
    .filter(([, check]) => !check())
    .map(([feature]) => feature);

  if (unsupportedFeatures.length > 0) {
    showCompatibilityError(unsupportedFeatures);
    return false;
  }

  return true;
};

const showCompatibilityError = (features) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: white;
        text-align: center;
      ">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-bottom: 1.5rem; opacity: 0.9;">
          <circle cx="12" cy="12" r="10" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h1 style="font-size: 2rem; font-weight: 900; margin: 0 0 1rem 0;">Browser Not Supported</h1>
        <p style="font-size: 1.125rem; max-width: 500px; line-height: 1.6; margin: 0 0 1.5rem 0; opacity: 0.95;">
          Your browser doesn't support the following required features:
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
          <strong>${features.join(', ')}</strong>
        </div>
        <p style="font-size: 0.938rem; opacity: 0.9;">
          Recommended: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
        </p>
      </div>
    `;
  }
};

// =============================================================================
// GLOBAL ERROR HANDLERS
// =============================================================================

const setupErrorHandlers = () => {
  // Global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('❌ Global Error:', event.error);

    if (APP_CONFIG.isProduction) {
      // TODO: Send to error tracking service (Sentry, LogRocket)
      event.preventDefault();
    }
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);

    if (APP_CONFIG.isProduction) {
      // TODO: Send to error tracking service
      event.preventDefault();
    }
  });

  // Resource loading errors
  window.addEventListener(
    'error',
    (event) => {
      if (event.target?.tagName === 'SCRIPT' || event.target?.tagName === 'LINK') {
        console.error('❌ Resource Loading Error:', event.target.src || event.target.href);
      }
    },
    true
  );
};

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

const setupPerformanceMonitoring = () => {
  if (typeof performance === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReady = perfData.domContentLoadedEventEnd - perfData.navigationStart;

      if (APP_CONFIG.isDevelopment) {
        console.group('⚡ Performance Metrics');
        console.log(`Load Time: ${loadTime}ms`);
        console.log(`DOM Ready: ${domReady}ms`);
        console.groupEnd();
      }

      // Send to analytics in production
      if (APP_CONFIG.isProduction && typeof window.gtag === 'function') {
        window.gtag('event', 'timing_complete', {
          name: 'page_load',
          value: loadTime,
        });
      }
    }, 0);
  });
};

// =============================================================================
// DEVELOPMENT TOOLS
// =============================================================================

const setupDevTools = () => {
  if (!APP_CONFIG.isDevelopment) return;

  // Expose config for debugging
  window.__APP_CONFIG__ = APP_CONFIG;
  window.__APP_VERSION__ = APP_CONFIG.version;

  // Keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    // Ctrl+Shift+D: Debug info
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      console.group('📊 App Debug Info');
      console.log('Version:', APP_CONFIG.version);
      console.log('Environment:', APP_CONFIG.environment);
      console.log('API URL:', APP_CONFIG.apiUrl);
      console.log('Redux Store:', window.__REDUX_DEVTOOLS_EXTENSION__ ? '✅ Connected' : '❌ Not found');
      console.log('React DevTools:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ? '✅ Connected' : '❌ Not found');
      console.groupEnd();
    }

    // Ctrl+Shift+C: Clear storage
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      if (confirm('⚠️ Clear all storage and reload?')) {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ Storage cleared');
        location.reload();
      }
    }
  });
};

// =============================================================================
// META TAGS SETUP
// =============================================================================

const setupMetaTags = () => {
  // Viewport
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';

  // Theme color
  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }
  themeColor.content = '#667eea';

  // Description
  if (!document.querySelector('meta[name="description"]')) {
    const description = document.createElement('meta');
    description.name = 'description';
    description.content = 'AI-powered funnel builder platform';
    document.head.appendChild(description);
  }
};

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const initializeApp = () => {
  try {
    // Setup console branding
    setupConsoleBranding();

    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
      return;
    }

    // Setup error handlers
    setupErrorHandlers();

    // Setup performance monitoring
    setupPerformanceMonitoring();

    // Setup development tools
    setupDevTools();

    // Setup meta tags
    setupMetaTags();

    // Get root element
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // Create React 18 root
    const root = createRoot(rootElement);

    // Render app (with or without StrictMode)
    const AppWithStrictMode = APP_CONFIG.enableStrictMode ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    );

    root.render(AppWithStrictMode);

    // Mark as initialized
    document.body.classList.add('app-initialized');
    document.body.setAttribute('data-env', APP_CONFIG.environment);
    document.body.setAttribute('data-version', APP_CONFIG.version);

    if (APP_CONFIG.isDevelopment) {
      console.log('✅ Application initialized successfully');
    }
  } catch (error) {
    console.error('❌ Fatal initialization error:', error);

    // Show error UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: white;
          text-align: center;
        ">
          <h1 style="font-size: 2rem; font-weight: 900; margin-bottom: 1rem;">Application Error</h1>
          <p style="font-size: 1.125rem; max-width: 600px; margin-bottom: 2rem;">
            Failed to start the application. Please reload the page.
          </p>
          <button 
            onclick="location.reload()" 
            style="
              padding: 1rem 2rem;
              background: white;
              color: #dc2626;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 700;
              cursor: pointer;
            "
          >
            Reload Page
          </button>
          <pre style="margin-top: 2rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 4px; font-size: 0.75rem; max-width: 90%; overflow: auto;">
${error.message}
          </pre>
        </div>
      `;
    }
  }
};

// =============================================================================
// START APPLICATION
// =============================================================================

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// =============================================================================
// HOT MODULE REPLACEMENT (Vite)
// =============================================================================

if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    console.log('🔥 Hot reloading...');
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

export { APP_CONFIG };
