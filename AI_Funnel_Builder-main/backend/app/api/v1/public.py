# =============================================================================
# AI FUNNEL BUILDER - PUBLIC ENDPOINTS (UPDATED)
# =============================================================================
# Public funnel access (no authentication required)
# =============================================================================

from datetime import datetime
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, status, Request, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.funnel import Funnel, FunnelStatusEnum
from app.models.question import Question
from app.models.response import Response
from app.models.lead import Lead
from app.schemas.public import (
    PublicFunnelResponse,
    EventTrackRequest,
    PublicResponseSubmit,
    QuickLeadCapture,
    PublicFeedback,
)
from app.utils.logger import get_logger
from app.utils.exceptions import NotFoundException, ValidationException
from app.utils.helpers import get_client_ip, parse_user_agent

logger = get_logger(__name__)

router = APIRouter()

# =============================================================================
# HELPERS
# =============================================================================


async def _get_published_funnel_by_slug(
    slug: str,
    db: AsyncSession,
    allow_unpublished: bool = False,
) -> Funnel:
    result = await db.execute(select(Funnel).where(Funnel.slug == slug))
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")

    if not allow_unpublished and funnel.status != "published":
        raise ValidationException("This funnel is not available", field="status")

    return funnel


async def _get_published_funnel_by_id(
    funnel_id: str,
    db: AsyncSession,
    allow_unpublished: bool = False,
) -> Funnel:
    result = await db.execute(select(Funnel).where(Funnel.funnel_id == funnel_id))
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")

    if not allow_unpublished and funnel.status != "published":
        raise ValidationException("Funnel is not published", field="status")

    return funnel


async def _load_questions_for_funnel(
    funnel_id: str,
    db: AsyncSession,
) -> List[Question]:
    questions_result = await db.execute(
        select(Question)
        .where(Question.funnel_id == funnel_id)
        .order_by(Question.display_order)
    )
    return questions_result.scalars().all()


def _build_public_funnel_response(
    funnel: Funnel,
    questions: List[Question],
) -> PublicFunnelResponse:
    """
    Build the public-facing funnel payload.
    """
    return PublicFunnelResponse(
        funnel_id=str(funnel.funnel_id),
        title=funnel.title,
        description=funnel.description,
        slug=funnel.slug,
        status=funnel.status,
        funnel_type=funnel.funnel_type,
        visibility=funnel.visibility,
        language=funnel.language,
        layout=funnel.layout or {},
        theme=funnel.theme or {},
        seo_metadata=funnel.seo_metadata or {},
        config=funnel.config or {},
        questions=[
            {
                "question_id": str(q.question_id),
                "question_type": q.question_type,
                "question_text": q.question_text,
                "description": q.description,
                "display_order": q.display_order,
                "is_required": q.is_required,
                "options": q.options,
                "validation": q.validation,
            }
            for q in questions
        ],
        estimated_time=len(questions) * 30,  # 30 seconds per question
    )


# =============================================================================
# PUBLIC FUNNEL ACCESS
# =============================================================================


