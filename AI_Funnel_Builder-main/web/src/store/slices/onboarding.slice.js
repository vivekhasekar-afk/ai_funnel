// =============================================================================
// AI FUNNEL PLATFORM - Onboarding Slice
// =============================================================================
// User onboarding state management
// Tracks onboarding progress, steps, and collected information
// No external API dependencies (uses local storage for persistence)
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import usersAPI from '@/lib/api/users.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// CONSTANTS
// =============================================================================

const ONBOARDING_STORAGE_KEY = 'onboarding_state';

// Onboarding steps definition
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Get started with AI Funnel Platform',
    required: true,
    skippable: false,
  },
  {
    id: 'business-info',
    title: 'Business Information',
    description: 'Tell us about your business',
    required: true,
    skippable: false,
  },
  {
    id: 'goals',
    title: 'Your Goals',
    description: 'What do you want to achieve?',
    required: true,
    skippable: true,
  },
  {
    id: 'industry',
    title: 'Industry & Audience',
    description: 'Define your target market',
    required: true,
    skippable: true,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
    required: false,
    skippable: true,
  },
  {
    id: 'first-funnel',
    title: 'Create Your First Funnel',
    description: 'Let AI help you get started',
    required: false,
    skippable: true,
  },
  {
    id: 'complete',
    title: 'All Set!',
    description: 'You\'re ready to go',
    required: true,
    skippable: false,
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Load onboarding state from localStorage
 */
const loadOnboardingState = () => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Save onboarding state to localStorage
 */
const saveOnboardingState = (state) => {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
};

/**
 * Clear onboarding state from localStorage
 */
const clearOnboardingState = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding state:', error);
  }
};

// =============================================================================
// INITIAL STATE
// =============================================================================

const storedState = loadOnboardingState();

