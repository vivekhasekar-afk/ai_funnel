// =============================================================================
// AI FUNNEL PLATFORM - UI Slice
// =============================================================================
// Global UI state management (theme, sidebar, modals, notifications, etc.)
// No dependencies - foundation slice
// =============================================================================

import { createSlice } from '@reduxjs/toolkit';

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Theme
  theme: localStorage.getItem('theme') || 'light',
  
  // Sidebar
  sidebar: {
    isOpen: localStorage.getItem('sidebar-open') !== 'false',
    isCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
    activeSection: null,
  },
  
  // Modals
  modals: {
    active: null, // Current active modal
    data: null, // Data passed to modal
    queue: [], // Modal queue for sequential modals
  },
  
  // Notifications/Toasts
  notifications: [],
  
  // Loading states
  loading: {
    global: false,
    operations: {}, // Key-value pairs for specific operations
  },
  
  // Breadcrumbs
  breadcrumbs: [],
  
  // Search
  search: {
    isOpen: false,
    query: '',
    results: [],
    isSearching: false,
  },
  
  // Command palette
  commandPalette: {
    isOpen: false,
  },
  
  // Settings panel
  settingsPanel: {
    isOpen: false,
    activeTab: 'general',
  },
  
  // Right panel (properties, inspector)
  rightPanel: {
    isOpen: false,
    content: null, // 'properties', 'inspector', 'help', etc.
    width: 320,
  },
  
  // Layout
  layout: {
    view: localStorage.getItem('layout-view') || 'grid', // 'grid', 'list', 'kanban'
    density: localStorage.getItem('layout-density') || 'comfortable', // 'compact', 'comfortable', 'spacious'
  },
  
  // Confirmation dialog
  confirmation: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default', // 'default', 'danger', 'warning'
  },
  
  // Page title
  pageTitle: 'AI Funnel Platform',
  
  // Scroll position cache (for back navigation)
  scrollPositions: {},
  
  // Device info
  device: {
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  },
  
  // Keyboard shortcuts enabled
  keyboardShortcutsEnabled: true,
  
  // Drag and drop state
  dragDrop: {
    isDragging: false,
    dragType: null,
    dragData: null,
  },
};

