// =============================================================================
// AI FUNNEL PLATFORM - AccountPage Component (Enhanced Production)
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input, Button, Tabs, Tab } from '../../../components/ui';
import { updateProfile, changePassword, verifyEmail, deleteAccount, uploadAvatar } from '../../../api/users.api';

// =============================================================================
// ENHANCED STYLES
// =============================================================================

const ACCOUNT_PAGE_STYLES = `
/* Account Page Container */
.account-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 2rem;
}

.account-page__inner {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.account-header {
  margin-bottom: 2rem;
}

.account-header__title {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.account-header__subtitle {
  font-size: 0.938rem;
  color: #6b7280;
  margin: 0;
}

/* Card */
.account-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

/* Tabs */
.account-tabs {
  border-bottom: 2px solid #f3f4f6;
  padding: 0 2rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.account-tabs::-webkit-scrollbar {
  display: none;
}

.account-tab {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  font-size: 0.938rem;
  font-weight: 600;
  color: #6b7280;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  margin-bottom: -2px;
}

.account-tab:hover {
  color: #667eea;
  background-color: #f9fafb;
}

.account-tab--active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.account-tab__icon {
  display: flex;
  align-items: center;
}

.account-tab__icon svg {
  width: 20px;
  height: 20px;
}

/* Content */
.account-content {
  padding: 2.5rem 2rem;
}

/* Section */
.account-section {
  margin-bottom: 3rem;
}

.account-section:last-child {
  margin-bottom: 0;
}

.account-section__header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.account-section__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.account-section__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* Form */
.account-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.account-form__group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.account-form__label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
}

.account-form__helper {
  font-size: 0.813rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.account-form__error {
  font-size: 0.813rem;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.account-form__error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.account-form__row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.account-form__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 2px solid #f3f4f6;
  margin-top: 0.5rem;
}

/* Avatar */
.account-avatar {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.account-avatar__preview {
  position: relative;
  flex-shrink: 0;
}

.account-avatar__image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.account-avatar__placeholder {
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

.account-avatar__edit {
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

.account-avatar__edit:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.account-avatar__edit svg {
  width: 18px;
  height: 18px;
}

.account-avatar__input {
  display: none;
}

.account-avatar__info {
  flex: 1;
}

.account-avatar__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

/* Email Verification */
.account-verification {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1.5px solid #fbbf24;
  border-radius: 12px;
}

.account-verification--verified {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-color: #34d399;
}

.account-verification__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
}

.account-verification__icon svg {
  width: 20px;
  height: 20px;
}

.account-verification__icon--warning {
  color: #f59e0b;
}

.account-verification__icon--success {
  color: #059669;
}

.account-verification__content {
  flex: 1;
}

.account-verification__title {
  font-size: 0.938rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.account-verification__title--warning {
  color: #92400e;
}

.account-verification__title--success {
  color: #065f46;
}

.account-verification__text {
  font-size: 0.813rem;
  margin: 0;
  line-height: 1.5;
}

.account-verification__text--warning {
  color: #78350f;
}

.account-verification__text--success {
  color: #064e3b;
}

.account-verification__action {
  flex-shrink: 0;
}

/* Alert */
.account-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: account-alert-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes account-alert-enter {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.account-alert--error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
}

.account-alert--success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1.5px solid #6ee7b7;
}

.account-alert__icon {
  flex-shrink: 0;
}

.account-alert--error .account-alert__icon {
  color: #dc2626;
}

.account-alert--success .account-alert__icon {
  color: #059669;
}

.account-alert__icon svg {
  width: 20px;
  height: 20px;
}

.account-alert__content {
  flex: 1;
}

.account-alert__title {
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.account-alert--error .account-alert__title {
  color: #991b1b;
}

.account-alert--success .account-alert__title {
  color: #065f46;
}

.account-alert__message {
  font-size: 0.813rem;
  margin: 0;
}

.account-alert--error .account-alert__message {
  color: #7f1d1d;
}

.account-alert--success .account-alert__message {
  color: #064e3b;
}

/* Danger Zone */
.account-danger {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 2px solid #fca5a5;
  border-radius: 12px;
  padding: 1.5rem;
}

.account-danger__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.account-danger__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  color: #dc2626;
}

.account-danger__icon svg {
  width: 24px;
  height: 24px;
}

.account-danger__content {
  flex: 1;
}

.account-danger__title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #991b1b;
  margin: 0 0 0.5rem 0;
}

.account-danger__description {
  font-size: 0.875rem;
  color: #7f1d1d;
  margin: 0 0 0.75rem 0;
  line-height: 1.6;
}

.account-danger__list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.account-danger__list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: #7f1d1d;
  font-weight: 500;
}

.account-danger__list-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #dc2626;
}

/* Confirmation Modal */
.account-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: account-modal-enter 0.3s ease-out;
}

@keyframes account-modal-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.account-modal__content {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: account-modal-content-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes account-modal-content-enter {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.account-modal__header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.account-modal__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
}

.account-modal__icon svg {
  width: 28px;
  height: 28px;
}

.account-modal__header-content {
  flex: 1;
}

.account-modal__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.account-modal__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.account-modal__body {
  margin-bottom: 1.5rem;
}

.account-modal__footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .account-page {
    padding: 1.5rem 1rem;
  }
  
  .account-header__title {
    font-size: 1.75rem;
  }
  
  .account-tabs {
    padding: 0 1rem;
  }
  
  .account-content {
    padding: 2rem 1.5rem;
  }
  
  .account-form__row {
    grid-template-columns: 1fr;
  }
  
  .account-avatar {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .account-form__actions {
    flex-direction: column;
  }
  
  .account-form__actions button {
    width: 100%;
  }
  
  .account-modal {
    padding: 1rem;
  }
  
  .account-modal__content {
    padding: 1.5rem;
  }
  
  .account-modal__footer {
    flex-direction: column-reverse;
  }
  
  .account-modal__footer button {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .account-alert,
  .account-modal,
  .account-modal__content {
    animation: none !important;
  }
}
`;