const initialState = {
  // Onboarding status
  status: storedState?.status || 'not_started', // 'not_started', 'in_progress', 'completed', 'skipped'
  
  // Current step
  currentStep: storedState?.currentStep || 0,
  currentStepId: storedState?.currentStepId || ONBOARDING_STEPS[0].id,
  
  // Steps
  steps: ONBOARDING_STEPS,
  completedSteps: storedState?.completedSteps || [],
  skippedSteps: storedState?.skippedSteps || [],
  
  // Collected data
  data: storedState?.data || {
    // Business information
    businessInfo: {
      businessName: '',
      businessType: '', // 'ecommerce', 'saas', 'agency', 'consulting', 'other'
      businessSize: '', // 'solo', 'small', 'medium', 'enterprise'
      website: '',
      industry: '',
    },
    
    // Goals
    goals: {
      primary: '', // 'generate_leads', 'increase_sales', 'build_awareness', 'collect_feedback'
      secondary: [],
      monthlyLeadGoal: null,
      revenueGoal: null,
    },
    
    // Target audience
    audience: {
      targetIndustry: '',
      targetCompanySize: [],
      targetJobTitles: [],
      geographicFocus: [],
      ageRange: null,
    },
    
    // Preferences
    preferences: {
      emailNotifications: true,
      weeklyReports: true,
      aiSuggestions: true,
      theme: 'light',
      language: 'en',
    },
    
    // First funnel
    firstFunnel: {
      created: false,
      funnelId: null,
      funnelType: '', // 'lead_generation', 'product_recommendation', 'survey'
    },
  },
  
  // Progress
  progress: storedState?.progress || 0,
  
  // Loading
  isLoading: false,
  isSaving: false,
  
  // Error
  error: null,
  
  // Timestamps
  startedAt: storedState?.startedAt || null,
  completedAt: storedState?.completedAt || null,
  lastUpdatedAt: storedState?.lastUpdatedAt || null,
  
  // Feature tour
  showTour: false,
  tourStep: 0,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Complete onboarding and save to backend
 */
export const completeOnboarding = createAsyncThunk(
  'onboarding/complete',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const { onboarding } = getState();
      
      // Save onboarding data to user preferences
      await usersAPI.updatePreferences({
        onboardingCompleted: true,
        onboardingData: onboarding.data,
        onboardingCompletedAt: new Date().toISOString(),
      });
      
      // Clear localStorage
      clearOnboardingState();
      
      dispatch(showSuccess('Welcome aboard! Let\'s get started! 🚀'));
      
      return {
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to complete onboarding';
      dispatch(showError(errorMessage));
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Save onboarding progress to backend
 */
export const saveOnboardingProgress = createAsyncThunk(
  'onboarding/saveProgress',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { onboarding } = getState();
      
      await usersAPI.updatePreferences({
        onboardingProgress: {
          currentStep: onboarding.currentStep,
          currentStepId: onboarding.currentStepId,
          completedSteps: onboarding.completedSteps,
          data: onboarding.data,
          progress: onboarding.progress,
        },
      });
      
      return {
        savedAt: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue('Failed to save progress');
    }
  }
);

/**
 * Skip onboarding
 */
export const skipOnboarding = createAsyncThunk(
  'onboarding/skip',
  async (_, { dispatch }) => {
    try {
      await usersAPI.updatePreferences({
        onboardingSkipped: true,
        onboardingSkippedAt: new Date().toISOString(),
      });
      
      clearOnboardingState();
      
      dispatch(showSuccess('You can restart onboarding anytime from settings'));
      
      return {
        skippedAt: new Date().toISOString(),
      };
    } catch (error) {
      return { skippedAt: new Date().toISOString() };
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    // =========================================================================
    // NAVIGATION
    // =========================================================================
    
    startOnboarding: (state) => {
      state.status = 'in_progress';
      state.currentStep = 0;
      state.currentStepId = ONBOARDING_STEPS[0].id;
      state.startedAt = new Date().toISOString();
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    nextStep: (state) => {
      const currentStepData = state.steps[state.currentStep];
      
      // Mark current step as completed
      if (!state.completedSteps.includes(currentStepData.id)) {
        state.completedSteps.push(currentStepData.id);
      }
      
      // Move to next step
      if (state.currentStep < state.steps.length - 1) {
        state.currentStep += 1;
        state.currentStepId = state.steps[state.currentStep].id;
      }
      
      // Update progress
      state.progress = Math.round((state.completedSteps.length / state.steps.length) * 100);
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
        state.currentStepId = state.steps[state.currentStep].id;
        state.lastUpdatedAt = new Date().toISOString();
      }
      
      saveOnboardingState(state);
    },
    
    goToStep: (state, action) => {
      const stepIndex = typeof action.payload === 'number'
        ? action.payload
        : state.steps.findIndex(s => s.id === action.payload);
      
      if (stepIndex >= 0 && stepIndex < state.steps.length) {
        state.currentStep = stepIndex;
        state.currentStepId = state.steps[stepIndex].id;
        state.lastUpdatedAt = new Date().toISOString();
      }
      
      saveOnboardingState(state);
    },
    
    skipCurrentStep: (state) => {
      const currentStepData = state.steps[state.currentStep];
      
      if (currentStepData.skippable) {
        // Mark as skipped
        if (!state.skippedSteps.includes(currentStepData.id)) {
          state.skippedSteps.push(currentStepData.id);
        }
        
        // Move to next step
        if (state.currentStep < state.steps.length - 1) {
          state.currentStep += 1;
          state.currentStepId = state.steps[state.currentStep].id;
        }
        
        state.lastUpdatedAt = new Date().toISOString();
      }
      
      saveOnboardingState(state);
    },
    
    // =========================================================================
    // DATA COLLECTION
    // =========================================================================
    
    updateBusinessInfo: (state, action) => {
      state.data.businessInfo = {
        ...state.data.businessInfo,
        ...action.payload,
      };
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    updateGoals: (state, action) => {
      state.data.goals = {
        ...state.data.goals,
        ...action.payload,
      };
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    updateAudience: (state, action) => {
      state.data.audience = {
        ...state.data.audience,
        ...action.payload,
      };
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    updatePreferences: (state, action) => {
      state.data.preferences = {
        ...state.data.preferences,
        ...action.payload,
      };
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    setFirstFunnelCreated: (state, action) => {
      state.data.firstFunnel = {
        created: true,
        funnelId: action.payload.funnelId,
        funnelType: action.payload.funnelType,
      };
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    updateOnboardingData: (state, action) => {
      state.data = {
        ...state.data,
        ...action.payload,
      };
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    // =========================================================================
    // COMPLETION
    // =========================================================================
    
    completeStep: (state, action) => {
      const stepId = action.payload;
      
      if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId);
      }
      
      // Update progress
      state.progress = Math.round((state.completedSteps.length / state.steps.length) * 100);
      state.lastUpdatedAt = new Date().toISOString();
      
      saveOnboardingState(state);
    },
    
    // =========================================================================
    // TOUR
    // =========================================================================
    
    startTour: (state) => {
      state.showTour = true;
      state.tourStep = 0;
    },
    
    nextTourStep: (state) => {
      state.tourStep += 1;
    },
    
    previousTourStep: (state) => {
      if (state.tourStep > 0) {
        state.tourStep -= 1;
      }
    },
    
    endTour: (state) => {
      state.showTour = false;
      state.tourStep = 0;
    },
    
    // =========================================================================
    // RESET
    // =========================================================================
    
    resetOnboarding: (state) => {
      clearOnboardingState();
      
      return {
        ...initialState,
        status: 'not_started',
        completedSteps: [],
        skippedSteps: [],
        currentStep: 0,
        progress: 0,
        data: initialState.data,
        startedAt: null,
        completedAt: null,
        lastUpdatedAt: null,
      };
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // COMPLETE ONBOARDING
    // =========================================================================
    builder
      .addCase(completeOnboarding.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'completed';
        state.completedAt = action.payload.completedAt;
        state.progress = 100;
        
        // Mark all steps as completed
        state.completedSteps = state.steps.map(s => s.id);
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // =========================================================================
    // SAVE PROGRESS
    // =========================================================================
    builder
      .addCase(saveOnboardingProgress.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveOnboardingProgress.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(saveOnboardingProgress.rejected, (state) => {
        state.isSaving = false;
      });
    
    // =========================================================================
    // SKIP ONBOARDING
    // =========================================================================
    builder
      .addCase(skipOnboarding.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(skipOnboarding.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'skipped';
        state.completedAt = action.payload.skippedAt;
      })
      .addCase(skipOnboarding.rejected, (state) => {
        state.isLoading = false;
        state.status = 'skipped';
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Navigation
  startOnboarding,
  nextStep,
  previousStep,
  goToStep,
  skipCurrentStep,
  
  // Data collection
  updateBusinessInfo,
  updateGoals,
  updateAudience,
  updatePreferences,
  setFirstFunnelCreated,
  updateOnboardingData,
  
  // Completion
  completeStep,
  
  // Tour
  startTour,
  nextTourStep,
  previousTourStep,
  endTour,
  
  // Reset
  resetOnboarding,
  clearError,
} = onboardingSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Status
export const selectOnboardingStatus = (state) => state.onboarding.status;
export const selectIsOnboardingNotStarted = (state) => state.onboarding.status === 'not_started';
export const selectIsOnboardingInProgress = (state) => state.onboarding.status === 'in_progress';
export const selectIsOnboardingCompleted = (state) => state.onboarding.status === 'completed';
export const selectIsOnboardingSkipped = (state) => state.onboarding.status === 'skipped';

// Steps
export const selectCurrentStep = (state) => state.onboarding.currentStep;
export const selectCurrentStepId = (state) => state.onboarding.currentStepId;
export const selectCurrentStepData = (state) => state.onboarding.steps[state.onboarding.currentStep];
export const selectOnboardingSteps = (state) => state.onboarding.steps;
export const selectCompletedSteps = (state) => state.onboarding.completedSteps;
export const selectSkippedSteps = (state) => state.onboarding.skippedSteps;

// Progress
export const selectOnboardingProgress = (state) => state.onboarding.progress;

// Data
export const selectOnboardingData = (state) => state.onboarding.data;
export const selectBusinessInfo = (state) => state.onboarding.data.businessInfo;
export const selectGoals = (state) => state.onboarding.data.goals;
export const selectAudience = (state) => state.onboarding.data.audience;
export const selectUserPreferences = (state) => state.onboarding.data.preferences;
export const selectFirstFunnel = (state) => state.onboarding.data.firstFunnel;

// Loading
export const selectOnboardingLoading = (state) => state.onboarding.isLoading;
export const selectOnboardingSaving = (state) => state.onboarding.isSaving;

// Error
export const selectOnboardingError = (state) => state.onboarding.error;

// Tour
export const selectShowTour = (state) => state.onboarding.showTour;
export const selectTourStep = (state) => state.onboarding.tourStep;

// Timestamps
export const selectOnboardingStartedAt = (state) => state.onboarding.startedAt;
export const selectOnboardingCompletedAt = (state) => state.onboarding.completedAt;

// Computed selectors
export const selectIsFirstStep = (state) => state.onboarding.currentStep === 0;
export const selectIsLastStep = (state) => 
  state.onboarding.currentStep === state.onboarding.steps.length - 1;

export const selectCanSkipCurrentStep = (state) => {
  const currentStep = state.onboarding.steps[state.onboarding.currentStep];
  return currentStep?.skippable || false;
};

export const selectIsStepCompleted = (stepId) => (state) => {
  return state.onboarding.completedSteps.includes(stepId);
};

export const selectIsStepSkipped = (stepId) => (state) => {
  return state.onboarding.skippedSteps.includes(stepId);
};

export const selectStepProgress = (state) => {
  const current = state.onboarding.currentStep;
  const total = state.onboarding.steps.length;
  return {
    current: current + 1,
    total,
    percentage: Math.round(((current + 1) / total) * 100),
  };
};

export const selectRequiredStepsCompleted = (state) => {
  const requiredSteps = state.onboarding.steps.filter(s => s.required).map(s => s.id);
  return requiredSteps.every(stepId => state.onboarding.completedSteps.includes(stepId));
};

export const selectCanCompleteOnboarding = (state) => {
  return selectRequiredStepsCompleted(state) && state.onboarding.status === 'in_progress';
};

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Auto-save progress (debounced)
 */
export const autoSaveProgress = () => (dispatch, getState) => {
  const { onboarding } = getState();
  
  if (onboarding.status === 'in_progress') {
    dispatch(saveOnboardingProgress());
  }
};

// =============================================================================
// REDUCER
// =============================================================================

export default onboardingSlice.reducer;
