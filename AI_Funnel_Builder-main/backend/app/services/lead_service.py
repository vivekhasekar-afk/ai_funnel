# =============================================================================
# AI FUNNEL BUILDER - LEAD SERVICE
# =============================================================================
# Lead capture and management business logic
# =============================================================================

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.models.lead import Lead, LeadStatusEnum, LeadSourceEnum
from app.models.funnel import Funnel
from app.models.response import Response
from app.models.subscription import Subscription
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
    LeadSearchParams,
)
from app.utils.exceptions import (
    NotFoundException,
    ValidationException,
    LeadNotFoundException,
    LeadLimitExceededException,
)
from app.utils.logger import get_logger
from app.utils.validators import validate_email, validate_phone
from app.utils.helpers import extract_domain_from_email

logger = get_logger(__name__)


# =============================================================================
# LEAD SERVICE
# =============================================================================

class LeadService:
    """
    Lead management service.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize lead service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # LEAD CAPTURE
    # =========================================================================
    
    async def capture_lead(
        self,
        funnel_id: str,
        response_id: str,
        data: Dict[str, Any],
        source: LeadSourceEnum = LeadSourceEnum.FUNNEL,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Lead:
        """
        Capture lead from funnel submission.
        
        Args:
            funnel_id: Funnel ID
            response_id: Response ID
            data: Lead data (email, name, etc.)
            source: Lead source
            ip_address: Client IP
            user_agent: User agent
        
        Returns:
            Created lead
        
        Raises:
            LeadLimitExceededException: If quota exceeded
            ValidationException: If required fields missing
        """
        # Get funnel with owner
        funnel = await self._get_funnel_with_owner(funnel_id)
        user_id = funnel.user_id
        
        # Check lead quota
        await self._check_lead_quota(user_id)
        
        # Validate and extract lead data
        email = data.get("email")
        if not email:
            raise ValidationException("Email is required for lead capture", field="email")
        
        email = validate_email(email)
        
        # Extract other fields
        first_name = data.get("first_name") or data.get("firstName")
        last_name = data.get("last_name") or data.get("lastName")
        full_name = data.get("full_name") or data.get("name")
        
        # Construct full name if not provided
        if not full_name and (first_name or last_name):
            full_name = f"{first_name or ''} {last_name or ''}".strip()
        
        phone = data.get("phone")
        if phone:
            try:
                phone = validate_phone(phone)
            except Exception:
                phone = None  # Don't fail on invalid phone
        
        # Check for duplicate lead
        duplicate_lead = await self._find_duplicate_lead(user_id, email)
        
        if duplicate_lead:
            # Update existing lead
            lead = await self._update_existing_lead(
                duplicate_lead,
                funnel_id,
                response_id,
                data,
                ip_address
            )
            
            logger.info(
                f"Duplicate lead updated: {email}",
                extra={
                    "user_id": user_id,
                    "lead_id": lead.lead_id,
                    "funnel_id": funnel_id,
                }
            )
        else:
            # Create new lead
            lead = Lead(
                user_id=user_id,
                funnel_id=funnel_id,
                response_id=response_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                full_name=full_name,
                phone=phone,
                company=data.get("company"),
                website=data.get("website"),
                source=source,
                status=LeadStatusEnum.NEW,
                custom_fields=data.get("custom_fields", {}),
                ip_address=ip_address,
                user_agent=user_agent,
            )
            
            # Enrich lead data
            lead = await self._enrich_lead(lead)
            
            # Calculate lead score
            lead.score = await self._calculate_lead_score(lead, data)
            
            self.db.add(lead)
            await self.db.flush()
            
            logger.info(
                f"Lead captured: {email}",
                extra={
                    "user_id": user_id,
                    "lead_id": lead.lead_id,
                    "funnel_id": funnel_id,
                    "score": lead.score,
                }
            )
        
        await self.db.commit()
        await self.db.refresh(lead)
        
        # Increment lead count
        await self._increment_lead_count(user_id)
        
        # TODO: Trigger integrations (CRM sync, email workflows)
        
        return lead
    
    # =========================================================================
    # LEAD CRUD
    # =========================================================================
    
    async def get_lead(
        self,
        lead_id: str,
        user_id: str,
        include_response: bool = False
    ) -> Lead:
        """
        Get lead by ID.
        
        Args:
            lead_id: Lead ID
            user_id: User ID
            include_response: Include response data
        
        Returns:
            Lead
        
        Raises:
            LeadNotFoundException: If lead not found
        """
        query = select(Lead).where(
            and_(
                Lead.lead_id == lead_id,
                Lead.user_id == user_id
            )
        )
        
        if include_response:
            query = query.options(selectinload(Lead.response))
        
        result = await self.db.execute(query)
        lead = result.scalar_one_or_none()
        
        if not lead:
            raise LeadNotFoundException(lead_id)
        
        return lead
    
    async def update_lead(
        self,
        lead_id: str,
        user_id: str,
        data: LeadUpdate
    ) -> Lead:
        """
        Update lead.
        
        Args:
            lead_id: Lead ID
            user_id: User ID
            data: Update data
        
        Returns:
            Updated lead
        """
        lead = await self.get_lead(lead_id, user_id)
        
        # Update fields
        if data.first_name is not None:
            lead.first_name = data.first_name
        
        if data.last_name is not None:
            lead.last_name = data.last_name
        
        if data.email is not None:
            lead.email = validate_email(data.email)
        
        if data.phone is not None:
            lead.phone = validate_phone(data.phone) if data.phone else None
        
        if data.company is not None:
            lead.company = data.company
        
        if data.website is not None:
            lead.website = data.website
        
        if data.status is not None:
            lead.status = data.status
        
        if data.tags is not None:
            lead.tags = data.tags
        
        if data.custom_fields is not None:
            if not lead.custom_fields:
                lead.custom_fields = {}
            lead.custom_fields.update(data.custom_fields)
        
        if data.notes is not None:
            lead.notes = data.notes
        
        await self.db.commit()
        await self.db.refresh(lead)
        
        logger.info(
            f"Lead updated: {lead.email}",
            extra={"user_id": user_id, "lead_id": lead_id}
        )
        
        return lead
    
    async def delete_lead(
        self,
        lead_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete lead.
        
        Args:
            lead_id: Lead ID
            user_id: User ID
            hard_delete: Permanently delete (GDPR)
        
        Returns:
            True if deleted
        """
        lead = await self.get_lead(lead_id, user_id)
        
        if hard_delete:
            await self.db.delete(lead)
            
            logger.warning(
                f"Lead permanently deleted: {lead.email}",
                extra={"user_id": user_id, "lead_id": lead_id}
            )
        else:
            lead.deleted_at = datetime.utcnow()
            
            logger.info(
                f"Lead soft deleted: {lead.email}",
                extra={"user_id": user_id, "lead_id": lead_id}
            )
        
        await self.db.commit()
        
        return True
    
    # =========================================================================
    # LEAD LISTING & SEARCH
    # =========================================================================
    
    async def search_leads(
        self,
        user_id: str,
        params: LeadSearchParams
    ) -> Tuple[List[Lead], int]:
        """
        Search and filter leads.
        
        Args:
            user_id: User ID
            params: Search parameters
        
        Returns:
            Tuple of (leads, total_count)
        """
        query = select(Lead).where(Lead.user_id == user_id)
        
        # Filter by funnel
        if params.funnel_id:
            query = query.where(Lead.funnel_id == params.funnel_id)
        
        # Filter by status
        if params.status:
            query = query.where(Lead.status == params.status)
        
        # Filter by source
        if params.source:
            query = query.where(Lead.source == params.source)
        
        # Filter by tags
        if params.tags:
            query = query.where(Lead.tags.contains(params.tags))
        
        # Search query
        if params.search:
            search_term = f"%{params.search}%"
            query = query.where(
                or_(
                    Lead.email.ilike(search_term),
                    Lead.full_name.ilike(search_term),
                    Lead.company.ilike(search_term)
                )
            )
        
        # Date range
        if params.created_after:
            query = query.where(Lead.created_at >= params.created_after)
        
        if params.created_before:
            query = query.where(Lead.created_at <= params.created_before)
        
        # Score range
        if params.min_score is not None:
            query = query.where(Lead.score >= params.min_score)
        
        if params.max_score is not None:
            query = query.where(Lead.score <= params.max_score)
        
        # Exclude deleted
        if not params.include_deleted:
            query = query.where(Lead.deleted_at.is_(None))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_count = await self.db.scalar(count_query)
        
        # Order
        if params.sort_by == "created_at":
            query = query.order_by(desc(Lead.created_at))
        elif params.sort_by == "score":
            query = query.order_by(desc(Lead.score))
        elif params.sort_by == "email":
            query = query.order_by(Lead.email)
        else:
            query = query.order_by(desc(Lead.created_at))
        
        # Paginate
        query = query.limit(params.limit).offset(params.offset)
        
        result = await self.db.execute(query)
        leads = result.scalars().all()
        
        return list(leads), total_count or 0
    
    async def get_lead_count(
        self,
        user_id: str,
        funnel_id: Optional[str] = None,
        status: Optional[LeadStatusEnum] = None
    ) -> int:
        """
        Get lead count.
        
        Args:
            user_id: User ID
            funnel_id: Optional funnel filter
            status: Optional status filter
        
        Returns:
            Lead count
        """
        query = select(func.count(Lead.lead_id)).where(
            and_(
                Lead.user_id == user_id,
                Lead.deleted_at.is_(None)
            )
        )
        
        if funnel_id:
            query = query.where(Lead.funnel_id == funnel_id)
        
        if status:
            query = query.where(Lead.status == status)
        
        result = await self.db.execute(query)
        count = result.scalar_one()
        
        return count
    
    # =========================================================================
    # LEAD SEGMENTATION
    # =========================================================================
    
    async def segment_leads(
        self,
        user_id: str,
        segment_criteria: Dict[str, Any]
    ) -> List[Lead]:
        """
        Segment leads based on criteria.
        
        Args:
            user_id: User ID
            segment_criteria: Segmentation criteria
        
        Returns:
            List of leads matching criteria
        """
        query = select(Lead).where(
            and_(
                Lead.user_id == user_id,
                Lead.deleted_at.is_(None)
            )
        )
        
        # Apply segment criteria
        if "min_score" in segment_criteria:
            query = query.where(Lead.score >= segment_criteria["min_score"])
        
        if "status" in segment_criteria:
            query = query.where(Lead.status == segment_criteria["status"])
        
        if "source" in segment_criteria:
            query = query.where(Lead.source == segment_criteria["source"])
        
        if "domain" in segment_criteria:
            # Filter by email domain
            domain_pattern = f"%@{segment_criteria['domain']}"
            query = query.where(Lead.email.ilike(domain_pattern))
        
        if "has_phone" in segment_criteria:
            if segment_criteria["has_phone"]:
                query = query.where(Lead.phone.isnot(None))
            else:
                query = query.where(Lead.phone.is_(None))
        
        result = await self.db.execute(query)
        leads = result.scalars().all()
        
        return list(leads)
    
    # =========================================================================
    # LEAD EXPORT
    # =========================================================================
    
    async def export_leads(
        self,
        user_id: str,
        funnel_id: Optional[str] = None,
        format: str = "csv"
    ) -> List[Dict[str, Any]]:
        """
        Export leads to structured format.
        
        Args:
            user_id: User ID
            funnel_id: Optional funnel filter
            format: Export format (csv, json)
        
        Returns:
            List of lead dictionaries
        """
        query = select(Lead).where(
            and_(
                Lead.user_id == user_id,
                Lead.deleted_at.is_(None)
            )
        )
        
        if funnel_id:
            query = query.where(Lead.funnel_id == funnel_id)
        
        query = query.order_by(Lead.created_at.desc())
        
        result = await self.db.execute(query)
        leads = result.scalars().all()
        
        # Convert to export format
        export_data = []
        for lead in leads:
            export_data.append({
                "email": lead.email,
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "full_name": lead.full_name,
                "phone": lead.phone,
                "company": lead.company,
                "website": lead.website,
                "source": lead.source.value,
                "status": lead.status.value,
                "score": lead.score,
                "tags": ", ".join(lead.tags) if lead.tags else "",
                "created_at": lead.created_at.isoformat(),
                "notes": lead.notes,
            })
        
        logger.info(
            f"Leads exported: {len(export_data)} leads",
            extra={"user_id": user_id, "funnel_id": funnel_id, "format": format}
        )
        
        return export_data
    
    # =========================================================================
    # LEAD ANALYTICS
    # =========================================================================
    
    async def get_lead_analytics(
        self,
        user_id: str,
        funnel_id: Optional[str] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get lead analytics and insights.
        
        Args:
            user_id: User ID
            funnel_id: Optional funnel filter
            days: Number of days to analyze
        
        Returns:
            Analytics data
        """
        since = datetime.utcnow() - timedelta(days=days)
        
        base_query = select(Lead).where(
            and_(
                Lead.user_id == user_id,
                Lead.created_at >= since,
                Lead.deleted_at.is_(None)
            )
        )
        
        if funnel_id:
            base_query = base_query.where(Lead.funnel_id == funnel_id)
        
        # Total leads
        total_query = select(func.count(Lead.lead_id)).select_from(base_query.subquery())
        total_leads = await self.db.scalar(total_query)
        
        # Leads by status
        status_query = select(Lead.status, func.count(Lead.lead_id)).select_from(
            base_query.subquery()
        ).group_by(Lead.status)
        status_result = await self.db.execute(status_query)
        leads_by_status = {status.value: count for status, count in status_result}
        
        # Average score
        avg_score_query = select(func.avg(Lead.score)).select_from(base_query.subquery())
        avg_score = await self.db.scalar(avg_score_query) or 0
        
        # Top sources
        source_query = select(Lead.source, func.count(Lead.lead_id)).select_from(
            base_query.subquery()
        ).group_by(Lead.source).order_by(desc(func.count(Lead.lead_id))).limit(5)
        source_result = await self.db.execute(source_query)
        top_sources = {source.value: count for source, count in source_result}
        
        analytics = {
            "total_leads": total_leads or 0,
            "period_days": days,
            "leads_by_status": leads_by_status,
            "average_score": round(float(avg_score), 2),
            "top_sources": top_sources,
        }
        
        return analytics
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _get_funnel_with_owner(self, funnel_id: str) -> Funnel:
        """Get funnel with owner validation."""
        result = await self.db.execute(
            select(Funnel).where(Funnel.funnel_id == funnel_id)
        )
        funnel = result.scalar_one_or_none()
        
        if not funnel:
            raise NotFoundException("Funnel not found", resource_type="funnel")
        
        return funnel
    
    async def _check_lead_quota(self, user_id: str):
        """
        Check if user can capture more leads.
        
        Raises:
            LeadLimitExceededException: If quota exceeded
        """
        result = await self.db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            limit = 100  # Free tier
        else:
            limit = subscription.leads_limit
        
        # Check if unlimited
        if limit == -1:
            return
        
        # Get current period lead count
        if subscription and subscription.current_period_start:
            since = subscription.current_period_start
        else:
            since = datetime.utcnow() - timedelta(days=30)
        
        count_result = await self.db.execute(
            select(func.count(Lead.lead_id)).where(
                and_(
                    Lead.user_id == user_id,
                    Lead.created_at >= since
                )
            )
        )
        current_count = count_result.scalar_one()
        
        if current_count >= limit:
            raise LeadLimitExceededException(current_count, limit)
    
    async def _find_duplicate_lead(
        self,
        user_id: str,
        email: str
    ) -> Optional[Lead]:
        """Find existing lead with same email."""
        result = await self.db.execute(
            select(Lead).where(
                and_(
                    Lead.user_id == user_id,
                    Lead.email == email,
                    Lead.deleted_at.is_(None)
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def _update_existing_lead(
        self,
        lead: Lead,
        funnel_id: str,
        response_id: str,
        data: Dict[str, Any],
        ip_address: Optional[str]
    ) -> Lead:
        """Update existing duplicate lead."""
        # Update submission count
        lead.submission_count += 1
        lead.last_seen_at = datetime.utcnow()
        lead.last_ip_address = ip_address
        
        # Update funnel reference (track latest funnel)
        lead.funnel_id = funnel_id
        lead.response_id = response_id
        
        # Merge custom fields
        if "custom_fields" in data:
            if not lead.custom_fields:
                lead.custom_fields = {}
            lead.custom_fields.update(data["custom_fields"])
        
        return lead
    
    async def _enrich_lead(self, lead: Lead) -> Lead:
        """
        Enrich lead with additional data.
        
        Args:
            lead: Lead to enrich
        
        Returns:
            Enriched lead
        """
        # Extract domain from email
        if lead.email:
            lead.email_domain = extract_domain_from_email(lead.email)
        
        # TODO: Add external enrichment APIs
        # - Clearbit for company data
        # - FullContact for social profiles
        # - Hunter.io for email verification
        
        return lead
    
    async def _calculate_lead_score(
        self,
        lead: Lead,
        data: Dict[str, Any]
    ) -> int:
        """
        Calculate lead quality score (0-100).
        
        Args:
            lead: Lead to score
            data: Lead data
        
        Returns:
            Score (0-100)
        """
        score = 50  # Base score
        
        # Has phone number (+10)
        if lead.phone:
            score += 10
        
        # Has company (+10)
        if lead.company:
            score += 10
        
        # Has website (+5)
        if lead.website:
            score += 5
        
        # Business email domain (+15)
        if lead.email_domain and not any(
            domain in lead.email_domain
            for domain in ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
        ):
            score += 15
        
        # Custom fields provided (+10)
        if lead.custom_fields and len(lead.custom_fields) > 0:
            score += 10
        
        # Cap at 100
        return min(100, score)
    
    async def _increment_lead_count(self, user_id: str):
        """Increment subscription lead count."""
        await self.db.execute(
            update(Subscription)
            .where(Subscription.user_id == user_id)
            .values(leads_used=Subscription.leads_used + 1)
        )
        await self.db.commit()


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["LeadService"]
