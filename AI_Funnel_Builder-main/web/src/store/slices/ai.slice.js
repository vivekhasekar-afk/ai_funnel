// =============================================================================
// AI FUNNEL PLATFORM - AI Slice
// =============================================================================
// AI state: loading status, credits remaining, generation history, operations
// Depends on: ai.api.js
// =============================================================================

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import aiApi from '@/lib/api/ai.api';
import { showSuccess, showError, showWarning } from './ui.slice';

// =============================================================================
// AI OPERATION TYPES
// =============================================================================

export const AI_OPERATIONS = {
  GENERATE_QUESTIONS: 'generate_questions',
  REFINE_QUESTIONS: 'refine_questions',
  GENERATE_CONTENT: 'generate_content',
  OPTIMIZE_CONTENT: 'optimize_content',
  GENERATE_RECOMMENDATIONS: 'generate_recommendations',
  ANALYZE_AUDIENCE: 'analyze_audience',
  SUGGEST_IMPROVEMENTS: 'suggest_improvements',
  GENERATE_THEME: 'generate_theme',
  TRANSLATE_CONTENT: 'translate_content',
  GRAMMAR_CHECK: 'grammar_check',
  SENTIMENT_ANALYSIS: 'sentiment_analysis',
};

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  // AI Credits & Usage
  credits: {
    total: 0,
    used: 0,
    remaining: 0,
    resetDate: null,
    planTier: 'free', // 'free', 'basic', 'pro', 'enterprise'
  },
  
  // Current operations
  activeOperations: [],
  
  // Operation history
  history: [],
  
  // AI Configuration
  config: {
    model: 'gpt-4', // 'gpt-3.5-turbo', 'gpt-4', 'claude-2'
    temperature: 0.7,
    maxTokens: 2000,
    language: 'en',
    tone: 'professional', // 'professional', 'casual', 'friendly', 'formal'
    creativity: 'balanced', // 'conservative', 'balanced', 'creative'
  },
  
  // Recent suggestions
  suggestions: [],
  
  // AI insights
  insights: {
    funnelPerformance: null,
    audienceAnalysis: null,
    conversionTips: [],
    industryBenchmarks: null,
  },
  
  // Generation queue
  queue: [],
  
  // Streaming state (for real-time generation)
  streaming: {
    isStreaming: false,
    operationId: null,
    content: '',
    progress: 0,
  },
  
  // Loading states
  loading: {
    credits: false,
    history: false,
    generate: false,
    refine: false,
    analyze: false,
    insights: false,
  },
  
  // Errors
  errors: {
    credits: null,
    generation: null,
    analysis: null,
  },
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: 60,
    requestsRemaining: 60,
    resetTime: null,
  },
  
  // Last sync
  lastSync: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Fetch AI credits information
 */
