# =============================================================================
# AI FUNNEL BUILDER - ANALYTICS SERVICE
# =============================================================================
# Analytics, reporting, and metrics business logic
# =============================================================================

from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, case, desc

from app.models.funnel import Funnel
from app.models.response import Response, ResponseStatusEnum
from app.models.response_answer import ResponseAnswer
from app.models.question import Question
from app.models.lead import Lead
from app.models.analytics_daily import AnalyticsDaily
from app.models.event import Event, EventTypeEnum
from app.utils.exceptions import NotFoundException, FunnelNotFoundException
from app.utils.logger import get_logger
from app.utils.helpers import calculate_completion_rate, calculate_percentage_change

logger = get_logger(__name__)

def track_event(event_name: str, user_id: Optional[str] = None, properties: Optional[Dict[str, Any]] = None):
    """
    Track analytics event - fixes circular import.
    """
    logger.info(f"📊 TRACK: {event_name} | user: {user_id} | props: {properties}")
    return True

# =============================================================================
# ANALYTICS SERVICE
# =============================================================================

class AnalyticsService:
    """
    Analytics and reporting service.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize analytics service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    # =========================================================================
    # FUNNEL ANALYTICS
    # =========================================================================
    
    async def get_funnel_analytics(
        self,
        funnel_id: str,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Get comprehensive funnel analytics.
        
        Args:
            funnel_id: Funnel ID
            user_id: User ID
            start_date: Start date for date range
            end_date: End date for date range
        
        Returns:
            Analytics dictionary
        """
        # Verify funnel ownership
        funnel = await self._get_funnel(funnel_id, user_id)
        
        # Set default date range (last 30 days)
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Get metrics
        metrics = await self._calculate_funnel_metrics(funnel_id, start_date, end_date)
        
        # Get time series data
        time_series = await self._get_time_series_data(funnel_id, start_date, end_date)
        
        # Get question analytics
        question_analytics = await self._get_question_analytics(funnel_id, start_date, end_date)
        
        # Get device breakdown
        device_breakdown = await self._get_device_breakdown(funnel_id, start_date, end_date)
        
        # Get traffic sources
        traffic_sources = await self._get_traffic_sources(funnel_id, start_date, end_date)
        
        analytics = {
            "funnel_id": funnel_id,
            "funnel_title": funnel.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1,
            },
            "metrics": metrics,
            "time_series": time_series,
            "question_analytics": question_analytics,
            "device_breakdown": device_breakdown,
            "traffic_sources": traffic_sources,
        }
        
        return analytics
    
    async def _calculate_funnel_metrics(
        self,
        funnel_id: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Calculate core funnel metrics.
        
        Args:
            funnel_id: Funnel ID
            start_date: Start date
            end_date: End date
        
        Returns:
            Metrics dictionary
        """
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Total views (started responses)
        views_result = await self.db.execute(
            select(func.count(Response.response_id))
            .where(
                and_(
                    Response.funnel_id == funnel_id,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        total_views = views_result.scalar_one() or 0
        
        # Total completions
        completions_result = await self.db.execute(
            select(func.count(Response.response_id))
            .where(
                and_(
                    Response.funnel_id == funnel_id,
                    Response.status == ResponseStatusEnum.COMPLETED,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        total_completions = completions_result.scalar_one() or 0
        
        # Total leads captured
        leads_result = await self.db.execute(
            select(func.count(Lead.lead_id))
            .where(
                and_(
                    Lead.funnel_id == funnel_id,
                    Lead.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        total_leads = leads_result.scalar_one() or 0
        
        # Average completion time
        avg_time_result = await self.db.execute(
            select(func.avg(Response.completion_time_seconds))
            .where(
                and_(
                    Response.funnel_id == funnel_id,
                    Response.status == ResponseStatusEnum.COMPLETED,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        avg_completion_time = avg_time_result.scalar_one() or 0
        
        # Calculate rates
        completion_rate = calculate_completion_rate(total_completions, total_views)
        lead_capture_rate = calculate_completion_rate(total_leads, total_completions) if total_completions > 0 else 0
        
        # Get comparison with previous period
        prev_start = start_date - timedelta(days=(end_date - start_date).days + 1)
        prev_end = start_date - timedelta(days=1)
        prev_metrics = await self._calculate_funnel_metrics(funnel_id, prev_start, prev_end)
        
        metrics = {
            "total_views": total_views,
            "total_completions": total_completions,
            "total_leads": total_leads,
            "completion_rate": round(completion_rate * 100, 2),
            "lead_capture_rate": round(lead_capture_rate * 100, 2),
            "avg_completion_time_seconds": round(float(avg_completion_time), 1),
            "comparison": {
                "views_change": calculate_percentage_change(
                    prev_metrics.get("total_views", 0),
                    total_views
                ) if prev_metrics else 0,
                "completions_change": calculate_percentage_change(
                    prev_metrics.get("total_completions", 0),
                    total_completions
                ) if prev_metrics else 0,
            }
        }
        
        return metrics
    
    async def _get_time_series_data(
        self,
        funnel_id: str,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Get daily time series data.
        
        Args:
            funnel_id: Funnel ID
            start_date: Start date
            end_date: End date
        
        Returns:
            List of daily data points
        """
        result = await self.db.execute(
            select(AnalyticsDaily)
            .where(
                and_(
                    AnalyticsDaily.funnel_id == funnel_id,
                    AnalyticsDaily.date.between(start_date, end_date)
                )
            )
            .order_by(AnalyticsDaily.date)
        )
        daily_stats = result.scalars().all()
        
        time_series = []
        for stat in daily_stats:
            time_series.append({
                "date": stat.date.isoformat(),
                "views": stat.views,
                "starts": stat.starts,
                "completions": stat.completions,
                "leads": stat.leads,
                "completion_rate": round(stat.completion_rate * 100, 2),
                "avg_time_seconds": stat.avg_completion_time_seconds,
            })
        
        return time_series
    
    # =========================================================================
    # QUESTION ANALYTICS
    # =========================================================================
    
    async def _get_question_analytics(
        self,
        funnel_id: str,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Get question-level analytics.
        
        Args:
            funnel_id: Funnel ID
            start_date: Start date
            end_date: End date
        
        Returns:
            List of question analytics
        """
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get all questions for funnel
        questions_result = await self.db.execute(
            select(Question)
            .where(Question.funnel_id == funnel_id)
            .order_by(Question.display_order)
        )
        questions = questions_result.scalars().all()
        
        question_analytics = []
        
        for question in questions:
            # Count answers for this question
            answers_result = await self.db.execute(
                select(func.count(ResponseAnswer.answer_id))
                .join(Response)
                .where(
                    and_(
                        ResponseAnswer.question_id == question.question_id,
                        Response.created_at.between(start_datetime, end_datetime)
                    )
                )
            )
            answer_count = answers_result.scalar_one() or 0
            
            # Count skips (responses that reached but didn't answer)
            total_reached_result = await self.db.execute(
                select(func.count(Response.response_id))
                .where(
                    and_(
                        Response.funnel_id == funnel_id,
                        Response.created_at.between(start_datetime, end_datetime),
                        Response.progress >= question.display_order
                    )
                )
            )
            total_reached = total_reached_result.scalar_one() or 0
            
            skip_count = total_reached - answer_count if total_reached > answer_count else 0
            answer_rate = (answer_count / total_reached * 100) if total_reached > 0 else 0
            
            # Get most common answers (for choice questions)
            popular_answers = await self._get_popular_answers(
                question.question_id,
                start_datetime,
                end_datetime
            )
            
            question_analytics.append({
                "question_id": question.question_id,
                "question_text": question.question_text,
                "question_type": question.question_type.value,
                "display_order": question.display_order,
                "total_reached": total_reached,
                "total_answers": answer_count,
                "total_skips": skip_count,
                "answer_rate": round(answer_rate, 2),
                "popular_answers": popular_answers[:5],  # Top 5
            })
        
        return question_analytics
    
    async def _get_popular_answers(
        self,
        question_id: str,
        start_datetime: datetime,
        end_datetime: datetime
    ) -> List[Dict[str, Any]]:
        """Get most popular answers for a question."""
        result = await self.db.execute(
            select(
                ResponseAnswer.answer_value,
                func.count(ResponseAnswer.answer_id).label('count')
            )
            .join(Response)
            .where(
                and_(
                    ResponseAnswer.question_id == question_id,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
            .group_by(ResponseAnswer.answer_value)
            .order_by(desc('count'))
            .limit(10)
        )
        
        popular = []
        for answer_value, count in result:
            if answer_value:  # Skip null values
                popular.append({
                    "answer": answer_value,
                    "count": count,
                })
        
        return popular
    
    # =========================================================================
    # DEVICE & LOCATION ANALYTICS
    # =========================================================================
    
    async def _get_device_breakdown(
        self,
        funnel_id: str,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Get device type breakdown.
        
        Args:
            funnel_id: Funnel ID
            start_date: Start date
            end_date: End date
        
        Returns:
            Device breakdown
        """
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        result = await self.db.execute(
            select(
                Response.device_type,
                func.count(Response.response_id).label('count')
            )
            .where(
                and_(
                    Response.funnel_id == funnel_id,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
            .group_by(Response.device_type)
        )
        
        device_breakdown = {}
        total = 0
        
        for device_type, count in result:
            device_breakdown[device_type or "unknown"] = count
            total += count
        
        # Calculate percentages
        device_percentages = {}
        for device, count in device_breakdown.items():
            device_percentages[device] = {
                "count": count,
                "percentage": round((count / total * 100), 2) if total > 0 else 0
            }
        
        return device_percentages
    
    async def _get_traffic_sources(
        self,
        funnel_id: str,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """
        Get traffic sources.
        
        Args:
            funnel_id: Funnel ID
            start_date: Start date
            end_date: End date
        
        Returns:
            Traffic sources
        """
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        result = await self.db.execute(
            select(
                Response.utm_source,
                Response.utm_medium,
                func.count(Response.response_id).label('count')
            )
            .where(
                and_(
                    Response.funnel_id == funnel_id,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
            .group_by(Response.utm_source, Response.utm_medium)
            .order_by(desc('count'))
            .limit(10)
        )
        
        sources = []
        for utm_source, utm_medium, count in result:
            sources.append({
                "source": utm_source or "direct",
                "medium": utm_medium or "none",
                "visits": count,
            })
        
        return sources
    
    # =========================================================================
    # DROP-OFF ANALYSIS
    # =========================================================================
    
    async def get_drop_off_analysis(
        self,
        funnel_id: str,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Analyze where users drop off in funnel.
        
        Args:
            funnel_id: Funnel ID
            user_id: User ID
            start_date: Start date
            end_date: End date
        
        Returns:
            Drop-off analysis
        """
        # Verify ownership
        await self._get_funnel(funnel_id, user_id)
        
        # Set date range
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get questions
        questions_result = await self.db.execute(
            select(Question)
            .where(Question.funnel_id == funnel_id)
            .order_by(Question.display_order)
        )
        questions = questions_result.scalars().all()
        
        # Calculate drop-off at each step
        drop_off_points = []
        
        for i, question in enumerate(questions):
            # Users who reached this question
            reached_result = await self.db.execute(
                select(func.count(Response.response_id))
                .where(
                    and_(
                        Response.funnel_id == funnel_id,
                        Response.progress >= question.display_order,
                        Response.created_at.between(start_datetime, end_datetime)
                    )
                )
            )
            reached = reached_result.scalar_one() or 0
            
            # Users who answered this question
            answered_result = await self.db.execute(
                select(func.count(ResponseAnswer.answer_id))
                .join(Response)
                .where(
                    and_(
                        ResponseAnswer.question_id == question.question_id,
                        Response.created_at.between(start_datetime, end_datetime)
                    )
                )
            )
            answered = answered_result.scalar_one() or 0
            
            dropped = reached - answered
            drop_rate = (dropped / reached * 100) if reached > 0 else 0
            
            drop_off_points.append({
                "step": i + 1,
                "question_id": question.question_id,
                "question_text": question.question_text,
                "reached": reached,
                "answered": answered,
                "dropped": dropped,
                "drop_rate": round(drop_rate, 2),
            })
        
        return {
            "funnel_id": funnel_id,
            "drop_off_points": drop_off_points,
        }
    
    # =========================================================================
    # DASHBOARD DATA
    # =========================================================================
    
    async def get_dashboard_data(
        self,
        user_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get dashboard overview data for user.
        
        Args:
            user_id: User ID
            days: Number of days to analyze
        
        Returns:
            Dashboard data
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Total funnels
        funnels_result = await self.db.execute(
            select(func.count(Funnel.funnel_id))
            .where(
                and_(
                    Funnel.user_id == user_id,
                    Funnel.deleted_at.is_(None)
                )
            )
        )
        total_funnels = funnels_result.scalar_one() or 0
        
        # Total responses (period)
        responses_result = await self.db.execute(
            select(func.count(Response.response_id))
            .join(Funnel)
            .where(
                and_(
                    Funnel.user_id == user_id,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        total_responses = responses_result.scalar_one() or 0
        
        # Total completions (period)
        completions_result = await self.db.execute(
            select(func.count(Response.response_id))
            .join(Funnel)
            .where(
                and_(
                    Funnel.user_id == user_id,
                    Response.status == ResponseStatusEnum.COMPLETED,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        total_completions = completions_result.scalar_one() or 0
        
        # Total leads (period)
        leads_result = await self.db.execute(
            select(func.count(Lead.lead_id))
            .where(
                and_(
                    Lead.user_id == user_id,
                    Lead.created_at.between(start_datetime, end_datetime)
                )
            )
        )
        total_leads = leads_result.scalar_one() or 0
        
        # Top performing funnels
        top_funnels_result = await self.db.execute(
            select(
                Funnel.funnel_id,
                Funnel.title,
                func.count(Response.response_id).label('responses')
            )
            .join(Response, Response.funnel_id == Funnel.funnel_id)
            .where(
                and_(
                    Funnel.user_id == user_id,
                    Response.created_at.between(start_datetime, end_datetime)
                )
            )
            .group_by(Funnel.funnel_id, Funnel.title)
            .order_by(desc('responses'))
            .limit(5)
        )
        
        top_funnels = []
        for funnel_id, title, responses in top_funnels_result:
            top_funnels.append({
                "funnel_id": funnel_id,
                "title": title,
                "responses": responses,
            })
        
        dashboard = {
            "period_days": days,
            "summary": {
                "total_funnels": total_funnels,
                "total_responses": total_responses,
                "total_completions": total_completions,
                "total_leads": total_leads,
                "completion_rate": round(
                    calculate_completion_rate(total_completions, total_responses) * 100, 2
                ),
            },
            "top_funnels": top_funnels,
        }
        
        return dashboard
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    async def _get_funnel(self, funnel_id: str, user_id: str) -> Funnel:
        """Get funnel and verify ownership."""
        result = await self.db.execute(
            select(Funnel).where(
                and_(
                    Funnel.funnel_id == funnel_id,
                    Funnel.user_id == user_id
                )
            )
        )
        funnel = result.scalar_one_or_none()
        
        if not funnel:
            raise FunnelNotFoundException(funnel_id)
        
        return funnel


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["AnalyticsService" , "track_event"]
