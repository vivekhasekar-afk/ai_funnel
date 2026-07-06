// =============================================================================
// AI FUNNEL PLATFORM - AUTHENTICATION VALIDATION SCHEMAS (ENHANCED)
// =============================================================================
// Comprehensive validation rules for all authentication flows
// Using Zod for runtime validation with advanced security checks
// =============================================================================

import { z } from 'zod';
import { VALIDATION_CONFIG } from '@config/constants';

// =============================================================================
// BASE VALIDATION SCHEMAS
// =============================================================================

/**
 * Email Schema with advanced validation
 * - Checks format, length, and common domains
 * - Prevents disposable email services
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters')
  .email('Invalid email address')
  .toLowerCase()
  .trim()
  .refine(
    (email) => {
      // Block common disposable email domains (optional - remove if not needed)
      const disposableDomains = [
        'tempmail.com',
        'throwaway.email',
        '10minutemail.com',
        'guerrillamail.com',
        'mailinator.com',
      ];
      const domain = email.split('@')[1];
      return !disposableDomains.includes(domain);
    },
    { message: 'Disposable email addresses are not allowed' }
  );

/**
 * Password Schema with comprehensive security requirements
 */
export const passwordSchema = z
  .string()
  .min(
    VALIDATION_CONFIG.PASSWORD_MIN_LENGTH,
    `Password must be at least ${VALIDATION_CONFIG.PASSWORD_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION_CONFIG.PASSWORD_MAX_LENGTH,
    `Password must be less than ${VALIDATION_CONFIG.PASSWORD_MAX_LENGTH} characters`
  )
  .refine(
    (password) => {
      if (!VALIDATION_CONFIG.PASSWORD_REQUIRE_UPPERCASE) return true;
      return /[A-Z]/.test(password);
    },
    { message: 'Password must contain at least one uppercase letter' }
  )
  .refine(
    (password) => {
      if (!VALIDATION_CONFIG.PASSWORD_REQUIRE_LOWERCASE) return true;
      return /[a-z]/.test(password);
    },
    { message: 'Password must contain at least one lowercase letter' }
  )
  .refine(
    (password) => {
      if (!VALIDATION_CONFIG.PASSWORD_REQUIRE_NUMBER) return true;
      return /\d/.test(password);
    },
    { message: 'Password must contain at least one number' }
  )
  .refine(
    (password) => {
      if (!VALIDATION_CONFIG.PASSWORD_REQUIRE_SPECIAL) return true;
      return /[@$!%*?&#^()_+=\-[\]{}|\\:;"'<>,.~`]/.test(password);
    },
    { message: 'Password must contain at least one special character' }
  )
  .refine(
    (password) => {
      // Check against common weak passwords
      const commonPasswords = [
        'password',
        '12345678',
        'qwerty123',
        'password123',
        'admin123',
      ];
      return !commonPasswords.includes(password.toLowerCase());
    },
    { message: 'This password is too common. Please choose a stronger password' }
  )
  .refine(
    (password) => {
      // No consecutive repeated characters (e.g., 'aaa', '111')
      return !/(.)\1{2,}/.test(password);
    },
    { message: 'Password cannot contain more than 2 consecutive identical characters' }
  );

/**
 * Name Schema
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim()
  .refine(
    (name) => /^[a-zA-Z\s'-]+$/.test(name),
    { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }
  );

/**
 * Username Schema
 */
export const usernameSchema = z
  .string()
  .min(
    VALIDATION_CONFIG.USERNAME_MIN_LENGTH,
    `Username must be at least ${VALIDATION_CONFIG.USERNAME_MIN_LENGTH} characters`
  )
  .max(
    VALIDATION_CONFIG.USERNAME_MAX_LENGTH,
    `Username must be less than ${VALIDATION_CONFIG.USERNAME_MAX_LENGTH} characters`
  )
  .regex(
    VALIDATION_CONFIG.USERNAME_PATTERN,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )
  .toLowerCase()
  .trim()
  .refine(
    (username) => {
      // Reserved usernames
      const reserved = ['admin', 'root', 'system', 'api', 'support', 'help'];
      return !reserved.includes(username);
    },
    { message: 'This username is reserved' }
  );

