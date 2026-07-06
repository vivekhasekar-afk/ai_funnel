// =============================================================================
// AI FUNNEL PLATFORM - Root Application Component (Production Grade)
// =============================================================================
// Complete integration: Landing Page + Redux + Auth + Routing + Notifications + Theme
// All providers properly ordered and connected with landing page flow
// =============================================================================

import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { HelmetProvider } from 'react-helmet-async';

// Store
import { store, persistor, waitForRehydration } from '@/store';

// Contexts (Order matters!)
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Routes
import AppRoutes from '@/routes';

// Common Components
import ErrorBoundary from '@/components/common/ErrorBoundary';
import LoadingScreen from '@/components/common/LoadingScreen';

// Global Styles
import '@/styles/index.css';
import '@/styles/globals.css';

// =============================================================================
// APP CONFIGURATION
// =============================================================================

const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'AI Funnel Platform',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_BASE_URL,
  // ✅ Extract base URL for health checks (without /api/v1)
  baseUrl: import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v\d+$/, '') || 'http://localhost:8000',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableDevTools: import.meta.env.DEV,
  landingPage: {
    enabled: true, // Toggle landing page
    showForAuthenticatedUsers: false, // Hide landing for logged-in users
  },
};

// =============================================================================
// APP INITIALIZATION HOOK
// =============================================================================

