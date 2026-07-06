// =============================================================================
// AI FUNNEL PLATFORM - Wizard Slice
// =============================================================================
// Wizard state: current step, form data, AI-generated content, validation
// Depends on: ai.api.js
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import aiAPI from '@/lib/api/ai.api';
import { showSuccess, showError } from './ui.slice';

// =============================================================================
// WIZARD STEPS
// =============================================================================

export const WIZARD_STEPS = {
  BUSINESS_INFO: 'business_info',
  TARGET_AUDIENCE: 'target_audience',
  FUNNEL_GOALS: 'funnel_goals',
  QUESTION_GENERATION: 'question_generation',
  QUESTION_CUSTOMIZATION: 'question_customization',
  DESIGN_THEME: 'design_theme',
  REVIEW_PUBLISH: 'review_publish',
};

export const WIZARD_STEP_ORDER = [
  WIZARD_STEPS.BUSINESS_INFO,
  WIZARD_STEPS.TARGET_AUDIENCE,
  WIZARD_STEPS.FUNNEL_GOALS,
  WIZARD_STEPS.QUESTION_GENERATION,
  WIZARD_STEPS.QUESTION_CUSTOMIZATION,
  WIZARD_STEPS.DESIGN_THEME,
  WIZARD_STEPS.REVIEW_PUBLISH,
];

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // Wizard progress
  currentStep: WIZARD_STEPS.BUSINESS_INFO,
  completedSteps: [],
  visitedSteps: [WIZARD_STEPS.BUSINESS_INFO],
  
  // Form data for each step
  formData: {
    // Step 1: Business Info
    businessInfo: {
      businessName: '',
      industry: '',
      businessType: '',
      description: '',
      website: '',
      targetMarket: '',
    },
    
    // Step 2: Target Audience
    targetAudience: {
      demographics: {
        ageRange: '',
        gender: '',
        location: '',
        income: '',
      },
      psychographics: {
        interests: [],
        painPoints: [],
        goals: [],
      },
      behavior: {
        onlineActivity: [],
        purchasePatterns: '',
      },
    },
    
    // Step 3: Funnel Goals
    funnelGoals: {
      primaryGoal: '', // 'lead_generation', 'sales', 'consultation', 'survey'
      conversionAction: '',
      kpis: [],
      targetConversionRate: null,
      followUpAction: '',
    },
    
    // Step 4: Questions (AI-generated)
    questions: [],
    
    // Step 5: Design Theme
    design: {
      colorScheme: 'blue',
      fontFamily: 'inter',
      layout: 'modern',
      logo: null,
      brandColors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#F59E0B',
      },
    },
    
    // Step 6: Additional Settings
    settings: {
      collectEmail: true,
      requirePhone: false,
      enableTracking: true,
      thankYouMessage: '',
      redirectUrl: '',
      notifications: {
        email: true,
        slack: false,
      },
    },
  },
  
  // AI-generated content
  aiGenerated: {
    questions: [],
    recommendations: null,
    contentSuggestions: [],
    themeRecommendations: null,
  },
  
  // AI generation state
  aiGenerating: {
    questions: false,
    recommendations: false,
    themes: false,
    refinement: false,
  },
  
  // Validation state
  validation: {
    currentStepValid: true,
    errors: {},
    warnings: {},
  },
  
  // Progress tracking
  progress: {
    percentage: 0,
    estimatedTimeRemaining: null,
    lastSaved: null,
  },
  
  // Draft state
  isDraft: false,
  draftId: null,
  autoSaveEnabled: true,
  
  // Loading states
  loading: {
    saveDraft: false,
    loadDraft: false,
    createFunnel: false,
    generateQuestions: false,
    refineQuestions: false,
    generateRecommendations: false,
  },
  
  // Errors
  errors: {
    validation: null,
    generation: null,
    save: null,
  },
  
  // History for undo/redo
  history: {
    past: [],
    future: [],
  },
  
  // Modal/dialog state
  modals: {
    exitConfirmation: false,
    regenerateConfirmation: false,
    skipStepWarning: false,
  },
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Generate questions using AI
 */