// Inject styles
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const styleElement = document.createElement('style');
  styleElement.setAttribute('data-component', 'account-page');
  styleElement.textContent = ACCOUNT_PAGE_STYLES;
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

const BellIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TrashIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

const XIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// =============================================================================
// COMPONENT
// =============================================================================

const AccountPage = ({
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
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
      setAlert({ type: 'success', title: 'Avatar Updated', message: 'Your profile picture has been updated successfully' });
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
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Minimum 8 characters required';
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      await changePassword(passwordData);
      setAlert({ type: 'success', title: 'Password Changed', message: 'Your password has been changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setAlert({ type: 'error', title: 'Change Failed', message: error.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setLoading(true);
    try {
      await verifyEmail();
      setAlert({ type: 'success', title: 'Verification Sent', message: 'Check your email for verification link' });
    } catch (error) {
      setAlert({ type: 'error', title: 'Failed', message: error.response?.data?.message || 'Failed to send verification' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccount();
      window.location.href = '/';
    } catch (error) {
      setAlert({ type: 'error', title: 'Delete Failed', message: error.response?.data?.message || 'Failed to delete account' });
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserIcon /> },
    { id: 'security', label: 'Security', icon: <ShieldIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    { id: 'danger', label: 'Danger Zone', icon: <TrashIcon /> },
  ];

  return (
    <div className={`account-page ${className}`} {...props}>
      <div className="account-page__inner">
        <div className="account-header">
          <h1 className="account-header__title">Account Settings</h1>
          <p className="account-header__subtitle">Manage your account preferences and settings</p>
        </div>

        <div className="account-card">
          <div className="account-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`account-tab ${activeTab === tab.id ? 'account-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="account-tab__icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="account-content">
            {alert && (
              <div className={`account-alert account-alert--${alert.type}`}>
                <div className="account-alert__icon">
                  {alert.type === 'success' ? <CheckCircleIcon /> : <AlertIcon />}
                </div>
                <div className="account-alert__content">
                  <p className="account-alert__title">{alert.title}</p>
                  <p className="account-alert__message">{alert.message}</p>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <div className="account-section">
                  <div className="account-section__header">
                    <h2 className="account-section__title">Profile Picture</h2>
                    <p className="account-section__description">Update your avatar and personal details</p>
                  </div>

                  <div className="account-avatar">
                    <div className="account-avatar__preview">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="account-avatar__image" />
                      ) : (
                        <div className="account-avatar__placeholder">
                          {profileData.firstName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <button type="button" className="account-avatar__edit" onClick={handleAvatarClick}>
                        <CameraIcon />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="account-avatar__input"
                      />
                    </div>
                    <div className="account-avatar__info">
                      <h3 className="account-section__title">Upload Photo</h3>
                      <p className="account-form__helper">JPG, PNG or GIF. Max size 5MB.</p>
                      <div className="account-avatar__actions">
                        <Button size="sm" variant="outline" onClick={handleAvatarClick} disabled={loading}>
                          Change Avatar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="account-section">
                  <div className="account-section__header">
                    <h2 className="account-section__title">Personal Information</h2>
                  </div>

                  <form className="account-form" onSubmit={handleProfileSubmit}>
                    <div className="account-form__row">
                      <div className="account-form__group">
                        <label htmlFor="firstName" className="account-form__label">First Name</label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleProfileChange}
                          disabled={loading}
                        />
                      </div>
                      <div className="account-form__group">
                        <label htmlFor="lastName" className="account-form__label">Last Name</label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleProfileChange}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="account-form__group">
                      <label htmlFor="email" className="account-form__label">Email Address</label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="account-form__actions">
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

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <div className="account-section">
                  <div className="account-section__header">
                    <h2 className="account-section__title">Email Verification</h2>
                  </div>

                  <div className={`account-verification ${user?.emailVerified ? 'account-verification--verified' : ''}`}>
                    <div className="account-verification__icon">
                      {user?.emailVerified ? (
                        <CheckCircleIcon className="account-verification__icon--success" />
                      ) : (
                        <AlertIcon className="account-verification__icon--warning" />
                      )}
                    </div>
                    <div className="account-verification__content">
                      <p className={`account-verification__title ${user?.emailVerified ? 'account-verification__title--success' : 'account-verification__title--warning'}`}>
                        {user?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                      </p>
                      <p className={`account-verification__text ${user?.emailVerified ? 'account-verification__text--success' : 'account-verification__text--warning'}`}>
                        {user?.emailVerified ? 'Your email address has been verified.' : 'Please verify your email to unlock all features.'}
                      </p>
                    </div>
                    {!user?.emailVerified && (
                      <div className="account-verification__action">
                        <Button size="sm" variant="outline" onClick={handleVerifyEmail} loading={loading}>
                          Verify Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="account-section">
                  <div className="account-section__header">
                    <h2 className="account-section__title">Change Password</h2>
                    <p className="account-section__description">Ensure your account is using a strong password</p>
                  </div>

                  <form className="account-form" onSubmit={handlePasswordSubmit}>
                    <div className="account-form__group">
                      <label htmlFor="currentPassword" className="account-form__label">Current Password</label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.currentPassword}
                        disabled={loading}
                      />
                      {errors.currentPassword && (
                        <p className="account-form__error"><AlertIcon />{errors.currentPassword}</p>
                      )}
                    </div>

                    <div className="account-form__group">
                      <label htmlFor="newPassword" className="account-form__label">New Password</label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.newPassword}
                        disabled={loading}
                      />
                      {errors.newPassword && (
                        <p className="account-form__error"><AlertIcon />{errors.newPassword}</p>
                      )}
                    </div>

                    <div className="account-form__group">
                      <label htmlFor="confirmPassword" className="account-form__label">Confirm New Password</label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        error={!!errors.confirmPassword}
                        disabled={loading}
                      />
                      {errors.confirmPassword && (
                        <p className="account-form__error"><AlertIcon />{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="account-form__actions">
                      <Button type="submit" variant="primary" loading={loading}>
                        Update Password
                      </Button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="account-section">
                <div className="account-section__header">
                  <h2 className="account-section__title">Email Notifications</h2>
                  <p className="account-section__description">Manage your notification preferences</p>
                </div>
                <p className="account-form__helper">Notification settings coming soon...</p>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="account-section">
                <div className="account-section__header">
                  <h2 className="account-section__title">Danger Zone</h2>
                  <p className="account-section__description">Irreversible actions for your account</p>
                </div>

                <div className="account-danger">
                  <div className="account-danger__header">
                    <div className="account-danger__icon">
                      <AlertIcon />
                    </div>
                    <div className="account-danger__content">
                      <h3 className="account-danger__title">Delete Account</h3>
                      <p className="account-danger__description">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <ul className="account-danger__list">
                        <li className="account-danger__list-item">
                          <XIcon />
                          All your data will be permanently deleted
                        </li>
                        <li className="account-danger__list-item">
                          <XIcon />
                          You will lose access to all your funnels
                        </li>
                        <li className="account-danger__list-item">
                          <XIcon />
                          This action cannot be undone
                        </li>
                      </ul>
                      <Button variant="danger" onClick={() => setShowDeleteModal(true)} disabled={loading}>
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="account-modal" onClick={() => setShowDeleteModal(false)}>
          <div className="account-modal__content" onClick={(e) => e.stopPropagation()}>
            <div className="account-modal__header">
              <div className="account-modal__icon">
                <AlertIcon />
              </div>
              <div className="account-modal__header-content">
                <h3 className="account-modal__title">Delete Account?</h3>
                <p className="account-modal__description">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="account-modal__footer">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount} loading={loading}>
                Yes, Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

AccountPage.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    emailVerified: PropTypes.bool,
  }),
  onUpdate: PropTypes.func,
  className: PropTypes.string,
};

export default AccountPage;
export { AccountPage };