@router.get(
    "/funnel/{slug}",
    response_model=PublicFunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Public Funnel",
    description="Get published funnel by slug (no auth required)",
)
async def get_public_funnel(
    slug: str,
    request: Request,
    preview: bool = Query(False, description="Preview mode (for funnel owners)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get public funnel by slug.

    This is the main endpoint for displaying funnels to end users.
    """
    funnel = await _get_published_funnel_by_slug(
        slug=slug,
        db=db,
        allow_unpublished=preview,
    )

    questions = await _load_questions_for_funnel(funnel.funnel_id, db)

    # Track view (don't track in preview mode)
    if not preview:
        funnel.views_count += 1
        await db.commit()

        logger.info(
            f"Funnel viewed: {funnel.title}",
            extra={
                "funnel_id": funnel.funnel_id,
                "slug": slug,
                "ip": get_client_ip(request),
            },
        )

    return _build_public_funnel_response(funnel, questions)


@router.get(
    "/funnel/id/{funnel_id}",
    response_model=PublicFunnelResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Funnel by ID",
    description="Get funnel by ID (alternative to slug)",
)
async def get_funnel_by_id(
    funnel_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get funnel by ID. Redirects to slug-based handler logic.
    """
    funnel = await _get_published_funnel_by_id(
        funnel_id=funnel_id,
        db=db,
        allow_unpublished=False,
    )
    # Reuse slug handler for consistent behavior
    return await get_public_funnel(funnel.slug, request, preview=False, db=db)


# =============================================================================
# EVENT TRACKING
# =============================================================================


@router.post(
    "/event/track",
    status_code=status.HTTP_200_OK,
    summary="Track Event",
    description="Track funnel interaction events",
)
async def track_event(
    data: EventTrackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Track funnel events.

    Events: view, start, question_answered, completed, abandoned.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    device_info = parse_user_agent(user_agent)

    # Basic logging (you can later persist this to an events table)
    logger.info(
        f"Event tracked: {data.event_name}",
        extra={
            "funnel_id": getattr(data, "funnel_id", None),
            "event_name": data.event_name,
            "user_id": data.user_id,
            "ip": ip_address,
            "device": device_info,
        },
    )

    # Simple stats update example for "start" event if funnel_id is present
    funnel_id = getattr(data, "funnel_id", None)
    if data.event_name == "start" and funnel_id:
        await db.execute(
            """
            UPDATE funnels
            SET starts_count = starts_count + 1
            WHERE funnel_id = :funnel_id
            """,
            {"funnel_id": funnel_id},
        )
        await db.commit()

    return {
        "tracked": True,
        "event_name": data.event_name,
        "timestamp": datetime.utcnow().isoformat(),
    }


# =============================================================================
# RESPONSE SUBMISSION
# =============================================================================


@router.post(
    "/response/submit",
    status_code=status.HTTP_201_CREATED,
    summary="Submit Response",
    description="Submit funnel response (public endpoint)",
)
async def submit_response(
    data: PublicResponseSubmit,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit funnel response (thin wrapper over internal responses handler).
    """
    from app.api.v1.responses import submit_response as submit_response_handler
    from app.schemas.response import ResponseSubmitRequest

    # Map public payload into internal schema
    request_data = ResponseSubmitRequest(
        funnel_id=data.funnel_id,
        answers=data.responses,
    )

    result = await submit_response_handler(request_data, request, db)
    return result


# =============================================================================
# QUICK LEAD CAPTURE
# =============================================================================


@router.post(
    "/lead/capture",
    status_code=status.HTTP_201_CREATED,
    summary="Quick Lead Capture",
    description="Capture lead without full funnel completion",
)
async def capture_lead(
    data: QuickLeadCapture,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Quick lead capture used for simple email forms.
    """
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    device_info = parse_user_agent(user_agent)

    lead = Lead(
        funnel_id=data.funnel_id,
        email=data.email,
        source="quick_capture",
        ip_address=ip_address,
        user_agent=user_agent,
        device_type=device_info.get("device_type"),
        # Optional fields if present on schema/model
        full_name=getattr(data, "full_name", None),
        phone=getattr(data, "phone", None),
        company=getattr(data, "company", None),
        country=getattr(data, "country", None),
        tags=getattr(data, "tags", []) or [],
        custom_fields=getattr(data, "custom_fields", {}) or {},
    )

    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    logger.info(
        f"Quick lead captured: {data.email}",
        extra={
            "funnel_id": data.funnel_id,
            "lead_id": lead.lead_id,
            "email": data.email,
        },
    )

    return {
        "success": True,
        "lead_id": lead.lead_id,
        "message": "Thank you! We'll be in touch soon.",
    }


# =============================================================================
# EMBED CODE
# =============================================================================


@router.get(
    "/funnel/{slug}/embed",
    status_code=status.HTTP_200_OK,
    summary="Get Embed Code",
    description="Get embed code for funnel",
)
async def get_embed_code(
    slug: str,
    width: str = Query("100%", description="Embed width"),
    height: str = Query("600px", description="Embed height"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Funnel).where(Funnel.slug == slug))
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")

    iframe_code = f"""<iframe 
    src="https://yourdomain.com/f/{slug}" 
    width="{width}" 
    height="{height}" 
    frameborder="0" 
    style="border: none;"
    title="{funnel.title}">
</iframe>"""

    js_code = f"""<div id="funnel-{funnel.funnel_id}"></div>
<script>
(function() {{
    var iframe = document.createElement('iframe');
    iframe.src = 'https://yourdomain.com/f/{slug}';
    iframe.width = '{width}';
    iframe.height = '{height}';
    iframe.frameBorder = '0';
    iframe.title = '{funnel.title}';
    document.getElementById('funnel-{funnel.funnel_id}').appendChild(iframe);
}})();
</script>"""

    return {
        "funnel_id": funnel.funnel_id,
        "slug": slug,
        "embed_codes": {
            "iframe": iframe_code,
            "javascript": js_code,
            "url": f"https://yourdomain.com/f/{slug}",
        },
        "customization": {
            "width": width,
            "height": height,
        },
    }


# =============================================================================
# SOCIAL SHARE METADATA
# =============================================================================


@router.get(
    "/share/{slug}",
    status_code=status.HTTP_200_OK,
    summary="Get Share Metadata",
    description="Get social share metadata (Open Graph, Twitter Card)",
)
async def get_share_metadata(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get social share metadata based on funnel.seo_metadata,
    with sane fallbacks.
    """
    result = await db.execute(select(Funnel).where(Funnel.slug == slug))
    funnel = result.scalar_one_or_none()

    if not funnel:
        raise NotFoundException("Funnel not found", resource_type="funnel")

    url = f"https://yourdomain.com/f/{slug}"

    seo = funnel.seo_metadata or {}
    og = seo.get("og", {})
    twitter = seo.get("twitter", {})

    og_title = og.get("title") or seo.get("title") or funnel.title
    og_description = og.get("description") or seo.get("description") or (
        funnel.description or "Complete this interactive funnel"
    )
    og_image = og.get("image") or "https://yourdomain.com/default-og.png"

    tw_title = twitter.get("title") or og_title
    tw_description = twitter.get("description") or og_description
    tw_image = twitter.get("image") or og_image

    return {
        "open_graph": {
            "og:title": og_title,
            "og:description": og_description,
            "og:url": url,
            "og:image": og_image,
            "og:type": og.get("type", "website"),
        },
        "twitter_card": {
            "twitter:card": twitter.get("card", "summary_large_image"),
            "twitter:title": tw_title,
            "twitter:description": tw_description,
            "twitter:image": tw_image,
        },
    }


# =============================================================================
# FEEDBACK
# =============================================================================


@router.post(
    "/feedback",
    status_code=status.HTTP_201_CREATED,
    summary="Submit Feedback",
    description="Submit anonymous feedback about funnel experience",
)
async def submit_feedback(
    data: PublicFeedback,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit feedback (currently only logs it).
    """
    logger.info(
        f"Feedback received: {data.rating}",
        extra={
            "funnel_id": data.funnel_id,
            "rating": data.rating,
            "feedback_text": data.feedback_text,
        },
    )

    return {
        "success": True,
        "message": "Thank you for your feedback!",
    }


# =============================================================================
# FUNNEL PREVIEW (FOR EDITING)
# =============================================================================


@router.get(
    "/funnel/{slug}/preview",
    status_code=status.HTTP_200_OK,
    summary="Preview Funnel",
    description="Preview funnel (same as public access but with preview flag)",
)
async def preview_funnel(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Preview funnel (allows non-published status).
    """
    return await get_public_funnel(slug, request, preview=True, db=db)


# =============================================================================
# PUBLIC API INFO
# =============================================================================


@router.get(
    "/info",
    status_code=status.HTTP_200_OK,
    summary="Public API Info",
    description="Get public API information",
)
async def public_api_info():
    return {
        "api_version": "v1",
        "endpoints": {
            "get_funnel": "/public/funnel/{slug}",
            "get_funnel_by_id": "/public/funnel/id/{funnel_id}",
            "track_event": "/public/event/track",
            "submit_response": "/public/response/submit",
            "capture_lead": "/public/lead/capture",
            "get_embed": "/public/funnel/{slug}/embed",
            "get_share_meta": "/public/share/{slug}",
            "submit_feedback": "/public/feedback",
        },
        "documentation": "https://docs.yourdomain.com/api/public",
    }
