# app/api/v1/endpoints/enums.py

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List

from app.core.database import get_db

router = APIRouter()


def format_enum_label(value: str) -> str:
    """Convert enum value to human-readable label"""
    special_cases = {
        "ecommerce": "E-commerce",
        "saas": "SaaS",
        "health_fitness": "Health & Fitness",
        "beauty_skincare": "Beauty & Skincare",
        "real_estate": "Real Estate",
        "marketing_agency": "Marketing Agency",
        "content_creator": "Content Creator",
        "local_business": "Local Business",
        "lead_magnet": "Lead Magnet",
        "product_launch": "Product Launch",
        "multi_step": "Multi-Step",
    }
    
    value_lower = value.lower()
    if value_lower in special_cases:
        return special_cases[value_lower]
    
    # Default: Title case with spaces
    return value.replace('_', ' ').title()


async def get_enum_values_from_db(
    db: AsyncSession,
    enum_name: str
) -> List[Dict[str, str]]:
    """
    Fetch enum values directly from PostgreSQL database
    
    Args:
        db: Database session
        enum_name: Name of the enum type (e.g., 'industry_enum')
    
    Returns:
        List of dicts with 'value' and 'label' keys
    """
    query = text("""
        SELECT 
            unnest(enum_range(NULL::{})) AS enum_value
    """.format(enum_name))
    
    result = await db.execute(query)
    enum_values = result.scalars().all()
    
    return [
        {
            "value": val.lower(),
            "label": format_enum_label(val)
        }
        for val in enum_values
    ]


@router.get("/industries")
async def get_industries(db: AsyncSession = Depends(get_db)):
    """Get all available industries from database"""
    try:
        industries = await get_enum_values_from_db(db, "industry_enum")
        return {"data": industries}
    except Exception as e:
        # Fallback to hardcoded values if DB query fails
        return {
            "data": [
                {"value": "ecommerce", "label": "E-commerce"},
                {"value": "saas", "label": "SaaS"},
                {"value": "coaching", "label": "Coaching"},
                {"value": "consulting", "label": "Consulting"},
                {"value": "education", "label": "Education"},
                {"value": "health_fitness", "label": "Health & Fitness"},
                {"value": "beauty_skincare", "label": "Beauty & Skincare"},
                {"value": "real_estate", "label": "Real Estate"},
                {"value": "finance", "label": "Finance"},
                {"value": "marketing_agency", "label": "Marketing Agency"},
                {"value": "content_creator", "label": "Content Creator"},
                {"value": "local_business", "label": "Local Business"},
                {"value": "nonprofit", "label": "Nonprofit"},
                {"value": "other", "label": "Other"},
            ]
        }


@router.get("/brand-voices")
async def get_brand_voices(db: AsyncSession = Depends(get_db)):
    """Get all available brand voice tones from database"""
    try:
        voices = await get_enum_values_from_db(db, "brand_voice_enum")
        return {"data": voices}
    except Exception as e:
        return {
            "data": [
                {"value": "professional", "label": "Professional"},
                {"value": "friendly", "label": "Friendly"},
                {"value": "casual", "label": "Casual"},
                {"value": "luxury", "label": "Luxury"},
                {"value": "educational", "label": "Educational"},
                {"value": "playful", "label": "Playful"},
                {"value": "authoritative", "label": "Authoritative"},
                {"value": "empathetic", "label": "Empathetic"},
            ]
        }


@router.get("/focus-options")
async def get_focus_options(db: AsyncSession = Depends(get_db)):
    """Get all available funnel focus options from database"""
    try:
        focus_options = await get_enum_values_from_db(db, "focus_enum")
        return {"data": focus_options}
    except Exception:
        # Fallback if focus_enum doesn't exist
        return {
            "data": [
                {"value": "feature", "label": "Feature"},
                {"value": "problem", "label": "Problem"},
                {"value": "experience", "label": "Experience"},
                {"value": "journey", "label": "Journey"},
            ]
        }


@router.get("/goals")
async def get_goals(db: AsyncSession = Depends(get_db)):
    """Get all available funnel goals from database"""
    try:
        goals = await get_enum_values_from_db(db, "goal_enum")
        return {"data": goals}
    except Exception:
        return {
            "data": [
                {"value": "awareness", "label": "Awareness"},
                {"value": "lead", "label": "Lead Generation"},
                {"value": "sales", "label": "Sales & Revenue"},
                {"value": "feedback", "label": "Feedback & Survey"},
                {"value": "recommendation", "label": "Product Recommendation"},
            ]
        }


@router.get("/funnel-types")
async def get_funnel_types(db: AsyncSession = Depends(get_db)):
    """Get all available funnel types from database"""
    try:
        funnel_types = await get_enum_values_from_db(db, "funnel_type_enum")
        return {"data": funnel_types}
    except Exception:
        return {
            "data": [
                {"value": "quiz", "label": "Quiz"},
                {"value": "survey", "label": "Survey"},
                {"value": "form", "label": "Form"},
                {"value": "poll", "label": "Poll"},
                {"value": "lead_magnet", "label": "Lead Magnet"},
                {"value": "product_launch", "label": "Product Launch"},
                {"value": "webinar", "label": "Webinar"},
                {"value": "waitlist", "label": "Waitlist"},
            ]
        }


@router.get("/funnel-statuses")
async def get_funnel_statuses(db: AsyncSession = Depends(get_db)):
    """Get all available funnel statuses from database"""
    try:
        statuses = await get_enum_values_from_db(db, "funnel_status_enum")
        return {"data": statuses}
    except Exception:
        return {
            "data": [
                {"value": "draft", "label": "Draft"},
                {"value": "published", "label": "Published"},
                {"value": "archived", "label": "Archived"},
                {"value": "paused", "label": "Paused"},
            ]
        }


