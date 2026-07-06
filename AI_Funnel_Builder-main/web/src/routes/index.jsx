// =============================================================================
// AI FUNNEL PLATFORM - MAIN ROUTES (PRD-Aligned V1)
// =============================================================================
// User Journey: Signup → Onboarding → Project → Group → Funnel → Deploy → Leads
// =============================================================================

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OnboardingLayout from '@/components/layout/OnboardingLayout';
import WizardLayout from '@/components/layout/WizardLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import OnboardingRoute from './OnboardingRoute';
import RouteGuard from './RouteGuard';

// Common Components
import LoadingScreen from '@/components/common/LoadingScreen';
import ErrorBoundary from '@/components/common/ErrorBoundary';

// ✅ FIX: Import individual route groups instead of flat ROUTES
import {
  AUTH_ROUTES,
  ONBOARDING_ROUTES,
  DASHBOARD_ROUTES,
  PROJECT_ROUTES,
  GROUP_ROUTES,
  FUNNEL_ROUTES,
  LEAD_ROUTES,
  ANALYTICS_ROUTES,
  AI_ROUTES,
  SETTINGS_ROUTES,
  PUBLIC_ROUTES,
  SPECIAL_ROUTES,
} from '@/lib/constants/routes';

// =============================================================================
// LAZY LOADED PAGES
// =============================================================================

// ============= PUBLIC =============
const LandingPage = lazy(() => import('@/features/public/pages/LandingPage'));
const PublicFunnelPage = lazy(() => import('@/features/public/pages/PublicFunnelPage'));

// ============= AUTH =============
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const AccountPage = lazy(() => import('@/features/auth/pages/AccountPage'));

// ============= ACCESS & UPGRADE =============
const AccessDeniedPage = lazy(() => import('@/pages/AccessDeniedPage'));
const UpgradePage = lazy(() => import('@/pages/UpgradePage'));

// ============= ONBOARDING (STEP 1 & 2) =============
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/OnboardingPage'));

// ============= DASHBOARD (HOME / COMMAND CENTER) =============
const DashboardPage = lazy(() => import('@/features/funnels/pages/DashboardPage'));

// ============= PROJECTS (STEP 1: PROJECT SELECT/CREATE) =============
const ProjectsPage = lazy(() => import('@/features/projects/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/features/projects/pages/ProjectDetailPage'));

// ============= GROUPS (STEP 2: CREATE GROUP) =============
const GroupsPage = lazy(() => import('@/features/groups/pages/GroupsPage'));
const GroupDetailPage = lazy(() => import('@/features/groups/pages/GroupDetailPage'));

// ============= FUNNELS (STEP 3-6: CORE BUILDER) =============
const FunnelListPage = lazy(() => import('@/features/funnels/pages/FunnelListPage'));
const FunnelWizardPage = lazy(() => import('@/features/funnels/pages/FunnelWizardPage'));
const FunnelDetailPage = lazy(() => import('@/features/funnels/pages/FunnelDetailPage'));
const FunnelFlowPage = lazy(() => import('@/features/funnels/pages/FunnelFlowPage'));
const FunnelQuestionsPage = lazy(() => import('@/features/funnels/pages/FunnelQuestionsPage'));
const FunnelResultPageEditor = lazy(() => import('@/features/funnels/pages/FunnelResultPageEditor'));
const FunnelPublishPage = lazy(() => import('@/features/funnels/pages/FunnelPublishPage'));
const FunnelAnalyticsPage = lazy(() => import('@/features/funnels/pages/FunnelAnalyticsPage'));

// ============= LEADS (STEP 7: LEADS & INSIGHTS) =============
const LeadsPage = lazy(() => import('@/features/leads/pages/LeadsPage'));
const LeadDetailPage = lazy(() => import('@/features/leads/pages/LeadDetailPage'));

// ============= ANALYTICS (PREMIUM) =============
const AnalyticsOverviewPage = lazy(() => import('@/features/analytics/pages/AnalyticsOverviewPage'));

// ============= AI TOOLS (OPTIONAL) =============
const AIToolsPage = lazy(() => import('@/features/ai/pages/AIToolsPage'));

// ============= SETTINGS =============
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));

