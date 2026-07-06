// =============================================================================
// AI FUNNEL PLATFORM - Notification Context (Production Grade)
// =============================================================================
// Provides toast notification system with queue management and auto-dismiss
// Integrates with Redux UI slice for global notification state
// Synced with: ui.slice.js
// =============================================================================

import { createContext, useContext, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

// ✅ FIXED: Import actual exports from ui.slice.js
import {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showNotification,
  removeNotification,
  clearNotifications,
  selectNotifications,
  selectHasNotifications,
} from '@/store/slices/ui.slice';

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const NotificationContext = createContext(null);

// =============================================================================
// CONSTANTS
// =============================================================================

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

const DEFAULT_DURATION = {
  [NOTIFICATION_TYPES.SUCCESS]: 3000,
  [NOTIFICATION_TYPES.ERROR]: 7000,
  [NOTIFICATION_TYPES.INFO]: 4000,
  [NOTIFICATION_TYPES.WARNING]: 5000,
};

const POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right',
};

const DEFAULT_POSITION = POSITIONS.TOP_RIGHT;

// =============================================================================
// NOTIFICATION PROVIDER COMPONENT
// =============================================================================

export const NotificationProvider = ({ children, defaultPosition = DEFAULT_POSITION }) => {
  const dispatch = useDispatch();

  // =========================================================================
  // SELECTORS
  // =========================================================================

  const notifications = useSelector(selectNotifications) || [];
  const hasNotifications = useSelector(selectHasNotifications);

  // =========================================================================
  // NOTIFICATION ACTIONS
  // =========================================================================

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {string|object} titleOrOptions - Title or options object
   */
  const success = useCallback(
    (message, titleOrOptions = {}) => {
      const options = typeof titleOrOptions === 'string' 
        ? { title: titleOrOptions } 
        : titleOrOptions;

      const title = options.title || 'Success';
      
      dispatch(showSuccess(message, title));
      console.log('✅ Success notification:', message);
    },
    [dispatch]
  );

  /**
   * Show error notification
   * @param {string|Error} error - Error message or Error object
   * @param {string|object} titleOrOptions - Title or options object
   */
  const error = useCallback(
    (errorMsg, titleOrOptions = {}) => {
      // Handle Error objects
      const message = errorMsg instanceof Error ? errorMsg.message : errorMsg;
      const options = typeof titleOrOptions === 'string' 
        ? { title: titleOrOptions } 
        : titleOrOptions;

      const title = options.title || 'Error';

      dispatch(showError(message, title));
      console.error('❌ Error notification:', message);

      // Log full error object in development
      if (process.env.NODE_ENV === 'development' && errorMsg instanceof Error) {
        console.error('Error details:', errorMsg);
      }
    },
    [dispatch]
  );

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {string|object} titleOrOptions - Title or options object
   */
  const info = useCallback(
    (message, titleOrOptions = {}) => {
      const options = typeof titleOrOptions === 'string' 
        ? { title: titleOrOptions } 
        : titleOrOptions;

      const title = options.title || 'Info';

      dispatch(showInfo(message, title));
      console.log('ℹ️ Info notification:', message);
    },
    [dispatch]
  );

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {string|object} titleOrOptions - Title or options object
   */
  const warning = useCallback(
    (message, titleOrOptions = {}) => {
      const options = typeof titleOrOptions === 'string' 
        ? { title: titleOrOptions } 
        : titleOrOptions;

      const title = options.title || 'Warning';

      dispatch(showWarning(message, title));
      console.warn('⚠️ Warning notification:', message);
    },
    [dispatch]
  );

  /**
   * Show custom notification
   * @param {object} config - Complete notification configuration
   */
  const custom = useCallback(
    (config) => {
      dispatch(showNotification(config));
      console.log(`🔔 Custom notification (${config.type || 'info'}):`, config.message);
    },
    [dispatch]
  );

  /**
   * Show promise-based notification
   * Automatically shows loading, success, or error based on promise state
   * @param {Promise} promise - Promise to track
   * @param {object} messages - Messages for each state
   */
  const promise = useCallback(
    async (promiseInstance, messages = {}) => {
      const {
        loading = 'Loading...',
        success: successMsg = 'Success!',
        error: errorMsg = 'An error occurred',
      } = messages;

      // Show loading notification
      let loadingId = null;
      dispatch(showNotification({
        type: NOTIFICATION_TYPES.INFO,
        title: 'Loading',
        message: loading,
        duration: 0, // Don't auto-dismiss
      }));

      try {
        const result = await promiseInstance;

        // Hide loading notification (if we had an ID)
        if (loadingId) {
          dispatch(removeNotification(loadingId));
        }

        // Show success notification
        success(typeof successMsg === 'function' ? successMsg(result) : successMsg);

        return result;
      } catch (err) {
        // Hide loading notification (if we had an ID)
        if (loadingId) {
          dispatch(removeNotification(loadingId));
        }

        // Show error notification
        error(typeof errorMsg === 'function' ? errorMsg(err) : errorMsg);

        throw err;
      }
    },
    [dispatch, success, error]
  );

  /**
   * Dismiss a specific notification
   * @param {string} id - Notification ID
   */
  const dismiss = useCallback(
    (id) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    dispatch(clearNotifications());
    console.log('🧹 All notifications cleared');
  }, [dispatch]);

  /**
   * Show notification with action button
   * @param {string} message - Notification message
   * @param {object} actionConfig - Action button configuration
   */
  const withAction = useCallback(
    (message, actionConfig = {}) => {
      const {
        type = NOTIFICATION_TYPES.INFO,
        title = 'Notification',
        actionLabel = 'Action',
        onAction,
        ...options
      } = actionConfig;

      return dispatch(showNotification({
        type,
        title,
        message,
        action: {
          label: actionLabel,
          onClick: onAction,
        },
        duration: 0, // Don't auto-dismiss when there's an action
        ...options,
      }));
    },
    [dispatch]
  );

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get notifications by type
   */
  const getByType = useCallback(
    (type) => {
      return notifications.filter((notification) => notification.type === type);
    },
    [notifications]
  );

  /**
   * Count notifications by type
   */
  const countByType = useMemo(() => {
    return {
      success: notifications.filter((n) => n.type === NOTIFICATION_TYPES.SUCCESS).length,
      error: notifications.filter((n) => n.type === NOTIFICATION_TYPES.ERROR).length,
      info: notifications.filter((n) => n.type === NOTIFICATION_TYPES.INFO).length,
      warning: notifications.filter((n) => n.type === NOTIFICATION_TYPES.WARNING).length,
    };
  }, [notifications]);

  /**
   * Get most recent notification
   */
  const getLatest = useCallback(() => {
    return notifications.length > 0 ? notifications[notifications.length - 1] : null;
  }, [notifications]);

  // =========================================================================
  // CONTEXT VALUE
  // =========================================================================

  const contextValue = useMemo(
    () => ({
      // Notification methods
      success,
      error,
      info,
      warning,
      custom,
      promise,
      withAction,

      // Management methods
      dismiss,
      clearAll,
      clear: clearAll, // Alias

      // State
      notifications,
      toasts: notifications, // Alias for backward compatibility
      hasNotifications,
      hasActiveNotifications: hasNotifications, // Alias
      countByType,

      // Utilities
      getByType,
      getLatest,

      // Constants
      types: NOTIFICATION_TYPES,
      positions: POSITIONS,
      defaultDuration: DEFAULT_DURATION,
    }),
    [
      success,
      error,
      info,
      warning,
      custom,
      promise,
      withAction,
      dismiss,
      clearAll,
      notifications,
      hasNotifications,
      countByType,
      getByType,
      getLatest,
    ]
  );

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// PropTypes validation
NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultPosition: PropTypes.oneOf(Object.values(POSITIONS)),
};

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Hook to access notification context
 * @throws {Error} if used outside NotificationProvider
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return context;
};

// Alias for convenience
export const useToast = useNotification;

/**
 * Hook to quickly show notifications
 */
export const useNotify = () => {
  const { success, error, info, warning } = useNotification();
  
  return useMemo(
    () => ({
      success,
      error,
      info,
      warning,
    }),
    [success, error, info, warning]
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default NotificationContext;

export { NOTIFICATION_TYPES, POSITIONS, DEFAULT_DURATION };
