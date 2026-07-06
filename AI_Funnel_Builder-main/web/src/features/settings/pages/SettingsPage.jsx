// =============================================================================
// AI FUNNEL PLATFORM - SettingsPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input, Button, Toggle, Select } from '../../../components/ui';
import { updateProfile, changePassword, updatePreferences, updateBusinessInfo, uploadAvatar } from '../../../api/settings.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const SETTINGS_PAGE_STYLES = `
/* Settings Container */
.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 2rem;
}

.settings-page__inner {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.settings-header {
  margin-bottom: 2rem;
}

.settings-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.settings-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.02em;
}

.settings-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Layout */
.settings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: flex-start;
}

/* Sidebar */
.settings-sidebar {
  position: sticky;
  top: 2rem;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.settings-nav {
  padding: 1rem;
}

.settings-nav__item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  font-size: 0.938rem;
  font-weight: 600;
  color: #6b7280;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  margin-bottom: 0.5rem;
}

.settings-nav__item:last-child {
  margin-bottom: 0;
}

.settings-nav__item:hover {
  color: #667eea;
  background: #f0f9ff;
}

.settings-nav__item--active {
  color: #667eea;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.settings-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.settings-nav__icon svg {
  width: 20px;
  height: 20px;
}

/* Main Content */
.settings-main {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.settings-content {
  padding: 2.5rem;
}

/* Section */
.settings-section {
  margin-bottom: 3rem;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section__header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.settings-section__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.settings-section__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Form */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.settings-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.settings-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.settings-form__helper {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: 0.25rem;
  line-height: 1.5;
}

.settings-form__error {
  font-size: 0.813rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.settings-form__error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.settings-form__row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
}

.settings-form__actions {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* Avatar */
.settings-avatar {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.settings-avatar__preview {
  position: relative;
  flex-shrink: 0;
}

.settings-avatar__image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.settings-avatar__placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 700;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.settings-avatar__edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: 3px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.settings-avatar__edit:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.settings-avatar__edit svg {
  width: 18px;
  height: 18px;
}

.settings-avatar__input {
  display: none;
}

.settings-avatar__info {
  flex: 1;
}

.settings-avatar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* Textarea */
.settings-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.875rem 1rem;
  font-size: 0.938rem;
  font-family: inherit;
  color: #111827;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  resize: vertical;
  transition: all 0.2s ease;
}

.settings-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.settings-textarea:disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.settings-textarea--error {
  border-color: #dc2626;
}

.settings-textarea--error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* Toggle Group */
.settings-toggle-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.settings-toggle-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.settings-toggle-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.settings-toggle-item__content {
  flex: 1;
}

.settings-toggle-item__title {
  font-size: 0.938rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.375rem 0;
}

.settings-toggle-item__description {
  font-size: 0.813rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.settings-toggle-item__control {
  flex-shrink: 0;
}

/* Info Card */
.settings-info-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1.5px solid #93c5fd;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.settings-info-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ffffff;
  color: #3b82f6;
}

.settings-info-card__icon svg {
  width: 20px;
  height: 20px;
}

.settings-info-card__content {
  flex: 1;
}

.settings-info-card__title {
  font-size: 0.938rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 0.375rem 0;
}

.settings-info-card__text {
  font-size: 0.813rem;
  color: #1e40af;
  margin: 0;
  line-height: 1.5;
}

/* Alert */
.settings-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: settings-alert-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes settings-alert-enter {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-alert--error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
}

.settings-alert--success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1.5px solid #6ee7b7;
}

.settings-alert__icon {
  flex-shrink: 0;
}

.settings-alert--error .settings-alert__icon {
  color: #dc2626;
}

.settings-alert--success .settings-alert__icon {
  color: #059669;
}

.settings-alert__icon svg {
  width: 20px;
  height: 20px;
}

.settings-alert__content {
  flex: 1;
}

.settings-alert__title {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.settings-alert--error .settings-alert__title {
  color: #991b1b;
}

.settings-alert--success .settings-alert__title {
  color: #065f46;
}

.settings-alert__message {
  font-size: 0.813rem;
  margin: 0;
}

.settings-alert--error .settings-alert__message {
  color: #7f1d1d;
}

.settings-alert--success .settings-alert__message {
  color: #064e3b;
}

/* Responsive */
@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
  
  .settings-sidebar {
    position: static;
  }
  
  .settings-nav {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .settings-nav__item {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1.5rem 1rem;
  }
  
  .settings-header__title {
    font-size: 1.75rem;
  }
  
  .settings-content {
    padding: 2rem 1.5rem;
  }
  
  .settings-form__row {
    grid-template-columns: 1fr;
  }
  
  .settings-avatar {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .settings-form__actions {
    flex-direction: column;
  }
  
  .settings-form__actions button {
    width: 100%;
  }
  
  .settings-nav {
    grid-template-columns: 1fr;
  }
  
  .settings-toggle-item {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .settings-alert {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'settings-page');
  styleElement.textContent = SETTINGS_PAGE_STYLES;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

// =============================================================================
// ICONS
// =============================================================================

const UserIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CogIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CameraIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const SettingsPage = ({
  user,
  onUpdate,
  className = '',
  ...props
}) => {
  useEffect(() => {
    injectStyles();
  }, []);

  const [activeTab, setActiveTab] = useState('profile');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
  });

  const [accountData, setAccountData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferencesData, setPreferencesData] = useState({
    timezone: user?.timezone || 'UTC',
    emailNotifications: user?.emailNotifications ?? true,
    pushNotifications: user?.pushNotifications ?? true,
    marketingEmails: user?.marketingEmails ?? false,
    weeklyReports: user?.weeklyReports ?? true,
  });

  const [businessData, setBusinessData] = useState({
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    companyName: user?.companyName || '',
    website: user?.website || '',
  });

  const [errors, setErrors] = useState({});

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserIcon /> },
    { id: 'account', label: 'Account', icon: <ShieldIcon /> },
    { id: 'preferences', label: 'Preferences', icon: <CogIcon /> },
    { id: 'business', label: 'Business Info', icon: <BriefcaseIcon /> },
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Australia/Sydney', label: 'Sydney' },
  ];

  const industries = [
    { value: 'technology', label: 'Technology & Software' },
    { value: 'ecommerce', label: 'E-commerce & Retail' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'consulting', label: 'Consulting & Services' },
    { value: 'education', label: 'Education & Training' },
    { value: 'healthcare', label: 'Healthcare & Medical' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'realestate', label: 'Real Estate' },
    { value: 'other', label: 'Other' },
  ];

  const companySizes = [
    { value: 'solo', label: 'Just me' },
    { value: 'small', label: '2-10 employees' },
    { value: 'medium', label: '11-50 employees' },
    { value: 'large', label: '51-200 employees' },
    { value: 'enterprise', label: '200+ employees' },
  ];

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handlePreferenceChange = (name, value) => {
    setPreferencesData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', title: 'File Too Large', message: 'Avatar must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await uploadAvatar(formData);
      setAlert({ type: 'success', title: 'Avatar Updated', message: 'Profile picture updated successfully' });
      onUpdate?.();
    } catch (error) {
      setAlert({ type: 'error', title: 'Upload Failed', message: error.response?.data?.message || 'Failed to upload avatar' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      await updateProfile(profileData);
      setAlert({ type: 'success', title: 'Profile Updated', message: 'Your profile has been updated successfully' });
      onUpdate?.();
    } catch (error) {
      setAlert({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!accountData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!accountData.newPassword) newErrors.newPassword = 'New password is required';
    else if (accountData.newPassword.length < 8) newErrors.newPassword = 'Minimum 8 characters required';
    if (accountData.newPassword !== accountData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      await changePassword({
        currentPassword: accountData.currentPassword,
        newPassword: accountData.newPassword,
      });
      setAlert({ type: 'success', title: 'Password Changed', message: 'Your password has been changed successfully' });
      setAccountData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      setAlert({ type: 'error', title: 'Change Failed', message: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      await updatePreferences(preferencesData);
      setAlert({ type: 'success', title: 'Preferences Updated', message: 'Your preferences have been saved' });
      onUpdate?.();
    } catch (error) {
      setAlert({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || 'Failed to update preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      await updateBusinessInfo(businessData);
      setAlert({ type: 'success', title: 'Business Info Updated', message: 'Your business information has been saved' });
      onUpdate?.();
    } catch (error) {
      setAlert({ type: 'error', title: 'Update Failed', message: error.response?.data?.message || 'Failed to update business info' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`settings-page ${className}`} {...props}>
      <div className="settings-page__inner">
        <div className="settings-header">
          <div className="settings-header__top">
            <div>
              <h1 className="settings-header__title">Settings</h1>
              <p className="settings-header__subtitle">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <aside className="settings-sidebar">
            <nav className="settings-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`settings-nav__item ${activeTab === tab.id ? 'settings-nav__item--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-nav__icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="settings-main">
            <div className="settings-content">
              {alert && (
                <div className={`settings-alert settings-alert--${alert.type}`}>
                  <div className="settings-alert__icon">
                    {alert.type === 'success' ? <CheckCircleIcon /> : <AlertIcon />}
                  </div>
                  <div className="settings-alert__content">
                    <p className="settings-alert__title">{alert.title}</p>
                    <p className="settings-alert__message">{alert.message}</p>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <>
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <h2 className="settings-section__title">Profile Picture</h2>
                      <p className="settings-section__description">Update your avatar and personal information</p>
                    </div>

                    <div className="settings-avatar">
                      <div className="settings-avatar__preview">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="settings-avatar__image" />
                        ) : (
                          <div className="settings-avatar__placeholder">
                            {profileData.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <button type="button" className="settings-avatar__edit" onClick={handleAvatarClick}>
                          <CameraIcon />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="settings-avatar__input"
                        />
                      </div>
                      <div className="settings-avatar__info">
                        <h3 className="settings-section__title">Upload Photo</h3>
                        <p className="settings-form__helper">JPG, PNG or GIF. Max size 5MB. Recommended 400x400px.</p>
                        <div className="settings-avatar__actions">
                          <Button size="sm" variant="outline" onClick={handleAvatarClick} disabled={loading}>
                            Change Avatar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section__header">
                      <h2 className="settings-section__title">Personal Information</h2>
                    </div>

                    <form className="settings-form" onSubmit={handleProfileSubmit}>
                      <div className="settings-form__row">
                        <div className="settings-form__group">
                          <label htmlFor="firstName" className="settings-form__label">First Name</label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleProfileChange}
                            disabled={loading}
                          />
                        </div>
                        <div className="settings-form__group">
                          <label htmlFor="lastName" className="settings-form__label">Last Name</label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleProfileChange}
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="settings-form__group">
                        <label htmlFor="bio" className="settings-form__label">Bio</label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={profileData.bio}
                          onChange={handleProfileChange}
                          placeholder="Tell us about yourself..."
                          disabled={loading}
                          className="settings-textarea"
                        />
                        <p className="settings-form__helper">Brief description for your profile. Max 160 characters.</p>
                      </div>

                      <div className="settings-form__actions">
                        <Button type="submit" variant="primary" loading={loading}>
                          Save Changes
                        </Button>
                        <Button type="button" variant="ghost" disabled={loading}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <>
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <h2 className="settings-section__title">Email Address</h2>
                    </div>

                    <div className="settings-form">
                      <div className="settings-form__group">
                        <label htmlFor="email" className="settings-form__label">Email</label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={accountData.email}
                          onChange={handleAccountChange}
                          disabled
                        />
                        <p className="settings-form__helper">Contact support to change your email address.</p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section__header">
                      <h2 className="settings-section__title">Change Password</h2>
                      <p className="settings-section__description">Ensure your account is using a strong password</p>
                    </div>

                    <form className="settings-form" onSubmit={handlePasswordSubmit}>
                      <div className="settings-form__group">
                        <label htmlFor="currentPassword" className="settings-form__label">Current Password</label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={accountData.currentPassword}
                          onChange={handleAccountChange}
                          error={!!errors.currentPassword}
                          disabled={loading}
                        />
                        {errors.currentPassword && (
                          <p className="settings-form__error"><AlertIcon />{errors.currentPassword}</p>
                        )}
                      </div>

                      <div className="settings-form__group">
                        <label htmlFor="newPassword" className="settings-form__label">New Password</label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={accountData.newPassword}
                          onChange={handleAccountChange}
                          error={!!errors.newPassword}
                          disabled={loading}
                        />
                        {errors.newPassword && (
                          <p className="settings-form__error"><AlertIcon />{errors.newPassword}</p>
                        )}
                      </div>

                      <div className="settings-form__group">
                        <label htmlFor="confirmPassword" className="settings-form__label">Confirm New Password</label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={accountData.confirmPassword}
                          onChange={handleAccountChange}
                          error={!!errors.confirmPassword}
                          disabled={loading}
                        />
                        {errors.confirmPassword && (
                          <p className="settings-form__error"><AlertIcon />{errors.confirmPassword}</p>
                        )}
                      </div>

                      <div className="settings-form__actions">
                        <Button type="submit" variant="primary" loading={loading}>
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <>
                  <div className="settings-section">
                    <div className="settings-section__header">
                      <h2 className="settings-section__title">Timezone</h2>
                      <p className="settings-section__description">Set your local timezone for accurate timestamps</p>
                    </div>

                    <form className="settings-form" onSubmit={handlePreferencesSubmit}>
                      <div className="settings-form__group">
                        <label htmlFor="timezone" className="settings-form__label">Timezone</label>
                        <Select
                          id="timezone"
                          name="timezone"
                          value={preferencesData.timezone}
                          onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          disabled={loading}
                        >
                          {timezones.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="settings-section">
                        <div className="settings-section__header">
                          <h2 className="settings-section__title">Notifications</h2>
                          <p className="settings-section__description">Manage how you receive notifications</p>
                        </div>

                        <div className="settings-toggle-group">
                          <div className="settings-toggle-item">
                            <div className="settings-toggle-item__content">
                              <h3 className="settings-toggle-item__title">Email Notifications</h3>
                              <p className="settings-toggle-item__description">
                                Receive email updates about your account activity
                              </p>
                            </div>
                            <div className="settings-toggle-item__control">
                              <Toggle
                                checked={preferencesData.emailNotifications}
                                onChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="settings-toggle-item">
                            <div className="settings-toggle-item__content">
                              <h3 className="settings-toggle-item__title">Push Notifications</h3>
                              <p className="settings-toggle-item__description">
                                Get push notifications on your devices
                              </p>
                            </div>
                            <div className="settings-toggle-item__control">
                              <Toggle
                                checked={preferencesData.pushNotifications}
                                onChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="settings-toggle-item">
                            <div className="settings-toggle-item__content">
                              <h3 className="settings-toggle-item__title">Marketing Emails</h3>
                              <p className="settings-toggle-item__description">
                                Receive emails about new features and updates
                              </p>
                            </div>
                            <div className="settings-toggle-item__control">
                              <Toggle
                                checked={preferencesData.marketingEmails}
                                onChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="settings-toggle-item">
                            <div className="settings-toggle-item__content">
                              <h3 className="settings-toggle-item__title">Weekly Reports</h3>
                              <p className="settings-toggle-item__description">
                                Get weekly performance reports via email
                              </p>
                            </div>
                            <div className="settings-toggle-item__control">
                              <Toggle
                                checked={preferencesData.weeklyReports}
                                onChange={(checked) => handlePreferenceChange('weeklyReports', checked)}
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="settings-form__actions">
                        <Button type="submit" variant="primary" loading={loading}>
                          Save Preferences
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {/* Business Info Tab */}
              {activeTab === 'business' && (
                <>
                  <div className="settings-info-card">
                    <div className="settings-info-card__icon">
                      <InfoIcon />
                    </div>
                    <div className="settings-info-card__content">
                      <p className="settings-info-card__title">Why we need this information</p>
                      <p className="settings-info-card__text">
                        Business information helps us provide better recommendations and tailor the platform to your needs.
                      </p>
                    </div>
                  </div>

                  <div className="settings-section">
                    <div className="settings-section__header">
                      <h2 className="settings-section__title">Company Details</h2>
                    </div>

                    <form className="settings-form" onSubmit={handleBusinessSubmit}>
                      <div className="settings-form__group">
                        <label htmlFor="companyName" className="settings-form__label">Company Name</label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={businessData.companyName}
                          onChange={handleBusinessChange}
                          placeholder="Your company name"
                          disabled={loading}
                        />
                      </div>

                      <div className="settings-form__row">
                        <div className="settings-form__group">
                          <label htmlFor="industry" className="settings-form__label">Industry</label>
                          <Select
                            id="industry"
                            name="industry"
                            value={businessData.industry}
                            onChange={handleBusinessChange}
                            disabled={loading}
                            placeholder="Select industry"
                          >
                            {industries.map((industry) => (
                              <option key={industry.value} value={industry.value}>
                                {industry.label}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="settings-form__group">
                          <label htmlFor="companySize" className="settings-form__label">Company Size</label>
                          <Select
                            id="companySize"
                            name="companySize"
                            value={businessData.companySize}
                            onChange={handleBusinessChange}
                            disabled={loading}
                            placeholder="Select size"
                          >
                            {companySizes.map((size) => (
                              <option key={size.value} value={size.value}>
                                {size.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      <div className="settings-form__group">
                        <label htmlFor="website" className="settings-form__label">Website</label>
                        <Input
                          id="website"
                          name="website"
                          type="url"
                          value={businessData.website}
                          onChange={handleBusinessChange}
                          placeholder="https://yourcompany.com"
                          disabled={loading}
                        />
                        <p className="settings-form__helper">Your company website URL</p>
                      </div>

                      <div className="settings-form__actions">
                        <Button type="submit" variant="primary" loading={loading}>
                          Save Business Info
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

SettingsPage.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    bio: PropTypes.string,
    timezone: PropTypes.string,
    emailNotifications: PropTypes.bool,
    pushNotifications: PropTypes.bool,
    marketingEmails: PropTypes.bool,
    weeklyReports: PropTypes.bool,
    industry: PropTypes.string,
    companySize: PropTypes.string,
    companyName: PropTypes.string,
    website: PropTypes.string,
  }),
  onUpdate: PropTypes.func,
  className: PropTypes.string,
};

export default SettingsPage;
export { SettingsPage };