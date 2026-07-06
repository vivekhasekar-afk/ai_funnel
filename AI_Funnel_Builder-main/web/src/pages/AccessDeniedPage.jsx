// =============================================================================
// AI FUNNEL PLATFORM - Access Denied Page (Production Premium)
// =============================================================================

import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './AccessDeniedPage.css';

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state || {};
  
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  // Get dynamic message based on denial reason
  const getDenialInfo = () => {
    switch (state.reason) {
      case 'insufficient_role':
        return {
          title: 'Access Restricted',
          subtitle: 'Role Permissions Required',
          message: `This area is restricted to users with ${state.requiredRoles?.join(' or ')} privileges.`,
          icon: 'shield',
          color: 'orange',
          suggestions: [
            'Contact your administrator to request role elevation',
            'Review your account permissions in settings',
            'Explore other available features'
          ]
        };
      
      case 'insufficient_permissions':
        return {
          title: 'Permission Denied',
          subtitle: 'Additional Permissions Required',
          message: `You need the following permissions: ${state.requiredPermissions?.join(', ')}`,
          icon: 'lock',
          color: 'red',
          suggestions: [
            'Request access from your team administrator',
            'Check if you have pending permission requests',
            'Review available features for your role'
          ]
        };
      
      case 'insufficient_tier':
        return {
          title: 'Premium Feature',
          subtitle: 'Subscription Upgrade Required',
          message: `This feature requires ${state.requiredTier} plan or higher.`,
          icon: 'star',
          color: 'purple',
          suggestions: [
            'Upgrade to unlock advanced features',
            'View feature comparison',
            'Contact sales for custom plans'
          ]
        };
      
      default:
        return {
          title: 'Access Denied',
          subtitle: 'Insufficient Privileges',
          message: 'You do not have permission to access this resource.',
          icon: 'lock',
          color: 'red',
          suggestions: [
            'Return to your dashboard',
            'Contact support for assistance',
            'Review your account permissions'
          ]
        };
    }
  };

  const denialInfo = getDenialInfo();

  // Icon components
  const icons = {
    lock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" 
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" 
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" 
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  };

  return (
    <div className={`access-denied-page ${isAnimating ? 'is-animating' : ''}`}>
      {/* Background Elements */}
      <div className="access-denied-bg">
        <div className="access-denied-bg-circle access-denied-bg-circle--1"></div>
        <div className="access-denied-bg-circle access-denied-bg-circle--2"></div>
        <div className="access-denied-bg-circle access-denied-bg-circle--3"></div>
      </div>

      {/* Main Content */}
      <div className="access-denied-container">
        <div className="access-denied-content">
          {/* Icon */}
          <div className={`access-denied-icon access-denied-icon--${denialInfo.color}`}>
            <div className="access-denied-icon-bg"></div>
            <div className="access-denied-icon-symbol">
              {icons[denialInfo.icon]}
            </div>
          </div>

          {/* Badge */}
          <div className="access-denied-badge">
            <span className="access-denied-badge-text">{denialInfo.subtitle}</span>
          </div>

          {/* Title */}
          <h1 className="access-denied-title">{denialInfo.title}</h1>

          {/* Message */}
          <p className="access-denied-message">{denialInfo.message}</p>

          {/* User Info */}
          {user && (
            <div className="access-denied-user">
              <div className="access-denied-user-avatar">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="access-denied-user-info">
                <div className="access-denied-user-name">{user.full_name || 'User'}</div>
                <div className="access-denied-user-role">
                  {user.user_type || 'Basic User'} • {user.subscription_tier || 'Free Plan'}
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="access-denied-suggestions">
            <h3 className="access-denied-suggestions-title">What you can do:</h3>
            <ul className="access-denied-suggestions-list">
              {denialInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="access-denied-suggestions-item">
                  <svg className="access-denied-suggestions-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="access-denied-actions">
            {state.reason === 'insufficient_tier' ? (
              <>
                <button 
                  className="access-denied-btn access-denied-btn--primary"
                  onClick={() => navigate('/pricing')}
                >
                  <svg className="access-denied-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  Upgrade Plan
                </button>
                <button 
                  className="access-denied-btn access-denied-btn--secondary"
                  onClick={() => navigate('/pricing#compare')}
                >
                  <svg className="access-denied-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  Compare Plans
                </button>
              </>
            ) : (
              <>
                <button 
                  className="access-denied-btn access-denied-btn--primary"
                  onClick={() => navigate('/dashboard')}
                >
                  <svg className="access-denied-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Go to Dashboard
                </button>
                <button 
                  className="access-denied-btn access-denied-btn--secondary"
                  onClick={() => navigate(-1)}
                >
                  <svg className="access-denied-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Go Back
                </button>
              </>
            )}
          </div>

          {/* Help Link */}
          <div className="access-denied-help">
            <span>Need help?</span>
            <button 
              className="access-denied-help-link"
              onClick={() => navigate('/support')}
            >
              Contact Support
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