@router.get("/funnel-visibility")
async def get_funnel_visibility(db: AsyncSession = Depends(get_db)):
    """Get all available funnel visibility options from database"""
    try:
        visibility = await get_enum_values_from_db(db, "funnel_visibility_enum")
        return {"data": visibility}
    except Exception:
        return {
            "data": [
                {"value": "private", "label": "Private"},
                {"value": "unlisted", "label": "Unlisted"},
                {"value": "public", "label": "Public"},
            ]
        }


@router.get("/funnel-templates")
async def get_funnel_templates(db: AsyncSession = Depends(get_db)):
    """Get all available funnel templates from database"""
    try:
        templates = await get_enum_values_from_db(db, "funnel_template_enum")
        return {"data": templates}
    except Exception:
        return {
            "data": [
                {"value": "minimal", "label": "Minimal"},
                {"value": "hero", "label": "Hero"},
                {"value": "split", "label": "Split"},
                {"value": "card", "label": "Card"},
                {"value": "fullscreen", "label": "Fullscreen"},
                {"value": "multi_step", "label": "Multi-Step"},
                {"value": "conversational", "label": "Conversational"},
            ]
        }


@router.get("/group-types")
async def get_group_types(db: AsyncSession = Depends(get_db)):
    """Get all available group types from database"""
    try:
        group_types = await get_enum_values_from_db(db, "group_type_enum")
        return {"data": group_types}
    except Exception:
        return {
            "data": [
                {"value": "product", "label": "Product"},
                {"value": "category", "label": "Category"},
                {"value": "campaign", "label": "Campaign"},
                {"value": "service", "label": "Service"},
                {"value": "collection", "label": "Collection"},
            ]
        }


@router.get("/group-statuses")
async def get_group_statuses(db: AsyncSession = Depends(get_db)):
    """Get all available group statuses from database"""
    try:
        statuses = await get_enum_values_from_db(db, "group_status_enum")
        return {"data": statuses}
    except Exception:
        return {
            "data": [
                {"value": "draft", "label": "Draft"},
                {"value": "active", "label": "Active"},
                {"value": "paused", "label": "Paused"},
                {"value": "archived", "label": "Archived"},
            ]
        }


@router.get("/question-types")
async def get_question_types():
    """Get all available question types"""
    return {
        "data": [
            {"value": "multiple_choice", "label": "Multiple Choice"},
            {"value": "single_choice", "label": "Single Choice"},
            {"value": "text", "label": "Text Input"},
            {"value": "textarea", "label": "Long Text"},
            {"value": "email", "label": "Email"},
            {"value": "number", "label": "Number"},
            {"value": "rating", "label": "Rating"},
            {"value": "scale", "label": "Scale"},
            {"value": "yes_no", "label": "Yes/No"},
            {"value": "dropdown", "label": "Dropdown"},
        ]
    }


@router.get("/lead-capture-timing")
async def get_lead_capture_timing():
    """Get all available lead capture timing options"""
    return {
        "data": [
            {"value": "before_result", "label": "Before Results"},
            {"value": "after_result", "label": "After Results"},
            {"value": "optional", "label": "Optional"},
        ]
    }


@router.get("/all")
async def get_all_enums(db: AsyncSession = Depends(get_db)):
    """Get all enum values at once (optimized for single request)"""
    
    # Fetch all enums
    industries = await get_industries(db)
    brand_voices = await get_brand_voices(db)
    focus_options = await get_focus_options(db)
    goals = await get_goals(db)
    funnel_types = await get_funnel_types(db)
    funnel_statuses = await get_funnel_statuses(db)
    funnel_visibility = await get_funnel_visibility(db)
    funnel_templates = await get_funnel_templates(db)
    group_types = await get_group_types(db)
    group_statuses = await get_group_statuses(db)
    question_types = await get_question_types()
    lead_capture_timing = await get_lead_capture_timing()
    
    return {
        "industries": industries,
        "brand_voices": brand_voices,
        "focus_options": focus_options,
        "goals": goals,
        "funnel_types": funnel_types,
        "funnel_statuses": funnel_statuses,
        "funnel_visibility": funnel_visibility,
        "funnel_templates": funnel_templates,
        "group_types": group_types,
        "group_statuses": group_statuses,
        "question_types": question_types,
        "lead_capture_timing": lead_capture_timing,
    }


@router.get("/available")
async def get_available_enums():
    """Get list of all available enum types"""
    return {
        "data": [
            {"name": "industries", "endpoint": "/api/v1/enums/industries"},
            {"name": "brand_voices", "endpoint": "/api/v1/enums/brand-voices"},
            {"name": "focus_options", "endpoint": "/api/v1/enums/focus-options"},
            {"name": "goals", "endpoint": "/api/v1/enums/goals"},
            {"name": "funnel_types", "endpoint": "/api/v1/enums/funnel-types"},
            {"name": "funnel_statuses", "endpoint": "/api/v1/enums/funnel-statuses"},
            {"name": "funnel_visibility", "endpoint": "/api/v1/enums/funnel-visibility"},
            {"name": "funnel_templates", "endpoint": "/api/v1/enums/funnel-templates"},
            {"name": "group_types", "endpoint": "/api/v1/enums/group-types"},
            {"name": "group_statuses", "endpoint": "/api/v1/enums/group-statuses"},
            {"name": "question_types", "endpoint": "/api/v1/enums/question-types"},
            {"name": "lead_capture_timing", "endpoint": "/api/v1/enums/lead-capture-timing"},
            {"name": "all", "endpoint": "/api/v1/enums/all"},
        ]
    }


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["router"]