/**
 * Phone Schema (International format)
 */
export const phoneSchema = z
  .string()
  .regex(
    VALIDATION_CONFIG.PHONE_PATTERN,
    'Invalid phone number format. Use international format (e.g., +1234567890)'
  )
  .optional()
  .or(z.literal(''));

/**
 * Company Name Schema
 */
export const companySchema = z
  .string()
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name must be less than 100 characters')
  .trim()
  .optional()
  .or(z.literal(''));

/**
 * Token Schema (for verification, reset, etc.)
 */
export const tokenSchema = z
  .string()
  .min(20, 'Invalid token')
  .max(500, 'Invalid token');

/**
 * OTP/Verification Code Schema
 */
export const otpSchema = z
  .string()
  .length(6, 'Code must be 6 digits')
  .regex(/^\d{6}$/, 'Code must contain only numbers');

// =============================================================================
// AUTHENTICATION FLOW SCHEMAS
// =============================================================================

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  deviceName: z.string().optional(),
  deviceFingerprint: z.string().optional(),
});

/**
 * Signup Schema (Standard)
 */
export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    company: companySchema,
    phone: phoneSchema,
    role: z
      .enum(['entrepreneur', 'marketer', 'agency', 'freelancer'])
      .optional()
      .default('entrepreneur'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
      message: 'You must accept the privacy policy',
    }),
    newsletter: z.boolean().optional().default(false),
    marketingEmails: z.boolean().optional().default(false),
    referralCode: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Signup Schema (OAuth) - Complete profile after OAuth
 */
export const oauthSignupSchema = z.object({
  name: nameSchema.optional(),
  company: companySchema,
  phone: phoneSchema,
  role: z
    .enum(['entrepreneur', 'marketer', 'agency', 'freelancer'])
    .optional()
    .default('entrepreneur'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
  newsletter: z.boolean().optional().default(false),
});

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
  recaptchaToken: z.string().optional(), // For bot protection
});

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Change Password Schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Verify Email Schema
 */
export const verifyEmailSchema = z.object({
  token: tokenSchema,
  email: emailSchema.optional(),
});

/**
 * Resend Verification Email Schema
 */
export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// =============================================================================
// TWO-FACTOR AUTHENTICATION SCHEMAS
// =============================================================================

/**
 * Two-Factor Authentication Setup Schema
 */
export const twoFactorSetupSchema = z.object({
  password: z.string().min(1, 'Password is required for verification'),
  method: z.enum(['app', 'sms', 'email']).optional().default('app'),
  phoneNumber: z
    .string()
    .regex(VALIDATION_CONFIG.PHONE_PATTERN, 'Invalid phone number')
    .optional(),
});

/**
 * Two-Factor Authentication Verify Schema
 */
export const twoFactorVerifySchema = z.object({
  code: otpSchema,
  trustDevice: z.boolean().optional().default(false),
});

/**
 * Two-Factor Authentication Disable Schema
 */
export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: otpSchema,
});

/**
 * Two-Factor Authentication Login Schema
 */
export const twoFactorLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  code: otpSchema,
  rememberMe: z.boolean().optional().default(false),
  trustDevice: z.boolean().optional().default(false),
});

/**
 * Two-Factor Backup Codes Schema
 */
export const twoFactorBackupCodesSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

/**
 * Two-Factor Recovery Code Schema
 */
export const twoFactorRecoverySchema = z.object({
  email: emailSchema,
  recoveryCode: z
    .string()
    .length(16, 'Recovery code must be 16 characters')
    .regex(/^[A-Z0-9]{16}$/, 'Invalid recovery code format'),
});