// =============================================================================
// SLICE
// =============================================================================

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // =========================================================================
    // THEME
    // =========================================================================
    
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(action.payload);
    },
    
    toggleTheme: (state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem('theme', newTheme);
      
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    },
    
    // =========================================================================
    // SIDEBAR
    // =========================================================================
    
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
      localStorage.setItem('sidebar-open', state.sidebar.isOpen);
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebar.isOpen = action.payload;
      localStorage.setItem('sidebar-open', action.payload);
    },
    
    toggleSidebarCollapse: (state) => {
      state.sidebar.isCollapsed = !state.sidebar.isCollapsed;
      localStorage.setItem('sidebar-collapsed', state.sidebar.isCollapsed);
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebar.isCollapsed = action.payload;
      localStorage.setItem('sidebar-collapsed', action.payload);
    },
    
    setActiveSidebarSection: (state, action) => {
      state.sidebar.activeSection = action.payload;
    },
    
    // =========================================================================
    // MODALS
    // =========================================================================
    
    openModal: (state, action) => {
      const { modal, data = null, addToQueue = false } = action.payload;
      
      if (addToQueue && state.modals.active) {
        // Add to queue if another modal is active
        state.modals.queue.push({ modal, data });
      } else {
        state.modals.active = modal;
        state.modals.data = data;
      }
    },
    
    closeModal: (state) => {
      state.modals.active = null;
      state.modals.data = null;
      
      // Open next modal in queue
      if (state.modals.queue.length > 0) {
        const nextModal = state.modals.queue.shift();
        state.modals.active = nextModal.modal;
        state.modals.data = nextModal.data;
      }
    },
    
    clearModalQueue: (state) => {
      state.modals.queue = [];
    },
    
    // =========================================================================
    // NOTIFICATIONS
    // =========================================================================
    
    addNotification: (state, action) => {
      const notification = {
        id: action.payload.id || `notification-${Date.now()}-${Math.random()}`,
        type: action.payload.type || 'info', // 'success', 'error', 'warning', 'info'
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration !== undefined ? action.payload.duration : 5000,
        action: action.payload.action || null,
        timestamp: Date.now(),
      };
      
      state.notifications.push(notification);
      
      // Limit to max 5 notifications
      if (state.notifications.length > 5) {
        state.notifications.shift();
      }
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        n => n.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // =========================================================================
    // LOADING
    // =========================================================================
    
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    setOperationLoading: (state, action) => {
      const { operation, isLoading } = action.payload;
      
      if (isLoading) {
        state.loading.operations[operation] = true;
      } else {
        delete state.loading.operations[operation];
      }
    },
    
    clearAllLoading: (state) => {
      state.loading.global = false;
      state.loading.operations = {};
    },
    
    // =========================================================================
    // BREADCRUMBS
    // =========================================================================
    
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action) => {
      state.breadcrumbs.push(action.payload);
    },
    
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },
    
    // =========================================================================
    // SEARCH
    // =========================================================================
    
    openSearch: (state) => {
      state.search.isOpen = true;
    },
    
    closeSearch: (state) => {
      state.search.isOpen = false;
      state.search.query = '';
      state.search.results = [];
    },
    
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    
    setSearchResults: (state, action) => {
      state.search.results = action.payload;
    },
    
    setSearching: (state, action) => {
      state.search.isSearching = action.payload;
    },
    
    // =========================================================================
    // COMMAND PALETTE
    // =========================================================================
    
    toggleCommandPalette: (state) => {
      state.commandPalette.isOpen = !state.commandPalette.isOpen;
    },
    
    openCommandPalette: (state) => {
      state.commandPalette.isOpen = true;
    },
    
    closeCommandPalette: (state) => {
      state.commandPalette.isOpen = false;
    },
    
    // =========================================================================
    // SETTINGS PANEL
    // =========================================================================
    
    toggleSettingsPanel: (state) => {
      state.settingsPanel.isOpen = !state.settingsPanel.isOpen;
    },
    
    openSettingsPanel: (state, action) => {
      state.settingsPanel.isOpen = true;
      if (action.payload) {
        state.settingsPanel.activeTab = action.payload;
      }
    },
    
    closeSettingsPanel: (state) => {
      state.settingsPanel.isOpen = false;
    },
    
    setSettingsPanelTab: (state, action) => {
      state.settingsPanel.activeTab = action.payload;
    },
    
    // =========================================================================
    // RIGHT PANEL
    // =========================================================================
    
    toggleRightPanel: (state) => {
      state.rightPanel.isOpen = !state.rightPanel.isOpen;
    },
    
    openRightPanel: (state, action) => {
      state.rightPanel.isOpen = true;
      if (action.payload) {
        state.rightPanel.content = action.payload;
      }
    },
    
    closeRightPanel: (state) => {
      state.rightPanel.isOpen = false;
    },
    
    setRightPanelContent: (state, action) => {
      state.rightPanel.content = action.payload;
    },
    
    setRightPanelWidth: (state, action) => {
      state.rightPanel.width = action.payload;
    },
    
    // =========================================================================
    // LAYOUT
    // =========================================================================
    
    setLayoutView: (state, action) => {
      state.layout.view = action.payload;
      localStorage.setItem('layout-view', action.payload);
    },
    
    setLayoutDensity: (state, action) => {
      state.layout.density = action.payload;
      localStorage.setItem('layout-density', action.payload);
    },
    
    // =========================================================================
    // CONFIRMATION DIALOG
    // =========================================================================
    
    openConfirmation: (state, action) => {
      state.confirmation = {
        isOpen: true,
        title: action.payload.title || 'Confirm Action',
        message: action.payload.message || 'Are you sure?',
        confirmText: action.payload.confirmText || 'Confirm',
        cancelText: action.payload.cancelText || 'Cancel',
        variant: action.payload.variant || 'default',
        onConfirm: action.payload.onConfirm || null,
        onCancel: action.payload.onCancel || null,
      };
    },
    
    closeConfirmation: (state) => {
      state.confirmation.isOpen = false;
    },
    
    // =========================================================================
    // PAGE TITLE
    // =========================================================================
    
    setPageTitle: (state, action) => {
      state.pageTitle = action.payload;
      document.title = `${action.payload} | AI Funnel Platform`;
    },
    
    // =========================================================================
    // SCROLL POSITIONS
    // =========================================================================
    
    saveScrollPosition: (state, action) => {
      const { key, position } = action.payload;
      state.scrollPositions[key] = position;
    },
    
    clearScrollPosition: (state, action) => {
      delete state.scrollPositions[action.payload];
    },
    
    // =========================================================================
    // DEVICE
    // =========================================================================
    
    updateDeviceInfo: (state, action) => {
      state.device = action.payload;
    },
    
    // =========================================================================
    // KEYBOARD SHORTCUTS
    // =========================================================================
    
    toggleKeyboardShortcuts: (state) => {
      state.keyboardShortcutsEnabled = !state.keyboardShortcutsEnabled;
    },
    
    setKeyboardShortcutsEnabled: (state, action) => {
      state.keyboardShortcutsEnabled = action.payload;
    },
    
    // =========================================================================
    // DRAG AND DROP
    // =========================================================================
    
    startDragging: (state, action) => {
      state.dragDrop.isDragging = true;
      state.dragDrop.dragType = action.payload.type;
      state.dragDrop.dragData = action.payload.data;
    },
    
    stopDragging: (state) => {
      state.dragDrop.isDragging = false;
      state.dragDrop.dragType = null;
      state.dragDrop.dragData = null;
    },
    
    // =========================================================================
    // RESET
    // =========================================================================
    
    resetUI: () => initialState,
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Theme
  setTheme,
  toggleTheme,
  
  // Sidebar
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapse,
  setSidebarCollapsed,
  setActiveSidebarSection,
  
  // Modals
  openModal,
  closeModal,
  clearModalQueue,
  
  // Notifications
  addNotification,
  removeNotification,
  clearNotifications,
  
  // Loading
  setGlobalLoading,
  setOperationLoading,
  clearAllLoading,
  
  // Breadcrumbs
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  
  // Search
  openSearch,
  closeSearch,
  setSearchQuery,
  setSearchResults,
  setSearching,
  
  // Command palette
  toggleCommandPalette,
  openCommandPalette,
  closeCommandPalette,
  
  // Settings panel
  toggleSettingsPanel,
  openSettingsPanel,
  closeSettingsPanel,
  setSettingsPanelTab,
  
  // Right panel
  toggleRightPanel,
  openRightPanel,
  closeRightPanel,
  setRightPanelContent,
  setRightPanelWidth,
  
  // Layout
  setLayoutView,
  setLayoutDensity,
  
  // Confirmation
  openConfirmation,
  closeConfirmation,
  
  // Page title
  setPageTitle,
  
  // Scroll positions
  saveScrollPosition,
  clearScrollPosition,
  
  // Device
  updateDeviceInfo,
  
  // Keyboard shortcuts
  toggleKeyboardShortcuts,
  setKeyboardShortcutsEnabled,
  
  // Drag and drop
  startDragging,
  stopDragging,
  
  // Reset
  resetUI,
} = uiSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Theme
export const selectTheme = (state) => state.ui.theme;
export const selectIsDarkMode = (state) => state.ui.theme === 'dark';

