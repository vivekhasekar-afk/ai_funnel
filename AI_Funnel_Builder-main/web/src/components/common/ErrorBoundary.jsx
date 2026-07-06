// =============================================================================
// AI FUNNEL PLATFORM - Error Boundary Component
// =============================================================================
// Catches React errors and displays fallback UI with recovery options
// Depends on: Card, Button from UI components
// =============================================================================

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import Button from '../ui/Button';

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const { onError, logErrors } = this.props;
    const now = Date.now();
    
    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: now,
    }));

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error Info:', errorInfo);
    }

    // Log to error reporting service
    if (logErrors) {
      this.logErrorToService(error, errorInfo);
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Integration point for error reporting services (Sentry, LogRocket, etc.)
    try {
      // Example: Sentry integration
      // Sentry.captureException(error, { contexts: { react: errorInfo } });
      
      console.log('Error logged to service:', {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleReset = () => {
    const { onReset } = this.props;
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler
    if (onReset) {
      onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    const { homeRoute } = this.props;
    window.location.href = homeRoute || '/';
  };

  copyErrorToClipboard = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.toString() || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Timestamp: ${new Date().toISOString()}
Browser: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(
      () => alert('Error details copied to clipboard'),
      (err) => console.error('Failed to copy error:', err)
    );
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const {
      children,
      fallback,
      showDetails,
      variant,
      title,
      description,
      showReload,
      showHome,
      showReset,
      showCopy,
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, errorInfo, this.handleReset)
          : fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: '#f9fafb',
          }}
        >
          <Card
            variant={variant}
            style={{
              maxWidth: '600px',
              width: '100%',
            }}
          >
            <CardHeader
              icon={
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: '#ef4444' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
              title={title || 'Something went wrong'}
              subtitle={
                description ||
                'An unexpected error occurred. Please try again or contact support if the problem persists.'
              }
            />

            <CardBody>
              {/* Error Count Warning */}
              {errorCount > 1 && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
                    <strong>Warning:</strong> This error has occurred {errorCount} times. 
                    Consider reloading the page or returning to the home page.
                  </p>
                </div>
              )}

              {/* Error Details (Development Mode) */}
              {showDetails && error && (
                <details
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '0.813rem',
                    fontFamily: 'monospace',
                    marginBottom: '1rem',
                  }}
                >
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#991b1b',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Error Details (Click to expand)
                  </summary>
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#7f1d1d' }}>
                      <strong>Message:</strong> {error.toString()}
                    </p>
                    {error.stack && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#7f1d1d' }}>
                          <strong>Stack Trace:</strong>
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            padding: '0.75rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '200px',
                            fontSize: '0.75rem',
                            color: '#991b1b',
                          }}
                        >
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#7f1d1d' }}>
                          <strong>Component Stack:</strong>
                        </p>
                        <pre
                          style={{
                            margin: 0,
                            padding: '0.75rem',
                            backgroundColor: '#ffffff',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '150px',
                            fontSize: '0.75rem',
                            color: '#991b1b',
                          }}
                        >
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Recovery Suggestions */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#075985',
                  }}
                >
                  What can you do?
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.813rem',
                    color: '#0c4a6e',
                    lineHeight: 1.6,
                  }}
                >
                  <li>Try the action again by clicking "Try Again"</li>
                  <li>Reload the page to start fresh</li>
                  <li>Go back to the home page</li>
                  <li>Clear your browser cache and try again</li>
                  <li>Contact support if the problem continues</li>
                </ul>
              </div>
            </CardBody>

            <CardFooter spaceBetween>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {showCopy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.copyErrorToClipboard}
                    leftIcon={
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    }
                  >
                    Copy Error
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {showHome && (
                  <Button variant="secondary" onClick={this.handleGoHome}>
                    Go Home
                  </Button>
                )}
                {showReload && (
                  <Button variant="secondary" onClick={this.handleReload}>
                    Reload Page
                  </Button>
                )}
                {showReset && (
                  <Button variant="primary" onClick={this.handleReset}>
                    Try Again
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// =============================================================================
// PROP TYPES
// =============================================================================

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onReset: PropTypes.func,
  logErrors: PropTypes.bool,
  showDetails: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'flat']),
  title: PropTypes.string,
  description: PropTypes.string,
  homeRoute: PropTypes.string,
  showReload: PropTypes.bool,
  showHome: PropTypes.bool,
  showReset: PropTypes.bool,
  showCopy: PropTypes.bool,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  onError: null,
  onReset: null,
  logErrors: true,
  showDetails: process.env.NODE_ENV === 'development',
  variant: 'elevated',
  title: null,
  description: null,
  homeRoute: '/',
  showReload: true,
  showHome: true,
  showReset: true,
  showCopy: process.env.NODE_ENV === 'development',
};

// =============================================================================
// EXPORTS
// =============================================================================

export default ErrorBoundary;