// =============================================================================
// OAUTH SCHEMAS
// =============================================================================

/**
 * OAuth Callback Schema
 */
export const oauthCallbackSchema = z.object({
  provider: z.enum(['google', 'linkedin', 'facebook', 'github', 'microsoft']),
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
  error: z.string().optional(),
  errorDescription: z.string().optional(),
});

/**
 * OAuth Connect Schema (for linking accounts)
 */
export const oauthConnectSchema = z.object({
  provider: z.enum(['google', 'linkedin', 'facebook', 'github', 'microsoft']),
  accessToken: z.string().min(1, 'Access token is required'),
});

/**
 * OAuth Disconnect Schema
 */
export const oauthDisconnectSchema = z.object({
  provider: z.enum(['google', 'linkedin', 'facebook', 'github', 'microsoft']),
  password: z.string().min(1, 'Password is required for verification'),
});

// =============================================================================
// SESSION MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Refresh Token Schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceFingerprint: z.string().optional(),
});

/**
 * Logout Schema
 */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  logoutAllDevices: z.boolean().optional().default(false),
});

/**
 * Session Check Schema
 */
export const sessionCheckSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Revoke Session Schema
 */
export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Active Sessions List Schema
 */
export const listSessionsSchema = z.object({
  includeExpired: z.boolean().optional().default(false),
});

// =============================================================================
// SECURITY SCHEMAS
// =============================================================================

/**
 * Update Email Schema
 */
export const updateEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, 'Password is required for verification'),
});

/**
 * Verify Email Change Schema
 */
export const verifyEmailChangeSchema = z.object({
  token: tokenSchema,
  code: otpSchema.optional(),
});

/**
 * IP Whitelist Schema
 */
export const ipWhitelistSchema = z.object({
  ipAddress: z
    .string()
    .regex(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Invalid IP address format'
    ),
  label: z.string().min(1).max(50).optional(),
});

/**
 * Security Question Schema
 */
export const securityQuestionSchema = z.object({
  question: z.string().min(10).max(200),
  answer: z.string().min(3).max(100),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Account Deletion Schema
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmDeletion: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({ message: 'Please type "DELETE MY ACCOUNT" to confirm' }),
  }),
  reason: z
    .enum([
      'not_useful',
      'too_expensive',
      'missing_features',
      'found_alternative',
      'privacy_concerns',
      'other',
    ])
    .optional(),
  feedback: z.string().max(500).optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Password Strength Checker
 * Returns strength score from 0-4 with detailed feedback
 */
export const checkPasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: 'Too weak',
      color: 'red',
      suggestions: ['Enter a password'],
    };
  }

  let score = 0;
  const suggestions = [];

  // Length checks
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  else if (password.length >= 8) suggestions.push('Use 12+ characters for better security');

  // Character variety
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&#]/.test(password);

  if (hasLower && hasUpper) score++;
  else suggestions.push('Use both uppercase and lowercase letters');

  if (hasNumber) score++;
  else suggestions.push('Add numbers');

  if (hasSpecial) score++;
  else suggestions.push('Add special characters (@$!%*?&#)');

  // Common password check
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin'];
  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid common words and patterns');
  }

  // Cap at 4
  score = Math.min(score, 4);

  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['red', 'orange', 'yellow', 'blue', 'green'];

  return {
    score,
    label: labels[score],
    color: colors[score],
    suggestions: score < 4 ? suggestions : [],
    percentage: (score / 4) * 100,
  };
};

/**
 * Quick validation helpers
 */
export const isValidEmail = (email) => {
  const result = emailSchema.safeParse(email);
  return result.success;
};

export const isValidPassword = (password) => {
  const result = passwordSchema.safeParse(password);
  return result.success;
};

export const isValidUsername = (username) => {
  const result = usernameSchema.safeParse(username);
  return result.success;
};