export const generateQuestions = createAsyncThunk(
  'wizard/generateQuestions',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState().wizard;
      const { businessInfo, targetAudience, funnelGoals } = state.formData;
      
      const response = await aiAPI.generateQuestions({
        businessInfo,
        targetAudience,
        funnelGoals,
      });
      
      dispatch(showSuccess('Questions generated successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to generate questions'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Refine questions using AI
 */
export const refineQuestions = createAsyncThunk(
  'wizard/refineQuestions',
  async ({ questions, refinementPrompt }, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.refineQuestions({
        questions,
        refinementPrompt,
      });
      
      dispatch(showSuccess('Questions refined'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to refine questions'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Generate recommendations using AI
 */
export const generateRecommendations = createAsyncThunk(
  'wizard/generateRecommendations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().wizard;
      const { businessInfo, targetAudience, funnelGoals } = state.formData;
      
      const response = await aiAPI.generateRecommendations({
        businessInfo,
        targetAudience,
        funnelGoals,
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Generate theme recommendations
 */
export const generateThemeRecommendations = createAsyncThunk(
  'wizard/generateThemeRecommendations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState().wizard;
      const { businessInfo, targetAudience } = state.formData;
      
      const response = await aiAPI.generateThemeRecommendations({
        businessInfo,
        targetAudience,
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Save wizard progress as draft
 */
export const saveDraft = createAsyncThunk(
  'wizard/saveDraft',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState().wizard;
      
      const response = await aiAPI.saveWizardDraft({
        currentStep: state.currentStep,
        formData: state.formData,
        completedSteps: state.completedSteps,
        aiGenerated: state.aiGenerated,
        draftId: state.draftId,
      });
      
      dispatch(showSuccess('Progress saved'));
      return response.data;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Load wizard draft
 */
export const loadDraft = createAsyncThunk(
  'wizard/loadDraft',
  async (draftId, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.loadWizardDraft(draftId);
      dispatch(showSuccess('Draft loaded'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to load draft'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Create funnel from wizard
 */
export const createFunnelFromWizard = createAsyncThunk(
  'wizard/createFunnel',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState().wizard;
      
      const response = await aiAPI.createFunnelFromWizard({
        formData: state.formData,
        questions: state.formData.questions,
        aiGenerated: state.aiGenerated,
      });
      
      dispatch(showSuccess('Funnel created successfully!'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to create funnel'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Optimize questions using AI
 */
export const optimizeQuestions = createAsyncThunk(
  'wizard/optimizeQuestions',
  async ({ questionIds, optimizationType }, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState().wizard;
      const questions = state.formData.questions.filter(q => 
        questionIds.includes(q.id)
      );
      
      const response = await aiAPI.optimizeQuestions({
        questions,
        optimizationType, // 'clarity', 'engagement', 'conversion'
      });
      
      dispatch(showSuccess('Questions optimized'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to optimize questions'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const wizardSlice = createSlice({
  name: 'wizard',
  initialState,
  reducers: {
    // =========================================================================
    // NAVIGATION
    // =========================================================================
    
    setCurrentStep: (state, action) => {
      const step = action.payload;
      state.currentStep = step;
      
      // Add to visited steps
      if (!state.visitedSteps.includes(step)) {
        state.visitedSteps.push(step);
      }
      
      // Update progress
      const stepIndex = WIZARD_STEP_ORDER.indexOf(step);
      state.progress.percentage = Math.round(((stepIndex + 1) / WIZARD_STEP_ORDER.length) * 100);
    },
    
    goToNextStep: (state) => {
      const currentIndex = WIZARD_STEP_ORDER.indexOf(state.currentStep);
      
      if (currentIndex < WIZARD_STEP_ORDER.length - 1) {
        const nextStep = WIZARD_STEP_ORDER[currentIndex + 1];
        
        // Mark current step as completed
        if (!state.completedSteps.includes(state.currentStep)) {
          state.completedSteps.push(state.currentStep);
        }
        
        state.currentStep = nextStep;
        
        // Add to visited steps
        if (!state.visitedSteps.includes(nextStep)) {
          state.visitedSteps.push(nextStep);
        }
        
        // Update progress
        state.progress.percentage = Math.round(((currentIndex + 2) / WIZARD_STEP_ORDER.length) * 100);
      }
    },
    
    goToPreviousStep: (state) => {
      const currentIndex = WIZARD_STEP_ORDER.indexOf(state.currentStep);
      
      if (currentIndex > 0) {
        state.currentStep = WIZARD_STEP_ORDER[currentIndex - 1];
        state.progress.percentage = Math.round((currentIndex / WIZARD_STEP_ORDER.length) * 100);
      }
    },
    
    goToStep: (state, action) => {
      const step = action.payload;
      state.currentStep = step;
      
      if (!state.visitedSteps.includes(step)) {
        state.visitedSteps.push(step);
      }
      
      const stepIndex = WIZARD_STEP_ORDER.indexOf(step);
      state.progress.percentage = Math.round(((stepIndex + 1) / WIZARD_STEP_ORDER.length) * 100);
    },
    
    markStepComplete: (state, action) => {
      const step = action.payload;
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
      }
    },
    
    // =========================================================================
    // FORM DATA
    // =========================================================================
    
    updateFormData: (state, action) => {
      const { step, data } = action.payload;
      state.formData[step] = {
        ...state.formData[step],
        ...data,
      };
      
      state.progress.lastSaved = Date.now();
    },
    
    setBusinessInfo: (state, action) => {
      state.formData.businessInfo = {
        ...state.formData.businessInfo,
        ...action.payload,
      };
    },
    
    setTargetAudience: (state, action) => {
      state.formData.targetAudience = {
        ...state.formData.targetAudience,
        ...action.payload,
      };
    },
    
    setFunnelGoals: (state, action) => {
      state.formData.funnelGoals = {
        ...state.formData.funnelGoals,
        ...action.payload,
      };
    },
    
    setDesign: (state, action) => {
      state.formData.design = {
        ...state.formData.design,
        ...action.payload,
      };
    },
    
    setSettings: (state, action) => {
      state.formData.settings = {
        ...state.formData.settings,
        ...action.payload,
      };
    },
    
    // =========================================================================
    // QUESTIONS
    // =========================================================================
    
    setQuestions: (state, action) => {
      state.formData.questions = action.payload;
    },
    
    addQuestion: (state, action) => {
      state.formData.questions.push({
        id: `question-${Date.now()}`,
        ...action.payload,
      });
    },
    
    updateQuestion: (state, action) => {
      const { questionId, updates } = action.payload;
      const index = state.formData.questions.findIndex(q => q.id === questionId);
      
      if (index !== -1) {
        state.formData.questions[index] = {
          ...state.formData.questions[index],
          ...updates,
        };
      }
    },
    
    deleteQuestion: (state, action) => {
      const questionId = action.payload;
      state.formData.questions = state.formData.questions.filter(
        q => q.id !== questionId
      );
    },
    
    reorderQuestions: (state, action) => {
      const { oldIndex, newIndex } = action.payload;
      const questions = [...state.formData.questions];
      const [removed] = questions.splice(oldIndex, 1);
      questions.splice(newIndex, 0, removed);
      state.formData.questions = questions;
    },
    
    duplicateQuestion: (state, action) => {
      const questionId = action.payload;
      const question = state.formData.questions.find(q => q.id === questionId);
      
      if (question) {
        const duplicate = {
          ...question,
          id: `question-${Date.now()}`,
          title: `${question.title} (Copy)`,
        };
        state.formData.questions.push(duplicate);
      }
    },
    
    // =========================================================================
    // VALIDATION
    // =========================================================================
    
    setValidationState: (state, action) => {
      state.validation = {
        ...state.validation,
        ...action.payload,
      };
    },
    
    addValidationError: (state, action) => {
      const { field, message } = action.payload;
      state.validation.errors[field] = message;
      state.validation.currentStepValid = false;
    },
    
    clearValidationError: (state, action) => {
      const field = action.payload;
      delete state.validation.errors[field];
      
      // Check if still valid
      state.validation.currentStepValid = Object.keys(state.validation.errors).length === 0;
    },
    
    clearAllValidationErrors: (state) => {
      state.validation.errors = {};
      state.validation.warnings = {};
      state.validation.currentStepValid = true;
    },
    
    // =========================================================================
    // AI GENERATED CONTENT
    // =========================================================================
    
    setAIGeneratedQuestions: (state, action) => {
      state.aiGenerated.questions = action.payload;
    },
    
    setAIRecommendations: (state, action) => {
      state.aiGenerated.recommendations = action.payload;
    },
    
    addContentSuggestion: (state, action) => {
      state.aiGenerated.contentSuggestions.push(action.payload);
    },
    
    clearContentSuggestions: (state) => {
      state.aiGenerated.contentSuggestions = [];
    },
    
    // =========================================================================
    // HISTORY (UNDO/REDO)
    // =========================================================================
    
    saveToHistory: (state) => {
      const currentState = {
        formData: JSON.parse(JSON.stringify(state.formData)),
        currentStep: state.currentStep,
        completedSteps: [...state.completedSteps],
      };
      
      state.history.past.push(currentState);
      
      // Limit history size
      if (state.history.past.length > 20) {
        state.history.past.shift();
      }
      
      // Clear future on new action
      state.history.future = [];
    },
    
    undo: (state) => {
      if (state.history.past.length === 0) return;
      
      const currentState = {
        formData: JSON.parse(JSON.stringify(state.formData)),
        currentStep: state.currentStep,
        completedSteps: [...state.completedSteps],
      };
      
      state.history.future.push(currentState);
      
      const previousState = state.history.past.pop();
      state.formData = previousState.formData;
      state.currentStep = previousState.currentStep;
      state.completedSteps = previousState.completedSteps;
    },
    
    redo: (state) => {
      if (state.history.future.length === 0) return;
      
      const currentState = {
        formData: JSON.parse(JSON.stringify(state.formData)),
        currentStep: state.currentStep,
        completedSteps: [...state.completedSteps],
      };
      
      state.history.past.push(currentState);
      
      const nextState = state.history.future.pop();
      state.formData = nextState.formData;
      state.currentStep = nextState.currentStep;
      state.completedSteps = nextState.completedSteps;
    },
    
    // =========================================================================
    // MODALS
    // =========================================================================
    
    openModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = true;
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      state.modals[modalName] = false;
    },
    
    // =========================================================================
    // DRAFT
    // =========================================================================
    
    setDraftId: (state, action) => {
      state.draftId = action.payload;
      state.isDraft = true;
    },
    
    toggleAutoSave: (state) => {
      state.autoSaveEnabled = !state.autoSaveEnabled;
    },
    
    // =========================================================================
    // RESET
    // =========================================================================
    
    resetWizard: () => initialState,
    
    resetToStep: (state, action) => {
      const step = action.payload;
      const stepIndex = WIZARD_STEP_ORDER.indexOf(step);
      
      // Clear completed steps after this step
      state.completedSteps = state.completedSteps.filter(s => 
        WIZARD_STEP_ORDER.indexOf(s) < stepIndex
      );
      
      // Clear visited steps after this step
      state.visitedSteps = state.visitedSteps.filter(s => 
        WIZARD_STEP_ORDER.indexOf(s) <= stepIndex
      );
      
      state.currentStep = step;
      state.progress.percentage = Math.round(((stepIndex + 1) / WIZARD_STEP_ORDER.length) * 100);
    },
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // GENERATE QUESTIONS
    // =========================================================================
    
    builder
      .addCase(generateQuestions.pending, (state) => {
        state.loading.generateQuestions = true;
        state.aiGenerating.questions = true;
        state.errors.generation = null;
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.loading.generateQuestions = false;
        state.aiGenerating.questions = false;
        
        // Store AI-generated questions
        state.aiGenerated.questions = action.payload.questions;
        
        // Set as current questions
        state.formData.questions = action.payload.questions.map((q, index) => ({
          id: `question-${Date.now()}-${index}`,
          ...q,
          order: index,
        }));
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        state.loading.generateQuestions = false;
        state.aiGenerating.questions = false;
        state.errors.generation = action.payload;
      });
    
    // =========================================================================
    // REFINE QUESTIONS
    // =========================================================================
    
    builder
      .addCase(refineQuestions.pending, (state) => {
        state.loading.refineQuestions = true;
        state.aiGenerating.refinement = true;
      })
      .addCase(refineQuestions.fulfilled, (state, action) => {
        state.loading.refineQuestions = false;
        state.aiGenerating.refinement = false;
        
        // Update questions with refined versions
        state.formData.questions = action.payload.questions.map((q, index) => ({
          id: q.id || `question-${Date.now()}-${index}`,
          ...q,
          order: index,
        }));
      })
      .addCase(refineQuestions.rejected, (state) => {
        state.loading.refineQuestions = false;
        state.aiGenerating.refinement = false;
      });
    
    // =========================================================================
    // GENERATE RECOMMENDATIONS
    // =========================================================================
    
    builder
      .addCase(generateRecommendations.pending, (state) => {
        state.loading.generateRecommendations = true;
        state.aiGenerating.recommendations = true;
      })
      .addCase(generateRecommendations.fulfilled, (state, action) => {
        state.loading.generateRecommendations = false;
        state.aiGenerating.recommendations = false;
        state.aiGenerated.recommendations = action.payload;
      })
      .addCase(generateRecommendations.rejected, (state) => {
        state.loading.generateRecommendations = false;
        state.aiGenerating.recommendations = false;
      });
    
    // =========================================================================
    // GENERATE THEME RECOMMENDATIONS
    // =========================================================================
    
    builder
      .addCase(generateThemeRecommendations.pending, (state) => {
        state.aiGenerating.themes = true;
      })
      .addCase(generateThemeRecommendations.fulfilled, (state, action) => {
        state.aiGenerating.themes = false;
        state.aiGenerated.themeRecommendations = action.payload;
      })
      .addCase(generateThemeRecommendations.rejected, (state) => {
        state.aiGenerating.themes = false;
      });
    
    // =========================================================================
    // SAVE DRAFT
    // =========================================================================
    
    builder
      .addCase(saveDraft.pending, (state) => {
        state.loading.saveDraft = true;
        state.errors.save = null;
      })
      .addCase(saveDraft.fulfilled, (state, action) => {
        state.loading.saveDraft = false;
        state.draftId = action.payload.draftId;
        state.isDraft = true;
        state.progress.lastSaved = Date.now();
      })
      .addCase(saveDraft.rejected, (state, action) => {
        state.loading.saveDraft = false;
        state.errors.save = action.payload;
      });
    
    // =========================================================================
    // LOAD DRAFT
    // =========================================================================
    
    builder
      .addCase(loadDraft.pending, (state) => {
        state.loading.loadDraft = true;
      })
      .addCase(loadDraft.fulfilled, (state, action) => {
        state.loading.loadDraft = false;
        
        // Restore wizard state from draft
        state.currentStep = action.payload.currentStep || WIZARD_STEPS.BUSINESS_INFO;
        state.formData = action.payload.formData || initialState.formData;
        state.completedSteps = action.payload.completedSteps || [];
        state.aiGenerated = action.payload.aiGenerated || initialState.aiGenerated;
        state.draftId = action.payload.draftId;
        state.isDraft = true;
        
        // Rebuild visited steps
        const stepIndex = WIZARD_STEP_ORDER.indexOf(state.currentStep);
        state.visitedSteps = WIZARD_STEP_ORDER.slice(0, stepIndex + 1);
        
        // Update progress
        state.progress.percentage = Math.round(((stepIndex + 1) / WIZARD_STEP_ORDER.length) * 100);
      })
      .addCase(loadDraft.rejected, (state) => {
        state.loading.loadDraft = false;
      });
    
    // =========================================================================
    // CREATE FUNNEL
    // =========================================================================
    
    builder
      .addCase(createFunnelFromWizard.pending, (state) => {
        state.loading.createFunnel = true;
      })
      .addCase(createFunnelFromWizard.fulfilled, (state) => {
        state.loading.createFunnel = false;
        // State will be reset by caller
      })
      .addCase(createFunnelFromWizard.rejected, (state) => {
        state.loading.createFunnel = false;
      });
    
    // =========================================================================
    // OPTIMIZE QUESTIONS
    // =========================================================================
    
    builder
      .addCase(optimizeQuestions.fulfilled, (state, action) => {
        // Update optimized questions
        const optimizedQuestions = action.payload.questions;
        
        optimizedQuestions.forEach(optimized => {
          const index = state.formData.questions.findIndex(q => q.id === optimized.id);
          if (index !== -1) {
            state.formData.questions[index] = {
              ...state.formData.questions[index],
              ...optimized,
            };
          }
        });
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Navigation
  setCurrentStep,
  goToNextStep,
  goToPreviousStep,
  goToStep,
  markStepComplete,
  
  // Form data
  updateFormData,
  setBusinessInfo,
  setTargetAudience,
  setFunnelGoals,
  setDesign,
  setSettings,
  
  // Questions
  setQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  duplicateQuestion,
  
  // Validation
  setValidationState,
  addValidationError,
  clearValidationError,
  clearAllValidationErrors,
  
  // AI generated
  setAIGeneratedQuestions,
  setAIRecommendations,
  addContentSuggestion,
  clearContentSuggestions,
  
  // History
  saveToHistory,
  undo,
  redo,
  
  // Modals
  openModal,
  closeModal,
  
  // Draft
  setDraftId,
  toggleAutoSave,
  
  // Reset
  resetWizard,
  resetToStep,
} = wizardSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Current state
export const selectCurrentStep = (state) => state.wizard.currentStep;
export const selectCompletedSteps = (state) => state.wizard.completedSteps;
export const selectVisitedSteps = (state) => state.wizard.visitedSteps;
export const selectProgress = (state) => state.wizard.progress;
export const selectProgressPercentage = (state) => state.wizard.progress.percentage;

// Form data
export const selectFormData = (state) => state.wizard.formData;
export const selectBusinessInfo = (state) => state.wizard.formData.businessInfo;
export const selectTargetAudience = (state) => state.wizard.formData.targetAudience;
export const selectFunnelGoals = (state) => state.wizard.formData.funnelGoals;
export const selectQuestions = (state) => state.wizard.formData.questions;
export const selectDesign = (state) => state.wizard.formData.design;
export const selectSettings = (state) => state.wizard.formData.settings;

// AI generated
export const selectAIGenerated = (state) => state.wizard.aiGenerated;
export const selectAIGeneratedQuestions = (state) => state.wizard.aiGenerated.questions;
export const selectAIRecommendations = (state) => state.wizard.aiGenerated.recommendations;
export const selectContentSuggestions = (state) => state.wizard.aiGenerated.contentSuggestions;
export const selectThemeRecommendations = (state) => state.wizard.aiGenerated.themeRecommendations;

// AI generating states
export const selectAIGenerating = (state) => state.wizard.aiGenerating;
export const selectIsGeneratingQuestions = (state) => state.wizard.aiGenerating.questions;
export const selectIsGeneratingRecommendations = (state) => state.wizard.aiGenerating.recommendations;
export const selectIsRefiningQuestions = (state) => state.wizard.aiGenerating.refinement;

// Validation
export const selectValidation = (state) => state.wizard.validation;
export const selectIsCurrentStepValid = (state) => state.wizard.validation.currentStepValid;
export const selectValidationErrors = (state) => state.wizard.validation.errors;
export const selectValidationWarnings = (state) => state.wizard.validation.warnings;
export const selectHasValidationErrors = (state) => 
  Object.keys(state.wizard.validation.errors).length > 0;

// Navigation helpers
export const selectIsFirstStep = (state) => 
  state.wizard.currentStep === WIZARD_STEP_ORDER[0];

export const selectIsLastStep = (state) => 
  state.wizard.currentStep === WIZARD_STEP_ORDER[WIZARD_STEP_ORDER.length - 1];

export const selectCanGoNext = (state) => 
  !selectIsLastStep(state) && state.wizard.validation.currentStepValid;

export const selectCanGoPrevious = (state) => 
  !selectIsFirstStep(state);

export const selectCurrentStepIndex = (state) => 
  WIZARD_STEP_ORDER.indexOf(state.wizard.currentStep);

export const selectIsStepComplete = (step) => (state) => 
  state.wizard.completedSteps.includes(step);

export const selectIsStepVisited = (step) => (state) => 
  state.wizard.visitedSteps.includes(step);

// Loading states
export const selectWizardLoading = (state) => state.wizard.loading;
export const selectIsRefining = (state) => state.wizard.loading.refineQuestions;
export const selectIsSavingDraft = (state) => state.wizard.loading.saveDraft;
export const selectIsLoadingDraft = (state) => state.wizard.loading.loadDraft;
export const selectIsCreatingFunnel = (state) => state.wizard.loading.createFunnel;

// Errors
export const selectWizardErrors = (state) => state.wizard.errors;

// Draft
export const selectIsDraft = (state) => state.wizard.isDraft;
export const selectDraftId = (state) => state.wizard.draftId;
export const selectAutoSaveEnabled = (state) => state.wizard.autoSaveEnabled;
export const selectLastSaved = (state) => state.wizard.progress.lastSaved;

// History
export const selectCanUndo = (state) => state.wizard.history.past.length > 0;
export const selectCanRedo = (state) => state.wizard.history.future.length > 0;

// Modals
export const selectModals = (state) => state.wizard.modals;
export const selectIsModalOpen = (modalName) => (state) => 
  state.wizard.modals[modalName];

// Computed selectors
export const selectIsWizardComplete = (state) => 
  state.wizard.completedSteps.length === WIZARD_STEP_ORDER.length - 1;

export const selectQuestionsCount = (state) => 
  state.wizard.formData.questions.length;

export const selectHasBusinessInfo = (state) => {
  const { businessName, industry } = state.wizard.formData.businessInfo;
  return businessName && industry;
};

export const selectHasTargetAudience = (state) => {
  const { demographics } = state.wizard.formData.targetAudience;
  return demographics.ageRange && demographics.gender;
};

export const selectHasFunnelGoals = (state) => {
  const { primaryGoal } = state.wizard.formData.funnelGoals;
  return !!primaryGoal;
};

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Auto-save draft if enabled
 */
export const autoSaveDraft = () => (dispatch, getState) => {
  const state = getState();
  const autoSaveEnabled = selectAutoSaveEnabled(state);
  const isSaving = selectIsSavingDraft(state);
  
  if (autoSaveEnabled && !isSaving) {
    return dispatch(saveDraft());
  }
  
  return Promise.resolve();
};

/**
 * Validate current step and advance
 */
export const validateAndAdvance = () => (dispatch, getState) => {
  const state = getState();
  const isValid = selectIsCurrentStepValid(state);
  
  if (isValid) {
    dispatch(markStepComplete(state.wizard.currentStep));
    dispatch(goToNextStep());
    dispatch(autoSaveDraft());
    return true;
  }
  
  return false;
};

/**
 * Generate and apply questions
 */
export const generateAndApplyQuestions = () => async (dispatch) => {
  const result = await dispatch(generateQuestions()).unwrap();
  dispatch(markStepComplete(WIZARD_STEPS.QUESTION_GENERATION));
  return result;
};

// =============================================================================
// REDUCER
// =============================================================================

export default wizardSlice.reducer;