// Sidebar
export const selectSidebar = (state) => state.ui.sidebar;
export const selectIsSidebarOpen = (state) => state.ui.sidebar.isOpen;
export const selectIsSidebarCollapsed = (state) => state.ui.sidebar.isCollapsed;
export const selectActiveSidebarSection = (state) => state.ui.sidebar.activeSection;

// Modals
export const selectActiveModal = (state) => state.ui.modals.active;
export const selectModalData = (state) => state.ui.modals.data;
export const selectModalQueue = (state) => state.ui.modals.queue;
export const selectHasActiveModal = (state) => state.ui.modals.active !== null;

// Notifications
export const selectNotifications = (state) => state.ui.notifications;
export const selectHasNotifications = (state) => state.ui.notifications.length > 0;

// Loading
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectOperationLoading = (operation) => (state) => 
  state.ui.loading.operations[operation] || false;
export const selectIsAnyOperationLoading = (state) => 
  Object.keys(state.ui.loading.operations).length > 0;

// Breadcrumbs
export const selectBreadcrumbs = (state) => state.ui.breadcrumbs;

// Search
export const selectSearch = (state) => state.ui.search;
export const selectIsSearchOpen = (state) => state.ui.search.isOpen;
export const selectSearchQuery = (state) => state.ui.search.query;
export const selectSearchResults = (state) => state.ui.search.results;
export const selectIsSearching = (state) => state.ui.search.isSearching;