// =============================================================================
// SUSPENSE WRAPPER
// =============================================================================

const SuspenseRoute = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// =============================================================================
// APP ROUTES - PRD WORKFLOW OPTIMIZED
// =============================================================================

const AppRoutes = () => {
  return (
    <Routes>
      {/* ================================================================== */}
      {/* 🌍 PUBLIC ROUTES (Landing, Public Funnels, Auth) */}
      {/* ================================================================== */}
      <Route element={<PublicRoute />}>
        {/* Public Pages with Layout */}
        <Route element={<PublicLayout />}>
          {/* Landing Page */}
          <Route 
            index
            element={
              <SuspenseRoute>
                <LandingPage />
              </SuspenseRoute>
            } 
          />
          
          {/* Public Funnel View */}
          <Route 
            path={PUBLIC_ROUTES.FUNNEL}
            element={
              <SuspenseRoute>
                <PublicFunnelPage />
              </SuspenseRoute>
            } 
          />
        </Route>

        {/* Auth Pages (Full Screen - No Layout) */}
        <Route 
          path={AUTH_ROUTES.LOGIN}
          element={
            <SuspenseRoute>
              <LoginPage />
            </SuspenseRoute>
          } 
        />
        <Route 
          path={AUTH_ROUTES.SIGNUP}
          element={
            <SuspenseRoute>
              <SignupPage />
            </SuspenseRoute>
          } 
        />
        <Route 
          path={AUTH_ROUTES.FORGOT_PASSWORD}
          element={
            <SuspenseRoute>
              <ForgotPasswordPage />
            </SuspenseRoute>
          } 
        />
      </Route>

      {/* ================================================================== */}
      {/* 🚀 ONBOARDING (STEP 1 & 2: First Time Setup) */}
      {/* ================================================================== */}
      <Route element={<OnboardingRoute />}>
        <Route element={<OnboardingLayout />}>
          <Route 
            path={ONBOARDING_ROUTES.ROOT}
            element={
              <SuspenseRoute>
                <OnboardingPage />
              </SuspenseRoute>
            } 
          />
        </Route>
      </Route>

      {/* ================================================================== */}
      {/* 🚫 ACCESS & UPGRADE PAGES */}
      {/* ================================================================== */}
      <Route 
        path="/access-denied"
        element={
          <SuspenseRoute>
            <AccessDeniedPage />
          </SuspenseRoute>
        } 
      />
      <Route 
        path="/upgrade"
        element={
          <SuspenseRoute>
            <UpgradePage />
          </SuspenseRoute>
        } 
      />
      <Route 
        path={SPECIAL_ROUTES.PRICING}
        element={
          <SuspenseRoute>
            <UpgradePage />
          </SuspenseRoute>
        } 
      />

      {/* ================================================================== */}
      {/* 🔐 PROTECTED ROUTES (Requires Authentication) */}
      {/* ================================================================== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* ============================================================ */}
          {/* 📊 DASHBOARD (Command Center) */}
          {/* ============================================================ */}
          <Route 
            path={DASHBOARD_ROUTES.ROOT}
            element={
              <SuspenseRoute>
                <DashboardPage />
              </SuspenseRoute>
            } 
          />

          {/* ============================================================ */}
          {/* 📁 PROJECTS */}
          {/* ============================================================ */}
          <Route 
            path={PROJECT_ROUTES.LIST}
            element={
              <SuspenseRoute>
                <ProjectsPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={PROJECT_ROUTES.DETAIL}
            element={
              <SuspenseRoute>
                <ProjectDetailPage />
              </SuspenseRoute>
            } 
          />

          {/* ============================================================ */}
          {/* 📂 GROUPS */}
          {/* ============================================================ */}
          <Route 
            path={GROUP_ROUTES.LIST}
            element={
              <SuspenseRoute>
                <GroupsPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={GROUP_ROUTES.DETAIL}
            element={
              <SuspenseRoute>
                <GroupDetailPage />
              </SuspenseRoute>
            } 
          />

          {/* ============================================================ */}
          {/* 🎯 FUNNELS - List & Detail */}
          {/* ============================================================ */}
          <Route 
            path={FUNNEL_ROUTES.LIST}
            element={
              <SuspenseRoute>
                <FunnelListPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={FUNNEL_ROUTES.DETAIL}
            element={
              <SuspenseRoute>
                <FunnelDetailPage />
              </SuspenseRoute>
            } 
          />
          
          {/* Funnel Editor Pages */}
          <Route 
            path={FUNNEL_ROUTES.FLOW}
            element={
              <SuspenseRoute>
                <FunnelFlowPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={FUNNEL_ROUTES.QUESTIONS}
            element={
              <SuspenseRoute>
                <FunnelQuestionsPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={FUNNEL_ROUTES.RESULT_PAGE}
            element={
              <SuspenseRoute>
                <FunnelResultPageEditor />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={FUNNEL_ROUTES.PUBLISH}
            element={
              <SuspenseRoute>
                <FunnelPublishPage />
              </SuspenseRoute>
            } 
          />

          {/* ============================================================ */}
          {/* 👥 LEADS */}
          {/* ============================================================ */}
          <Route 
            path={LEAD_ROUTES.LIST}
            element={
              <SuspenseRoute>
                <LeadsPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={LEAD_ROUTES.DETAIL}
            element={
              <SuspenseRoute>
                <LeadDetailPage />
              </SuspenseRoute>
            } 
          />

          {/* ============================================================ */}
          {/* 🤖 AI TOOLS */}
          {/* ============================================================ */}
          <Route 
            path={AI_ROUTES.ROOT}
            element={
              <SuspenseRoute>
                <AIToolsPage />
              </SuspenseRoute>
            } 
          />

          {/* ============================================================ */}
          {/* ⚙️ SETTINGS & ACCOUNT */}
          {/* ============================================================ */}
          <Route 
            path={SETTINGS_ROUTES.ROOT}
            element={
              <SuspenseRoute>
                <SettingsPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={SETTINGS_ROUTES.PROFILE}
            element={
              <SuspenseRoute>
                <AccountPage />
              </SuspenseRoute>
            } 
          />
        </Route>

        {/* ============================================================ */}
        {/* 🎯 FUNNEL WIZARD (Separate Layout) */}
        {/* ============================================================ */}
        <Route element={<WizardLayout />}>
          <Route 
            path={FUNNEL_ROUTES.CREATE}
            element={
              <SuspenseRoute>
                <FunnelWizardPage />
              </SuspenseRoute>
            } 
          />
          <Route 
            path={FUNNEL_ROUTES.WIZARD}
            element={
              <SuspenseRoute>
                <FunnelWizardPage />
              </SuspenseRoute>
            } 
          />
        </Route>

        {/* ============================================================ */}
        {/* 💎 PREMIUM FEATURES */}
        {/* ============================================================ */}
        <Route element={<RouteGuard minSubscriptionTier="professional" />}>
          <Route element={<DashboardLayout />}>
            <Route 
              path={ANALYTICS_ROUTES.ROOT}
              element={
                <SuspenseRoute>
                  <AnalyticsOverviewPage />
                </SuspenseRoute>
              } 
            />
            <Route 
              path={ANALYTICS_ROUTES.FUNNEL}
              element={
                <SuspenseRoute>
                  <FunnelAnalyticsPage />
                </SuspenseRoute>
              } 
            />
          </Route>
        </Route>
      </Route>

      {/* ================================================================== */}
      {/* 🔄 LEGACY REDIRECTS */}
      {/* ================================================================== */}
      <Route path="/onboarding/profile" element={<Navigate to={ONBOARDING_ROUTES.ROOT} replace />} />
      <Route path="/profile" element={<Navigate to={SETTINGS_ROUTES.PROFILE} replace />} />
      <Route path="/home" element={<Navigate to={DASHBOARD_ROUTES.ROOT} replace />} />
      <Route path="/billing" element={<Navigate to="/upgrade" />} replace />
      <Route path="/plans" element={<Navigate to={SPECIAL_ROUTES.PRICING} replace />} />

      {/* ================================================================== */}
      {/* 404 - CATCH ALL */}
      {/* ================================================================== */}
      <Route 
        path="*" 
        element={<Navigate to={DASHBOARD_ROUTES.ROOT} replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;