const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(`🚀 ${APP_CONFIG.name} v${APP_CONFIG.version}`);
        console.log(`📍 Environment: ${APP_CONFIG.environment}`);
        console.log(`🔗 API URL: ${APP_CONFIG.apiUrl}`);

        // Wait for Redux store rehydration
        await waitForRehydration();
        console.log('✅ Redux store rehydrated');

        // Check API connectivity (non-blocking)
        if (APP_CONFIG.baseUrl) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            // ✅ FIXED: Use baseUrl + /health (not apiUrl which includes /api/v1)
            const healthUrl = `${APP_CONFIG.baseUrl}/health`;
            console.log('🏥 Checking API health:', healthUrl);

            const response = await fetch(healthUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const healthData = await response.json();
              console.log('✅ API connection successful:', healthData.status);
              console.log('📊 Backend version:', healthData.version);
              console.log('🌍 Environment:', healthData.environment);
            } else {
              console.warn(`⚠️ API health check failed: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn('⚠️ API health check timeout (>3s)');
            } else {
              console.warn('⚠️ Could not connect to API:', error.message);
            }
          }
        }

        // Check if landing page is enabled
        if (APP_CONFIG.landingPage.enabled) {
          console.log('✅ Landing page enabled');
        }

        // Small delay for smooth loading transition
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsInitialized(true);
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setInitError(error);
        setIsInitialized(true); // Still render app
      }
    };

    initializeApp();
  }, []);

  return { isInitialized, initError };
};

// =============================================================================
// APP METADATA MANAGER
// =============================================================================

const AppMetadata = () => {
  useEffect(() => {
    // Set page title
    document.title = `${APP_CONFIG.name} - AI-Powered Funnel Builder`;

    // Update meta tags
    const updateMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMetaTag('description', 'Build intelligent, high-converting sales funnels in minutes with AI. No coding required.');
    updateMetaTag('keywords', 'AI funnel builder, sales funnel, marketing automation, lead generation, conversion optimization');
    updateMetaTag('author', 'AI Funnel Platform');
    updateMetaTag('theme-color', '#667eea');

    // Open Graph tags for social sharing
    updateMetaTag('og:title', `${APP_CONFIG.name} - AI-Powered Funnel Builder`);
    updateMetaTag('og:description', 'Build intelligent, high-converting sales funnels in minutes with AI.');
    updateMetaTag('og:type', 'website');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', `${APP_CONFIG.name} - AI-Powered Funnel Builder`);
    updateMetaTag('twitter:description', 'Build intelligent, high-converting sales funnels in minutes with AI.');

    // Favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = '/favicon.ico';

  }, []);

  return null;
};

// =============================================================================
// SCROLL TO TOP ON ROUTE CHANGE
// =============================================================================

const ScrollRestoration = () => {
  useEffect(() => {
    // Restore scroll position on mount
    window.scrollTo(0, 0);

    // Save scroll position on unmount
    return () => {
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };
  }, []);

  return null;
};

// =============================================================================
// KEYBOARD SHORTCUTS (Development)
// =============================================================================

const KeyboardShortcuts = () => {
  useEffect(() => {
    if (!APP_CONFIG.isDevelopment) return;

    const handleKeyPress = (event) => {
      // Ctrl+Shift+D: Debug info
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        console.group('🔍 Debug Information');
        console.log('App Config:', APP_CONFIG);
        console.log('Redux Store:', store.getState());
        console.log('Current Path:', window.location.pathname);
        console.log('Auth Token:', localStorage.getItem('auth_token') ? '✅ Present' : '❌ Missing');
        console.groupEnd();
      }

      // Ctrl+Shift+L: Toggle landing page
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        console.log('🏠 Navigating to landing page...');
        window.location.href = '/';
      }

      // Ctrl+Shift+C: Clear all storage
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        if (confirm('⚠️ Clear all local storage and reload?')) {
          localStorage.clear();
          sessionStorage.clear();
          console.log('✅ Storage cleared');
          window.location.reload();
        }
      }

      // Ctrl+Shift+H: Test API health
      if (event.ctrlKey && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        console.group('🏥 API Health Check');
        fetch(`${APP_CONFIG.baseUrl}/health`)
          .then(res => res.json())
          .then(data => {
            console.log('✅ Health check successful:', data);
          })
          .catch(err => {
            console.error('❌ Health check failed:', err);
          })
          .finally(() => {
            console.groupEnd();
          });
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Log available shortcuts
    console.log('⌨️ Keyboard shortcuts available:');
    console.log('  Ctrl+Shift+D - Debug info');
    console.log('  Ctrl+Shift+L - Go to landing page');
    console.log('  Ctrl+Shift+C - Clear storage');
    console.log('  Ctrl+Shift+H - Test API health');

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return null;
};

// =============================================================================
// NETWORK STATUS INDICATOR
// =============================================================================

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Network connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn('⚠️ Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '0.75rem',
        background: '#ef4444',
        color: '#ffffff',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: 600,
        zIndex: 99999,
      }}
    >
      ⚠️ No internet connection. Some features may be unavailable.
    </div>
  );
};

// =============================================================================
// APP PROVIDERS WRAPPER
// =============================================================================

const AppProviders = ({ children }) => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <BrowserRouter>
              <ThemeProvider>
                <AuthProvider>
                  <NotificationProvider>
                    {/* App Metadata */}
                    <AppMetadata />
                    
                    {/* Scroll Restoration */}
                    <ScrollRestoration />
                    
                    {/* Keyboard Shortcuts (Dev only) */}
                    {APP_CONFIG.isDevelopment && <KeyboardShortcuts />}
                    
                    {/* Network Status */}
                    <NetworkStatus />
                    
                    {/* Main App Content */}
                    {children}
                  </NotificationProvider>
                </AuthProvider>
              </ThemeProvider>
            </BrowserRouter>
          </PersistGate>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

const App = () => {
  const { isInitialized, initError } = useAppInitialization();

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <AppProviders>
        <LoadingScreen message="Initializing AI Funnel Platform..." />
      </AppProviders>
    );
  }

  // Log initialization error (but still render app)
  if (initError) {
    console.error('⚠️ Initialization warning:', initError);
  }

  return (
    <AppProviders>
      {/* Main Application Routes (includes Landing Page) */}
      <AppRoutes />
    </AppProviders>
  );
};

// =============================================================================
// HOT MODULE REPLACEMENT (Vite)
// =============================================================================

if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Log HMR updates in development
  import.meta.hot.on('vite:beforeUpdate', () => {
    console.log('🔥 Hot module update incoming...');
  });
}

// =============================================================================
// PRODUCTION OPTIMIZATIONS
// =============================================================================

// Remove console logs in production
if (APP_CONFIG.isProduction) {
  // Keep error and warn for debugging
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default App;

// Export config for use in other modules (but don't export as named export to avoid HMR issues)
if (typeof window !== 'undefined') {
  window.__APP_CONFIG__ = APP_CONFIG;
}