// Command palette
export const selectIsCommandPaletteOpen = (state) => state.ui.commandPalette.isOpen;

// Settings panel
export const selectIsSettingsPanelOpen = (state) => state.ui.settingsPanel.isOpen;
export const selectSettingsPanelActiveTab = (state) => state.ui.settingsPanel.activeTab;

// Right panel
export const selectRightPanel = (state) => state.ui.rightPanel;
export const selectIsRightPanelOpen = (state) => state.ui.rightPanel.isOpen;
export const selectRightPanelContent = (state) => state.ui.rightPanel.content;

// Layout
export const selectLayoutView = (state) => state.ui.layout.view;
export const selectLayoutDensity = (state) => state.ui.layout.density;

// Confirmation
export const selectConfirmation = (state) => state.ui.confirmation;
export const selectIsConfirmationOpen = (state) => state.ui.confirmation.isOpen;

// Page title
export const selectPageTitle = (state) => state.ui.pageTitle;

// Scroll positions
export const selectScrollPosition = (key) => (state) => 
  state.ui.scrollPositions[key];

// Device
export const selectDevice = (state) => state.ui.device;
export const selectIsMobile = (state) => state.ui.device.isMobile;
export const selectIsTablet = (state) => state.ui.device.isTablet;
export const selectIsDesktop = (state) => state.ui.device.isDesktop;

// Keyboard shortcuts
export const selectKeyboardShortcutsEnabled = (state) => 
  state.ui.keyboardShortcutsEnabled;

// Drag and drop
export const selectDragDrop = (state) => state.ui.dragDrop;
export const selectIsDragging = (state) => state.ui.dragDrop.isDragging;

// =============================================================================
// THUNKS (Async Actions)
// =============================================================================

/**
 * Show notification with auto-dismiss
 */
export const showNotification = (notification) => (dispatch) => {
  const id = `notification-${Date.now()}-${Math.random()}`;
  
  dispatch(addNotification({
    ...notification,
    id,
  }));
  
  // Auto-dismiss after duration
  if (notification.duration !== 0) {
    const duration = notification.duration || 5000;
    setTimeout(() => {
      dispatch(removeNotification(id));
    }, duration);
  }
  
  return id;
};

/**
 * Show success notification
 */
export const showSuccess = (message, title = 'Success') => (dispatch) => {
  return dispatch(showNotification({
    type: 'success',
    title,
    message,
  }));
};

/**
 * Show error notification
 */
export const showError = (message, title = 'Error') => (dispatch) => {
  return dispatch(showNotification({
    type: 'error',
    title,
    message,
    duration: 7000, // Longer duration for errors
  }));
};

/**
 * Show warning notification
 */
export const showWarning = (message, title = 'Warning') => (dispatch) => {
  return dispatch(showNotification({
    type: 'warning',
    title,
    message,
  }));
};

/**
 * Show info notification
 */
export const showInfo = (message, title = 'Info') => (dispatch) => {
  return dispatch(showNotification({
    type: 'info',
    title,
    message,
  }));
};

/**
 * Confirm action with dialog
 */
export const confirmAction = (options) => (dispatch) => {
  return new Promise((resolve, reject) => {
    dispatch(openConfirmation({
      ...options,
      onConfirm: () => {
        dispatch(closeConfirmation());
        resolve(true);
      },
      onCancel: () => {
        dispatch(closeConfirmation());
        resolve(false);
      },
    }));
  });
};

// =============================================================================
// REDUCER
// =============================================================================

export default uiSlice.reducer;