export const fetchAICredits = createAsyncThunk(
  'ai/fetchCredits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getCredits();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Fetch AI operation history
 */
export const fetchAIHistory = createAsyncThunk(
  'ai/fetchHistory',
  async ({ limit = 50, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getHistory({ limit, offset });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Generate questions using AI
 */
export const generateQuestionsAI = createAsyncThunk(
  'ai/generateQuestions',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.generateQuestions(params);
      dispatch(showSuccess('Questions generated successfully'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to generate questions'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Refine existing questions
 */
export const refineQuestionsAI = createAsyncThunk(
  'ai/refineQuestions',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.refineQuestions(params);
      dispatch(showSuccess('Questions refined'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to refine questions'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Generate content (headlines, descriptions, etc.)
 */
export const generateContentAI = createAsyncThunk(
  'ai/generateContent',
  async ({ contentType, context }, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.generateContent({ contentType, context });
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to generate content'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Optimize existing content
 */
export const optimizeContentAI = createAsyncThunk(
  'ai/optimizeContent',
  async ({ content, optimizationType }, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.optimizeContent({
        content,
        optimizationType, // 'clarity', 'engagement', 'seo', 'conversion'
      });
      dispatch(showSuccess('Content optimized'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to optimize content'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Generate recommendations
 */
export const generateRecommendationsAI = createAsyncThunk(
  'ai/generateRecommendations',
  async (context, { rejectWithValue }) => {
    try {
      const response = await aiAPI.generateRecommendations(context);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Analyze target audience
 */
export const analyzeAudience = createAsyncThunk(
  'ai/analyzeAudience',
  async (audienceData, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.analyzeAudience(audienceData);
      dispatch(showSuccess('Audience analysis complete'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to analyze audience'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Get AI insights for funnel
 */
export const getFunnelInsights = createAsyncThunk(
  'ai/getFunnelInsights',
  async (funnelId, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getFunnelInsights(funnelId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Suggest funnel improvements
 */
export const suggestImprovements = createAsyncThunk(
  'ai/suggestImprovements',
  async (funnelData, { rejectWithValue }) => {
    try {
      const response = await aiAPI.suggestImprovements(funnelData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Generate theme recommendations
 */
export const generateThemeRecommendationsAI = createAsyncThunk(
  'ai/generateThemeRecommendations',
  async (context, { rejectWithValue }) => {
    try {
      const response = await aiAPI.generateThemeRecommendations(context);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Translate content
 */
export const translateContent = createAsyncThunk(
  'ai/translateContent',
  async ({ content, targetLanguage }, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.translateContent({
        content,
        targetLanguage,
      });
      dispatch(showSuccess(`Content translated to ${targetLanguage}`));
      return response.data;
    } catch (error) {
      dispatch(showError('Translation failed'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Check grammar and spelling
 */
export const checkGrammar = createAsyncThunk(
  'ai/checkGrammar',
  async (content, { rejectWithValue }) => {
    try {
      const response = await aiAPI.checkGrammar(content);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Analyze sentiment
 */
export const analyzeSentiment = createAsyncThunk(
  'ai/analyzeSentiment',
  async (content, { rejectWithValue }) => {
    try {
      const response = await aiAPI.analyzeSentiment(content);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Update AI configuration
 */
export const updateAIConfig = createAsyncThunk(
  'ai/updateConfig',
  async (config, { dispatch, rejectWithValue }) => {
    try {
      const response = await aiAPI.updateConfig(config);
      dispatch(showSuccess('AI settings updated'));
      return response.data;
    } catch (error) {
      dispatch(showError('Failed to update AI settings'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/**
 * Cancel AI operation
 */
export const cancelAIOperation = createAsyncThunk(
  'ai/cancelOperation',
  async (operationId, { dispatch, rejectWithValue }) => {
    try {
      await aiAPI.cancelOperation(operationId);
      dispatch(showSuccess('Operation cancelled'));
      return operationId;
    } catch (error) {
      dispatch(showError('Failed to cancel operation'));
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    // =========================================================================
    // CREDITS
    // =========================================================================
    
    setCredits: (state, action) => {
      state.credits = {
        ...state.credits,
        ...action.payload,
      };
    },
    
    decrementCredits: (state, action) => {
      const amount = action.payload || 1;
      state.credits.used += amount;
      state.credits.remaining = Math.max(0, state.credits.remaining - amount);
    },
    
    // =========================================================================
    // OPERATIONS
    // =========================================================================
    
    addActiveOperation: (state, action) => {
      state.activeOperations.push({
        id: action.payload.id || `op-${Date.now()}`,
        type: action.payload.type,
        status: 'running',
        startTime: Date.now(),
        ...action.payload,
      });
    },
    
    updateOperation: (state, action) => {
      const { operationId, updates } = action.payload;
      const index = state.activeOperations.findIndex(op => op.id === operationId);
      
      if (index !== -1) {
        state.activeOperations[index] = {
          ...state.activeOperations[index],
          ...updates,
        };
      }
    },
    
    removeActiveOperation: (state, action) => {
      const operationId = action.payload;
      state.activeOperations = state.activeOperations.filter(
        op => op.id !== operationId
      );
    },
    
    clearActiveOperations: (state) => {
      state.activeOperations = [];
    },
    
    // =========================================================================
    // HISTORY
    // =========================================================================
    
    addToHistory: (state, action) => {
      state.history.unshift({
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        ...action.payload,
      });
      
      // Limit history to 100 items
      if (state.history.length > 100) {
        state.history = state.history.slice(0, 100);
      }
    },
    
    clearHistory: (state) => {
      state.history = [];
    },
    
    removeFromHistory: (state, action) => {
      const historyId = action.payload;
      state.history = state.history.filter(h => h.id !== historyId);
    },
    
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    setAIConfig: (state, action) => {
      state.config = {
        ...state.config,
        ...action.payload,
      };
      
      // Persist to localStorage
      localStorage.setItem('ai-config', JSON.stringify(state.config));
    },
    
    updateAIConfigField: (state, action) => {
      const { field, value } = action.payload;
      state.config[field] = value;
      
      localStorage.setItem('ai-config', JSON.stringify(state.config));
    },
    
    resetAIConfig: (state) => {
      state.config = initialState.config;
      localStorage.removeItem('ai-config');
    },
    
    // =========================================================================
    // SUGGESTIONS
    // =========================================================================
    
    addSuggestion: (state, action) => {
      state.suggestions.unshift({
        id: `suggestion-${Date.now()}`,
        timestamp: Date.now(),
        ...action.payload,
      });
      
      // Limit to 20 suggestions
      if (state.suggestions.length > 20) {
        state.suggestions = state.suggestions.slice(0, 20);
      }
    },
    
    removeSuggestion: (state, action) => {
      const suggestionId = action.payload;
      state.suggestions = state.suggestions.filter(s => s.id !== suggestionId);
    },
    
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    
    // =========================================================================
    // INSIGHTS
    // =========================================================================
    
    setInsights: (state, action) => {
      state.insights = {
        ...state.insights,
        ...action.payload,
      };
    },
    
    addConversionTip: (state, action) => {
      state.insights.conversionTips.push(action.payload);
    },
    
    clearInsights: (state) => {
      state.insights = initialState.insights;
    },
    
    // =========================================================================
    // QUEUE
    // =========================================================================
    
    addToQueue: (state, action) => {
      state.queue.push({
        id: `queue-${Date.now()}`,
        status: 'pending',
        ...action.payload,
      });
    },
    
    removeFromQueue: (state, action) => {
      const queueId = action.payload;
      state.queue = state.queue.filter(q => q.id !== queueId);
    },
    
    updateQueueItem: (state, action) => {
      const { queueId, updates } = action.payload;
      const index = state.queue.findIndex(q => q.id === queueId);
      
      if (index !== -1) {
        state.queue[index] = {
          ...state.queue[index],
          ...updates,
        };
      }
    },
    
    clearQueue: (state) => {
      state.queue = [];
    },
    
    // =========================================================================
    // STREAMING
    // =========================================================================
    
    startStreaming: (state, action) => {
      state.streaming = {
        isStreaming: true,
        operationId: action.payload.operationId,
        content: '',
        progress: 0,
      };
    },
    
    updateStreamingContent: (state, action) => {
      state.streaming.content = action.payload.content;
      state.streaming.progress = action.payload.progress || state.streaming.progress;
    },
    
    stopStreaming: (state) => {
      state.streaming = {
        isStreaming: false,
        operationId: null,
        content: '',
        progress: 0,
      };
    },
    
    // =========================================================================
    // RATE LIMITING
    // =========================================================================
    
    updateRateLimit: (state, action) => {
      state.rateLimit = {
        ...state.rateLimit,
        ...action.payload,
      };
    },
    
    decrementRateLimitRequests: (state) => {
      state.rateLimit.requestsRemaining = Math.max(
        0,
        state.rateLimit.requestsRemaining - 1
      );
    },
    
    // =========================================================================
    // ERRORS
    // =========================================================================
    
    clearError: (state, action) => {
      const errorType = action.payload;
      state.errors[errorType] = null;
    },
    
    clearAllErrors: (state) => {
      state.errors = initialState.errors;
    },
    
    // =========================================================================
    // RESET
    // =========================================================================
    
    resetAI: () => initialState,
  },
  
  extraReducers: (builder) => {
    // =========================================================================
    // FETCH CREDITS
    // =========================================================================
    
    builder
      .addCase(fetchAICredits.pending, (state) => {
        state.loading.credits = true;
        state.errors.credits = null;
      })
      .addCase(fetchAICredits.fulfilled, (state, action) => {
        state.loading.credits = false;
        state.credits = action.payload;
        state.lastSync = Date.now();
        
        // Show warning if low on credits
        if (action.payload.remaining < 10) {
          // Will be dispatched by caller
        }
      })
      .addCase(fetchAICredits.rejected, (state, action) => {
        state.loading.credits = false;
        state.errors.credits = action.payload;
      });
    
    // =========================================================================
    // FETCH HISTORY
    // =========================================================================
    
    builder
      .addCase(fetchAIHistory.pending, (state) => {
        state.loading.history = true;
      })
      .addCase(fetchAIHistory.fulfilled, (state, action) => {
        state.loading.history = false;
        state.history = action.payload.items || action.payload;
      })
      .addCase(fetchAIHistory.rejected, (state) => {
        state.loading.history = false;
      });
    
    // =========================================================================
    // GENERATE QUESTIONS
    // =========================================================================
    
    builder
      .addCase(generateQuestionsAI.pending, (state) => {
        state.loading.generate = true;
        state.errors.generation = null;
      })
      .addCase(generateQuestionsAI.fulfilled, (state, action) => {
        state.loading.generate = false;
        
        // Add to history
        state.history.unshift({
          id: `history-${Date.now()}`,
          type: AI_OPERATIONS.GENERATE_QUESTIONS,
          timestamp: Date.now(),
          result: action.payload,
        });
        
        // Decrement credits
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      })
      .addCase(generateQuestionsAI.rejected, (state, action) => {
        state.loading.generate = false;
        state.errors.generation = action.payload;
      });
    
    // =========================================================================
    // REFINE QUESTIONS
    // =========================================================================
    
    builder
      .addCase(refineQuestionsAI.pending, (state) => {
        state.loading.refine = true;
      })
      .addCase(refineQuestionsAI.fulfilled, (state, action) => {
        state.loading.refine = false;
        
        // Add to history
        state.history.unshift({
          id: `history-${Date.now()}`,
          type: AI_OPERATIONS.REFINE_QUESTIONS,
          timestamp: Date.now(),
          result: action.payload,
        });
        
        // Decrement credits
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      })
      .addCase(refineQuestionsAI.rejected, (state) => {
        state.loading.refine = false;
      });
    
    // =========================================================================
    // GENERATE CONTENT
    // =========================================================================
    
    builder
      .addCase(generateContentAI.pending, (state) => {
        state.loading.generate = true;
      })
      .addCase(generateContentAI.fulfilled, (state, action) => {
        state.loading.generate = false;
        
        // Add to history
        state.history.unshift({
          id: `history-${Date.now()}`,
          type: AI_OPERATIONS.GENERATE_CONTENT,
          timestamp: Date.now(),
          result: action.payload,
        });
        
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      })
      .addCase(generateContentAI.rejected, (state) => {
        state.loading.generate = false;
      });
    
    // =========================================================================
    // OPTIMIZE CONTENT
    // =========================================================================
    
    builder
      .addCase(optimizeContentAI.fulfilled, (state, action) => {
        state.history.unshift({
          id: `history-${Date.now()}`,
          type: AI_OPERATIONS.OPTIMIZE_CONTENT,
          timestamp: Date.now(),
          result: action.payload,
        });
        
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      });
    
    // =========================================================================
    // GENERATE RECOMMENDATIONS
    // =========================================================================
    
    builder
      .addCase(generateRecommendationsAI.pending, (state) => {
        state.loading.generate = true;
      })
      .addCase(generateRecommendationsAI.fulfilled, (state, action) => {
        state.loading.generate = false;
        
        // Add as suggestions
        if (action.payload.recommendations) {
          action.payload.recommendations.forEach(rec => {
            state.suggestions.unshift({
              id: `suggestion-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              ...rec,
            });
          });
        }
        
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      })
      .addCase(generateRecommendationsAI.rejected, (state) => {
        state.loading.generate = false;
      });
    
    // =========================================================================
    // ANALYZE AUDIENCE
    // =========================================================================
    
    builder
      .addCase(analyzeAudience.pending, (state) => {
        state.loading.analyze = true;
        state.errors.analysis = null;
      })
      .addCase(analyzeAudience.fulfilled, (state, action) => {
        state.loading.analyze = false;
        state.insights.audienceAnalysis = action.payload;
        
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      })
      .addCase(analyzeAudience.rejected, (state, action) => {
        state.loading.analyze = false;
        state.errors.analysis = action.payload;
      });
    
    // =========================================================================
    // GET FUNNEL INSIGHTS
    // =========================================================================
    
    builder
      .addCase(getFunnelInsights.pending, (state) => {
        state.loading.insights = true;
      })
      .addCase(getFunnelInsights.fulfilled, (state, action) => {
        state.loading.insights = false;
        state.insights.funnelPerformance = action.payload;
      })
      .addCase(getFunnelInsights.rejected, (state) => {
        state.loading.insights = false;
      });
    
    // =========================================================================
    // SUGGEST IMPROVEMENTS
    // =========================================================================
    
    builder
      .addCase(suggestImprovements.fulfilled, (state, action) => {
        if (action.payload.suggestions) {
          action.payload.suggestions.forEach(suggestion => {
            state.suggestions.unshift({
              id: `suggestion-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              ...suggestion,
            });
          });
        }
        
        if (action.payload.conversionTips) {
          state.insights.conversionTips = action.payload.conversionTips;
        }
      });
    
    // =========================================================================
    // TRANSLATE CONTENT
    // =========================================================================
    
    builder
      .addCase(translateContent.fulfilled, (state, action) => {
        state.history.unshift({
          id: `history-${Date.now()}`,
          type: AI_OPERATIONS.TRANSLATE_CONTENT,
          timestamp: Date.now(),
          result: action.payload,
        });
        
        state.credits.used += action.payload.creditsUsed || 1;
        state.credits.remaining = Math.max(
          0,
          state.credits.remaining - (action.payload.creditsUsed || 1)
        );
      });
    
    // =========================================================================
    // CHECK GRAMMAR
    // =========================================================================
    
    builder
      .addCase(checkGrammar.fulfilled, (state, action) => {
        state.history.unshift({
          id: `history-${Date.now()}`,
          type: AI_OPERATIONS.GRAMMAR_CHECK,
          timestamp: Date.now(),
          result: action.payload,
        });
      });
    
    // =========================================================================
    // UPDATE CONFIG
    // =========================================================================
    
    builder
      .addCase(updateAIConfig.fulfilled, (state, action) => {
        state.config = {
          ...state.config,
          ...action.payload,
        };
      });
    
    // =========================================================================
    // CANCEL OPERATION
    // =========================================================================
    
    builder
      .addCase(cancelAIOperation.fulfilled, (state, action) => {
        const operationId = action.payload;
        state.activeOperations = state.activeOperations.filter(
          op => op.id !== operationId
        );
      });
  },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
  // Credits
  setCredits,
  decrementCredits,
  
  // Operations
  addActiveOperation,
  updateOperation,
  removeActiveOperation,
  clearActiveOperations,
  
  // History
  addToHistory,
  clearHistory,
  removeFromHistory,
  
  // Configuration
  setAIConfig,
  updateAIConfigField,
  resetAIConfig,
  
  // Suggestions
  addSuggestion,
  removeSuggestion,
  clearSuggestions,
  
  // Insights
  setInsights,
  addConversionTip,
  clearInsights,
  
  // Queue
  addToQueue,
  removeFromQueue,
  updateQueueItem,
  clearQueue,
  
  // Streaming
  startStreaming,
  updateStreamingContent,
  stopStreaming,
  
  // Rate limiting
  updateRateLimit,
  decrementRateLimitRequests,
  
  // Errors
  clearError,
  clearAllErrors,
  
  // Reset
  resetAI,
} = aiSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Credits
export const selectAICredits = (state) => state.ai.credits;
export const selectCreditsRemaining = (state) => state.ai.credits.remaining;
export const selectCreditsUsed = (state) => state.ai.credits.used;
export const selectPlanTier = (state) => state.ai.credits.planTier;
export const selectHasCredits = (state) => state.ai.credits.remaining > 0;
export const selectIsLowOnCredits = (state) => state.ai.credits.remaining < 10;

// Operations
export const selectActiveOperations = (state) => state.ai.activeOperations;
export const selectHasActiveOperations = (state) => state.ai.activeOperations.length > 0;
export const selectOperationById = (operationId) => (state) =>
  state.ai.activeOperations.find(op => op.id === operationId);

// History
export const selectAIHistory = (state) => state.ai.history;
export const selectHistoryCount = (state) => state.ai.history.length;
export const selectRecentHistory = (limit = 10) => (state) =>
  state.ai.history.slice(0, limit);

// Configuration
export const selectAIConfig = (state) => state.ai.config;
export const selectAIModel = (state) => state.ai.config.model;
export const selectAITemperature = (state) => state.ai.config.temperature;
export const selectAILanguage = (state) => state.ai.config.language;
export const selectAITone = (state) => state.ai.config.tone;

// Suggestions
export const selectSuggestions = (state) => state.ai.suggestions;
export const selectSuggestionsCount = (state) => state.ai.suggestions.length;
export const selectHasSuggestions = (state) => state.ai.suggestions.length > 0;

// Insights
export const selectInsights = (state) => state.ai.insights;
export const selectFunnelPerformanceInsights = (state) => state.ai.insights.funnelPerformance;
export const selectAudienceAnalysis = (state) => state.ai.insights.audienceAnalysis;
export const selectConversionTips = (state) => state.ai.insights.conversionTips;

// Queue
export const selectQueue = (state) => state.ai.queue;
export const selectQueueLength = (state) => state.ai.queue.length;
export const selectHasQueuedOperations = (state) => state.ai.queue.length > 0;

// Streaming
export const selectStreaming = (state) => state.ai.streaming;
export const selectIsStreaming = (state) => state.ai.streaming.isStreaming;
export const selectStreamingContent = (state) => state.ai.streaming.content;
export const selectStreamingProgress = (state) => state.ai.streaming.progress;

// Rate limiting
export const selectRateLimit = (state) => state.ai.rateLimit;
export const selectRateLimitRemaining = (state) => state.ai.rateLimit.requestsRemaining;
export const selectIsRateLimited = (state) => state.ai.rateLimit.requestsRemaining === 0;

// Loading states
export const selectAILoading = (state) => state.ai.loading;
export const selectIsGenerating = (state) => state.ai.loading.generate;
export const selectIsRefining = (state) => state.ai.loading.refine;
export const selectIsAnalyzing = (state) => state.ai.loading.analyze;
export const selectIsFetchingCredits = (state) => state.ai.loading.credits;

// Errors
export const selectAIErrors = (state) => state.ai.errors;
export const selectGenerationError = (state) => state.ai.errors.generation;
export const selectAnalysisError = (state) => state.ai.errors.analysis;

// Meta
export const selectLastSync = (state) => state.ai.lastSync;

// Computed selectors
export const selectCreditUsagePercentage = (state) => {
  const { total, used } = state.ai.credits;
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
};

export const selectHistoryByType = (operationType) => (state) =>
  state.ai.history.filter(h => h.type === operationType);

export const selectTodayUsage = (state) => {
  const today = new Date().setHours(0, 0, 0, 0);
  return state.ai.history.filter(h => h.timestamp >= today).length;
};

// =============================================================================
// THUNK HELPERS
// =============================================================================

/**
 * Check if user has enough credits
 */
export const checkCredits = (requiredCredits = 1) => (dispatch, getState) => {
  const state = getState();
  const remaining = selectCreditsRemaining(state);
  
  if (remaining < requiredCredits) {
    dispatch(showWarning('Insufficient AI credits. Please upgrade your plan.'));
    return false;
  }
  
  return true;
};

/**
 * Refresh credits if stale
 */
export const refreshCreditsIfNeeded = () => (dispatch, getState) => {
  const state = getState();
  const lastSync = selectLastSync(state);
  
  // Refresh if older than 5 minutes
  if (!lastSync || Date.now() - lastSync > 5 * 60 * 1000) {
    return dispatch(fetchAICredits());
  }
  
  return Promise.resolve();
};

/**
 * Generate with credit check
 */
export const generateWithCheck = (operation, params) => async (dispatch) => {
  const hasCredits = dispatch(checkCredits());
  
  if (!hasCredits) {
    return null;
  }
  
  return dispatch(operation(params)).unwrap();
};

// =============================================================================
// REDUCER
// =============================================================================

export default aiSlice.reducer;