export const isValidPhone = (phone) => {
  const result = phoneSchema.safeParse(phone);
  return result.success;
};

/**
 * Safe parse helpers with formatted errors
 */
export const safeParseLogin = (data) => {
  return loginSchema.safeParse(data);
};

export const safeParseSignup = (data) => {
  return signupSchema.safeParse(data);
};

export const safeParseForgotPassword = (data) => {
  return forgotPasswordSchema.safeParse(data);
};

export const safeParseResetPassword = (data) => {
  return resetPasswordSchema.safeParse(data);
};

export const safeParseChangePassword = (data) => {
  return changePasswordSchema.safeParse(data);
};

export const safeParseTwoFactorVerify = (data) => {
  return twoFactorVerifySchema.safeParse(data);
};

/**
 * Format Zod errors for display
 */
export const formatZodErrors = (zodError) => {
  const errors = {};
  zodError.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  return errors;
};

/**
 * Get first error message
 */
export const getFirstError = (zodError) => {
  return zodError.errors[0]?.message || 'Validation error';
};

/**
 * Sanitize user input (remove potential XSS)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

// =============================================================================
// TYPE EXPORTS (for JSDoc/TypeScript)
// =============================================================================

export const AuthSchemaTypes = {
  Email: emailSchema,
  Password: passwordSchema,
  Name: nameSchema,
  Username: usernameSchema,
  Phone: phoneSchema,
  Login: loginSchema,
  Signup: signupSchema,
  OAuthSignup: oauthSignupSchema,
  ForgotPassword: forgotPasswordSchema,
  ResetPassword: resetPasswordSchema,
  ChangePassword: changePasswordSchema,
  VerifyEmail: verifyEmailSchema,
  ResendVerification: resendVerificationSchema,
  TwoFactorSetup: twoFactorSetupSchema,
  TwoFactorVerify: twoFactorVerifySchema,
  TwoFactorDisable: twoFactorDisableSchema,
  TwoFactorLogin: twoFactorLoginSchema,
  TwoFactorBackupCodes: twoFactorBackupCodesSchema,
  TwoFactorRecovery: twoFactorRecoverySchema,
  OAuthCallback: oauthCallbackSchema,
  OAuthConnect: oauthConnectSchema,
  OAuthDisconnect: oauthDisconnectSchema,
  RefreshToken: refreshTokenSchema,
  Logout: logoutSchema,
  SessionCheck: sessionCheckSchema,
  RevokeSession: revokeSessionSchema,
  UpdateEmail: updateEmailSchema,
  DeleteAccount: deleteAccountSchema,
};

/**
 * Default Export
 */
export default {
  // Base schemas
  emailSchema,
  passwordSchema,
  nameSchema,
  usernameSchema,
  phoneSchema,
  companySchema,
  tokenSchema,
  otpSchema,

  // Auth flow schemas
  loginSchema,
  signupSchema,
  oauthSignupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,

  // 2FA schemas
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  twoFactorDisableSchema,
  twoFactorLoginSchema,
  twoFactorBackupCodesSchema,
  twoFactorRecoverySchema,

  // OAuth schemas
  oauthCallbackSchema,
  oauthConnectSchema,
  oauthDisconnectSchema,

  // Session schemas
  refreshTokenSchema,
  logoutSchema,
  sessionCheckSchema,
  revokeSessionSchema,
  listSessionsSchema,

  // Security schemas
  updateEmailSchema,
  verifyEmailChangeSchema,
  ipWhitelistSchema,
  securityQuestionSchema,
  deleteAccountSchema,

  // Helper functions
  checkPasswordStrength,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidPhone,
  safeParseLogin,
  safeParseSignup,
  safeParseForgotPassword,
  safeParseResetPassword,
  safeParseChangePassword,
  safeParseTwoFactorVerify,
  formatZodErrors,
  getFirstError,
  sanitizeInput,

  // Types
  AuthSchemaTypes,
};
