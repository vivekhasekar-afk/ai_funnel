// =============================================================================
// AI FUNNEL PLATFORM - Placeholder Page Component (Production Grade)
// =============================================================================
// Universal placeholder for pages under development
// Features: Animations, navigation helpers, theme support, accessibility
// =============================================================================

import React, { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// =============================================================================
// PLACEHOLDER PAGE COMPONENT
// =============================================================================

const PlaceholderPage = ({
  title,
  description,
  icon = 'construction',
  showBackButton = true,
  showHomeButton = true,
  suggestedLinks = [],
  variant = 'default',
  animated = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // =========================================================================
  // ICON VARIANTS
  // =========================================================================

  const icons = {
    construction: (
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    rocket: (
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    sparkles: (
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    clock: (
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  // =========================================================================
  // VARIANT STYLES
  // =========================================================================

  const variantStyles = {
    default: {
      bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-gray-900',
      descColor: 'text-gray-600',
      codeBg: 'bg-gray-100',
      codeColor: 'text-gray-700',
    },
    primary: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      iconBg: 'bg-blue-200',
      iconColor: 'text-blue-700',
      titleColor: 'text-blue-900',
      descColor: 'text-blue-700',
      codeBg: 'bg-blue-100',
      codeColor: 'text-blue-800',
    },
    success: {
      bg: 'bg-gradient-to-br from-green-50 to-emerald-100',
      iconBg: 'bg-green-200',
      iconColor: 'text-green-700',
      titleColor: 'text-green-900',
      descColor: 'text-green-700',
      codeBg: 'bg-green-100',
      codeColor: 'text-green-800',
    },
    warning: {
      bg: 'bg-gradient-to-br from-yellow-50 to-orange-100',
      iconBg: 'bg-yellow-200',
      iconColor: 'text-yellow-700',
      titleColor: 'text-yellow-900',
      descColor: 'text-yellow-700',
      codeBg: 'bg-yellow-100',
      codeColor: 'text-yellow-800',
    },
    dark: {
      bg: 'bg-gradient-to-br from-gray-800 to-gray-900',
      iconBg: 'bg-gray-700',
      iconColor: 'text-gray-300',
      titleColor: 'text-white',
      descColor: 'text-gray-300',
      codeBg: 'bg-gray-700',
      codeColor: 'text-gray-200',
    },
  };

  const styles = variantStyles[variant] || variantStyles.default;

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  const pageTitle = useMemo(() => {
    return title || 'Page Under Construction';
  }, [title]);

  const pageDescription = useMemo(() => {
    return description || `This page (${location.pathname}) is coming soon!`;
  }, [description, location.pathname]);

  const selectedIcon = useMemo(() => {
    return icons[icon] || icons.construction;
  }, [icon]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div 
      className={`flex items-center justify-center min-h-screen ${styles.bg}`}
      role="main"
      aria-labelledby="placeholder-title"
    >
      <div className="w-full max-w-2xl px-4 py-12">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-8">
            <div
              className={`
                inline-flex items-center justify-center
                p-4 rounded-full mb-4
                ${styles.iconBg} ${styles.iconColor}
                ${animated ? 'animate-bounce' : ''}
              `}
              aria-hidden="true"
            >
              {selectedIcon}
            </div>
          </div>

          {/* Title */}
          <h1
            id="placeholder-title"
            className={`
              text-4xl md:text-5xl font-bold mb-4
              ${styles.titleColor}
              ${animated ? 'animate-fade-in-up' : ''}
            `}
          >
            {pageTitle}
          </h1>

          {/* Description */}
          <p
            className={`
              text-lg md:text-xl mb-6 max-w-xl mx-auto
              ${styles.descColor}
              ${animated ? 'animate-fade-in-up animation-delay-100' : ''}
            `}
          >
            {pageDescription}
          </p>

          {/* Current Path */}
          <div
            className={`
              inline-block px-4 py-2 rounded-lg mb-8
              ${styles.codeBg}
              ${animated ? 'animate-fade-in-up animation-delay-200' : ''}
            `}
          >
            <code className={`text-sm font-mono ${styles.codeColor}`}>
              {location.pathname}
            </code>
          </div>

          {/* Action Buttons */}
          <div
            className={`
              flex flex-wrap gap-3 justify-center mb-8
              ${animated ? 'animate-fade-in-up animation-delay-300' : ''}
            `}
          >
            {showBackButton && (
              <button
                onClick={handleGoBack}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-white text-gray-700 rounded-lg
                  border border-gray-300
                  hover:bg-gray-50 hover:border-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  transition-all duration-200
                  font-medium
                "
                aria-label="Go back to previous page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Go Back
              </button>
            )}

            {showHomeButton && (
              <button
                onClick={handleGoHome}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-blue-600 text-white rounded-lg
                  hover:bg-blue-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  transition-all duration-200
                  font-medium
                  shadow-lg hover:shadow-xl
                "
                aria-label="Go to home page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go Home
              </button>
            )}
          </div>

          {/* Suggested Links */}
          {suggestedLinks.length > 0 && (
            <div
              className={`
                mt-8 pt-8 border-t border-gray-300
                ${animated ? 'animate-fade-in-up animation-delay-400' : ''}
              `}
            >
              <p className={`text-sm font-semibold mb-4 ${styles.descColor}`}>
                You might be interested in:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="
                      inline-flex items-center gap-1 px-4 py-2
                      bg-white text-blue-600 rounded-lg
                      border border-blue-200
                      hover:bg-blue-50 hover:border-blue-300
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      transition-all duration-200
                      text-sm font-medium
                    "
                  >
                    {link.label}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Development Info */}
          {process.env.NODE_ENV === 'development' && (
            <div
              className={`
                mt-8 p-4 rounded-lg text-left
                bg-yellow-50 border border-yellow-200
                ${animated ? 'animate-fade-in-up animation-delay-500' : ''}
              `}
            >
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                🔧 Development Mode Info:
              </p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• <strong>Path:</strong> {location.pathname}</li>
                <li>• <strong>Search:</strong> {location.search || 'None'}</li>
                <li>• <strong>Hash:</strong> {location.hash || 'None'}</li>
                <li>
                  • <strong>State:</strong>{' '}
                  {location.state ? JSON.stringify(location.state) : 'None'}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Animations CSS */}
      {animated && (
        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }

          .animation-delay-100 {
            animation-delay: 0.1s;
            opacity: 0;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
            opacity: 0;
          }

          .animation-delay-300 {
            animation-delay: 0.3s;
            opacity: 0;
          }

          .animation-delay-400 {
            animation-delay: 0.4s;
            opacity: 0;
          }

          .animation-delay-500 {
            animation-delay: 0.5s;
            opacity: 0;
          }

          @media (prefers-reduced-motion: reduce) {
            .animate-fade-in-up,
            .animate-bounce {
              animation: none;
              opacity: 1;
              transform: none;
            }
          }
        `}</style>
      )}
    </div>
  );
};

// =============================================================================
// PROP TYPES
// =============================================================================

PlaceholderPage.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.oneOf(['construction', 'rocket', 'sparkles', 'clock']),
  showBackButton: PropTypes.bool,
  showHomeButton: PropTypes.bool,
  suggestedLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
  variant: PropTypes.oneOf(['default', 'primary', 'success', 'warning', 'dark']),
  animated: PropTypes.bool,
};

// =============================================================================
// EXPORTS
// =============================================================================

export default PlaceholderPage;
