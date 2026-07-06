# =============================================================================
# AI FUNNEL BUILDER - USER ENDPOINTS (PRODUCTION GRADE)
# =============================================================================
# User profile and management endpoints
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.services.user_service import UserService
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserPreferencesUpdate,
)
from app.utils.logger import get_logger
from app.core.dependencies import get_current_user

logger = get_logger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


# =============================================================================
# CURRENT USER
# =============================================================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User",
    description="Get currently authenticated user profile"
)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),  # ✅ Returns dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user's profile.
    
    Returns:
        User profile data
    """
    try:
        user_service = UserService(db)
        
        # ✅ FIXED: Remove include_subscription parameter
        user = await user_service.get_user_by_id(current_user["user_id"])
        
        logger.info(f"User profile fetched: {user.email}")
        
        # Return user data
        return {
            "id": str(user.user_id),
            "email": user.email,
            "full_name": user.full_name,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "website": user.website,
            "user_type": user.user_type.value if hasattr(user.user_type, 'value') else user.user_type,
            "subscription_tier": user.subscription_tier.value if hasattr(user.subscription_tier, 'value') else user.subscription_tier,
            "company_name": user.company_name,
            "is_active": user.is_active,
            "is_verified": user.is_email_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile"
        )


@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Profile",
    description="Update authenticated user profile"
)
async def update_profile(
    data: UserUpdate,
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile.
    
    Args:
        data: Profile update data
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Updated user profile
    """
    user_service = UserService(db)
    
    user = await user_service.update_user(
        user_id=current_user["user_id"],  # ✅ Access as dict
        data=data
    )
    
    return user


@router.delete(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Delete Account",
    description="Delete user account (soft delete)"
)
async def delete_account(
    hard_delete: bool = False,
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Delete user account.
    
    Args:
        hard_delete: Permanently delete (GDPR right to erasure)
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Deletion confirmation
    """
    user_service = UserService(db)
    
    await user_service.delete_user(
        user_id=current_user["user_id"],  # ✅ Access as dict
        hard_delete=hard_delete
    )
    
    return {
        "message": "Account deleted successfully",
        "permanent": hard_delete
    }


# =============================================================================
# USER STATISTICS
# =============================================================================

@router.get(
    "/me/stats",
    status_code=status.HTTP_200_OK,
    summary="User Statistics",
    description="Get user usage statistics"
)
async def get_user_stats(
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Get user statistics.
    
    Args:
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        User statistics including funnels, leads, views, etc.
    """
    user_service = UserService(db)
    
    stats = await user_service.get_user_statistics(current_user["user_id"])
    
    return stats


# =============================================================================
# PREFERENCES
# =============================================================================

@router.patch(
    "/me/preferences",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Preferences",
    description="Update user preferences and settings"
)
async def update_preferences(
    data: UserPreferencesUpdate,
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Update user preferences.
    
    Args:
        data: Preference update data
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Updated user profile
    """
    user_service = UserService(db)
    
    # ✅ Already has await
    user = await user_service.update_preferences(
        user_id=current_user["user_id"],  # ✅ Access as dict
        data=data
    )
    
    return user


# =============================================================================
# AVATAR
# =============================================================================

@router.post(
    "/me/avatar",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload Avatar",
    description="Upload user avatar image"
)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Upload user avatar.
    
    Args:
        file: Avatar image file
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Updated user profile with new avatar
    
    TODO: Implement actual file upload to S3/Cloud Storage
    """
    user_service = UserService(db)
    
    # ✅ FIXED: Access email from dict
    # TODO: Replace with actual S3 upload
    avatar_url = f"https://api.dicebear.com/7.x/initials/svg?seed={current_user['email']}"
    
    user = await user_service.update_avatar(
        user_id=current_user["user_id"],  # ✅ Access as dict
        avatar_url=avatar_url
    )
    
    logger.info(f"Avatar updated for user: {current_user['email']}")
    
    return user


@router.delete(
    "/me/avatar",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Delete Avatar",
    description="Remove user avatar"
)
async def delete_avatar(
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Delete user avatar.
    
    Args:
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Updated user profile without avatar
    """
    user_service = UserService(db)
    
    user = await user_service.delete_avatar(current_user["user_id"])
    
    logger.info(f"Avatar deleted for user: {current_user['email']}")
    
    return user


# =============================================================================
# DATA EXPORT (GDPR COMPLIANCE)
# =============================================================================

@router.get(
    "/me/export",
    status_code=status.HTTP_200_OK,
    summary="Export User Data",
    description="Export all user data (GDPR compliance - Right to Data Portability)"
)
async def export_user_data(
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Export all user data (GDPR Article 20 - Right to Data Portability).
    
    Includes:
    - User profile
    - Funnels
    - Responses
    - Leads
    - Events
    - Campaigns
    - Integrations
    - Statistics
    
    Args:
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Complete user data export in JSON format
    """
    user_service = UserService(db)
    
    data = await user_service.export_user_data(current_user["user_id"])
    
    logger.info(
        f"GDPR data export completed for user: {current_user['email']}",
        extra={
            "user_id": current_user["user_id"],
            "export_size": len(str(data))
        }
    )
    
    return data


# =============================================================================
# ACCOUNT ACTIONS
# =============================================================================

@router.post(
    "/me/deactivate",
    status_code=status.HTTP_200_OK,
    summary="Deactivate Account",
    description="Temporarily deactivate user account (reversible)"
)
async def deactivate_account(
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate user account (reversible).
    
    Args:
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Deactivation confirmation
    """
    user_service = UserService(db)
    
    await user_service.deactivate_account(current_user["user_id"])
    
    logger.warning(f"Account deactivated: {current_user['email']}")
    
    return {
        "message": "Account deactivated successfully",
        "reversible": True
    }


@router.post(
    "/me/reactivate",
    status_code=status.HTTP_200_OK,
    summary="Reactivate Account",
    description="Reactivate previously deactivated account"
)
async def reactivate_account(
    current_user: dict = Depends(get_current_user),  # ✅ dict from JWT
    db: AsyncSession = Depends(get_db)
):
    """
    Reactivate user account.
    
    Args:
        current_user: Current authenticated user from JWT
        db: Database session
    
    Returns:
        Reactivation confirmation
    """
    user_service = UserService(db)
    
    await user_service.reactivate_account(current_user["user_id"])
    
    logger.info(f"Account reactivated: {current_user['email']}")
    
    return {
        "message": "Account reactivated successfully"
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["router"]
