// =============================================================================
// AI FUNNEL PLATFORM - RouteGuard (Production Simplified)
// =============================================================================
// Advanced route protection with role/permission checks
// =============================================================================

import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/common/LoadingScreen';

/**
 * RouteGuard Component
 * 
 * Advanced protection with role and permission checks
 * 
 * @param {Array} allowedRoles - Allowed user roles ['admin', 'creator']
 * @param {Array} requiredPermissions - Required permissions ['create_funnel']
 * @param {string} minSubscriptionTier - Minimum subscription tier required
 * @param {string} redirectTo - Path to redirect on access denial
 * 
 * @example
 * // Admin only
 * <Route element={<RouteGuard allowedRoles={['admin']} />}>
 *   <Route path="/admin/*" element={<AdminDashboard />} />
 * </Route>
 * 
 * // Premium feature
 * <Route element={<RouteGuard minSubscriptionTier="professional" />}>
 *   <Route path="/analytics/advanced" element={<AdvancedAnalytics />} />
 * </Route>
 */
const RouteGuard = ({ 
  allowedRoles = [], 
  requiredPermissions = [],
  minSubscriptionTier = null,
  redirectTo = '/access-denied' 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check roles
  if (allowedRoles.length > 0) {
    const userRole = user?.user_type || user?.role;
    const hasRole = allowedRoles.includes(userRole);
    
    if (!hasRole) {
      return (
        <Navigate 
          to={redirectTo} 
          replace 
          state={{ 
            reason: 'insufficient_role',
            requiredRoles: allowedRoles,
            userRole 
          }} 
        />
      );
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const hasAllPermissions = requiredPermissions.every(perm => 
      userPermissions.includes(perm)
    );
    
    if (!hasAllPermissions) {
      return (
        <Navigate 
          to={redirectTo} 
          replace 
          state={{ 
            reason: 'insufficient_permissions',
            requiredPermissions 
          }} 
        />
      );
    }
  }

  // Check subscription tier
  if (minSubscriptionTier) {
    const tierLevels = {
      free: 1,
      starter: 2,
      professional: 3,
      enterprise: 4
    };
    
    const userTier = user?.subscription_tier || 'free';
    const userLevel = tierLevels[userTier.toLowerCase()] || 1;
    const requiredLevel = tierLevels[minSubscriptionTier.toLowerCase()] || 1;
    
    if (userLevel < requiredLevel) {
      return (
        <Navigate 
          to="/upgrade" 
          replace 
          state={{ 
            reason: 'insufficient_tier',
            requiredTier: minSubscriptionTier,
            currentTier: userTier 
          }} 
        />
      );
    }
  }

  // Render protected content
  return <Outlet />;
};

export default RouteGuard;
