# =============================================================================
# AI FUNNEL BUILDER - EMAIL SERVICE
# =============================================================================
# Transactional email sending with templates
# =============================================================================

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
import httpx

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.lead import Lead
from app.utils.exceptions import EmailException
from app.utils.logger import get_logger
from app.core.config import settings

logger = get_logger(__name__)


# =============================================================================
# EMAIL PROVIDERS
# =============================================================================

class EmailProvider(str, Enum):
    """Supported email providers."""
    SENDGRID = "sendgrid"
    AWS_SES = "aws_ses"
    SMTP = "smtp"


# =============================================================================
# EMAIL TYPES
# =============================================================================

class EmailType(str, Enum):
    """Email types for tracking."""
    VERIFICATION = "verification"
    PASSWORD_RESET = "password_reset"
    WELCOME = "welcome"
    LEAD_NOTIFICATION = "lead_notification"
    FUNNEL_COMPLETED = "funnel_completed"
    SUBSCRIPTION_CONFIRMED = "subscription_confirmed"
    PAYMENT_RECEIPT = "payment_receipt"
    TRIAL_ENDING = "trial_ending"


# =============================================================================
# EMAIL SERVICE
# =============================================================================

class EmailService:
    """
    Email sending service with template support.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize email service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.provider = EmailProvider(settings.EMAIL_PROVIDER)
        self.from_email = settings.EMAIL_FROM
        self.from_name = settings.EMAIL_FROM_NAME
        
        # Initialize template engine
        template_dir = Path(__file__).parent.parent / "templates" / "email"
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        # HTTP client for API-based providers
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.http_client.aclose()
    
    # =========================================================================
    # AUTHENTICATION EMAILS
    # =========================================================================
    
    async def send_verification_email(
        self,
        user: User,
        verification_token: str
    ) -> bool:
        """
        Send email verification email.
        
        Args:
            user: User to send to
            verification_token: Verification token
        
        Returns:
            True if sent successfully
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        subject = f"Verify your email for {settings.PROJECT_NAME}"
        
        template_data = {
            "user_name": user.full_name or "there",
            "verification_url": verification_url,
            "project_name": settings.PROJECT_NAME,
            "support_email": settings.SUPPORT_EMAIL,
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="verification.html",
            template_data=template_data,
            email_type=EmailType.VERIFICATION,
        )
    
    async def send_password_reset_email(
        self,
        user: User,
        reset_token: str
    ) -> bool:
        """
        Send password reset email.
        
        Args:
            user: User to send to
            reset_token: Reset token
        
        Returns:
            True if sent successfully
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        
        subject = "Reset your password"
        
        template_data = {
            "user_name": user.full_name or "there",
            "reset_url": reset_url,
            "expires_in": "1 hour",
            "project_name": settings.PROJECT_NAME,
            "support_email": settings.SUPPORT_EMAIL,
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="password_reset.html",
            template_data=template_data,
            email_type=EmailType.PASSWORD_RESET,
        )
    
    async def send_welcome_email(self, user: User) -> bool:
        """
        Send welcome email to new user.
        
        Args:
            user: New user
        
        Returns:
            True if sent successfully
        """
        subject = f"Welcome to {settings.PROJECT_NAME}! 🎉"
        
        template_data = {
            "user_name": user.full_name or "there",
            "project_name": settings.PROJECT_NAME,
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
            "getting_started_url": f"{settings.FRONTEND_URL}/getting-started",
            "support_email": settings.SUPPORT_EMAIL,
            "features": [
                "Create unlimited funnels",
                "Capture and manage leads",
                "Track analytics in real-time",
                "Integrate with your favorite tools",
            ],
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="welcome.html",
            template_data=template_data,
            email_type=EmailType.WELCOME,
        )
    
    # =========================================================================
    # LEAD NOTIFICATIONS
    # =========================================================================
    
    async def send_lead_notification(
        self,
        user: User,
        lead: Lead,
        funnel_name: str
    ) -> bool:
        """
        Notify user of new lead capture.
        
        Args:
            user: Funnel owner
            lead: Captured lead
            funnel_name: Funnel name
        
        Returns:
            True if sent successfully
        """
        subject = f"🎯 New lead captured: {lead.email}"
        
        template_data = {
            "user_name": user.full_name or "there",
            "lead_name": lead.full_name or lead.email,
            "lead_email": lead.email,
            "lead_phone": lead.phone,
            "lead_company": lead.company,
            "funnel_name": funnel_name,
            "lead_score": lead.score,
            "view_lead_url": f"{settings.FRONTEND_URL}/leads/{lead.lead_id}",
            "project_name": settings.PROJECT_NAME,
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="lead_notification.html",
            template_data=template_data,
            email_type=EmailType.LEAD_NOTIFICATION,
        )
    
    async def send_funnel_completed_notification(
        self,
        user_email: str,
        user_name: str,
        funnel_name: str,
        completion_data: Dict[str, Any]
    ) -> bool:
        """
        Send notification when someone completes a funnel.
        
        Args:
            user_email: User email
            user_name: User name
            funnel_name: Funnel name
            completion_data: Completion details
        
        Returns:
            True if sent successfully
        """
        subject = f"✅ Funnel completed: {funnel_name}"
        
        template_data = {
            "user_name": user_name or "there",
            "funnel_name": funnel_name,
            "completion_time": completion_data.get("completion_time", "N/A"),
            "answers_count": completion_data.get("answers_count", 0),
            "dashboard_url": f"{settings.FRONTEND_URL}/dashboard",
            "project_name": settings.PROJECT_NAME,
        }
        
        return await self._send_templated_email(
            to_email=user_email,
            to_name=user_name,
            subject=subject,
            template_name="funnel_completed.html",
            template_data=template_data,
            email_type=EmailType.FUNNEL_COMPLETED,
        )
    
    # =========================================================================
    # SUBSCRIPTION EMAILS
    # =========================================================================
    
    async def send_subscription_confirmation(
        self,
        user: User,
        plan_name: str,
        plan_price: float,
        next_billing_date: datetime
    ) -> bool:
        """
        Send subscription confirmation email.
        
        Args:
            user: User
            plan_name: Subscription plan name
            plan_price: Monthly price
            next_billing_date: Next billing date
        
        Returns:
            True if sent successfully
        """
        subject = f"Subscription Confirmed: {plan_name} Plan"
        
        template_data = {
            "user_name": user.full_name or "there",
            "plan_name": plan_name,
            "plan_price": f"${plan_price:.2f}",
            "next_billing_date": next_billing_date.strftime("%B %d, %Y"),
            "billing_url": f"{settings.FRONTEND_URL}/billing",
            "project_name": settings.PROJECT_NAME,
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="subscription_confirmed.html",
            template_data=template_data,
            email_type=EmailType.SUBSCRIPTION_CONFIRMED,
        )
    
    async def send_trial_ending_reminder(
        self,
        user: User,
        days_remaining: int
    ) -> bool:
        """
        Send trial ending reminder.
        
        Args:
            user: User
            days_remaining: Days remaining in trial
        
        Returns:
            True if sent successfully
        """
        subject = f"Your trial ends in {days_remaining} days"
        
        template_data = {
            "user_name": user.full_name or "there",
            "days_remaining": days_remaining,
            "upgrade_url": f"{settings.FRONTEND_URL}/upgrade",
            "project_name": settings.PROJECT_NAME,
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="trial_ending.html",
            template_data=template_data,
            email_type=EmailType.TRIAL_ENDING,
        )
    
    # =========================================================================
    # PAYMENT EMAILS
    # =========================================================================
    
    async def send_payment_receipt(
        self,
        user: User,
        amount: float,
        currency: str,
        invoice_url: str
    ) -> bool:
        """
        Send payment receipt email.
        
        Args:
            user: User
            amount: Payment amount
            currency: Currency code
            invoice_url: URL to invoice
        
        Returns:
            True if sent successfully
        """
        subject = f"Payment Receipt - {currency.upper()} {amount:.2f}"
        
        template_data = {
            "user_name": user.full_name or "there",
            "amount": f"{amount:.2f}",
            "currency": currency.upper(),
            "payment_date": datetime.utcnow().strftime("%B %d, %Y"),
            "invoice_url": invoice_url,
            "project_name": settings.PROJECT_NAME,
            "support_email": settings.SUPPORT_EMAIL,
        }
        
        return await self._send_templated_email(
            to_email=user.email,
            to_name=user.full_name,
            subject=subject,
            template_name="payment_receipt.html",
            template_data=template_data,
            email_type=EmailType.PAYMENT_RECEIPT,
        )
    
    # =========================================================================
    # CORE EMAIL SENDING
    # =========================================================================
    
    async def _send_templated_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        template_data: Dict[str, Any],
        to_name: Optional[str] = None,
        email_type: Optional[EmailType] = None,
    ) -> bool:
        """
        Send email using template.
        
        Args:
            to_email: Recipient email
            subject: Email subject
            template_name: Template filename
            template_data: Data for template
            to_name: Recipient name
            email_type: Email type for tracking
        
        Returns:
            True if sent successfully
        """
        try:
            # Render HTML template
            html_body = self._render_template(template_name, template_data)
            
            # Render text version (fallback)
            text_template = template_name.replace('.html', '.txt')
            try:
                text_body = self._render_template(text_template, template_data)
            except Exception:
                # If text template doesn't exist, create simple version
                text_body = self._html_to_text(html_body)
            
            # Send email based on provider
            if self.provider == EmailProvider.SENDGRID:
                success = await self._send_via_sendgrid(
                    to_email, to_name, subject, html_body, text_body
                )
            elif self.provider == EmailProvider.AWS_SES:
                success = await self._send_via_ses(
                    to_email, to_name, subject, html_body, text_body
                )
            else:
                success = await self._send_via_smtp(
                    to_email, to_name, subject, html_body, text_body
                )
            
            if success:
                logger.info(
                    f"Email sent: {email_type.value if email_type else 'unknown'}",
                    extra={
                        "to_email": to_email,
                        "subject": subject,
                        "email_type": email_type.value if email_type else None,
                    }
                )
            
            return success
        
        except Exception as e:
            logger.error(f"Email send failed: {e}", exc_info=True)
            return False
    
    def _render_template(
        self,
        template_name: str,
        data: Dict[str, Any]
    ) -> str:
        """
        Render email template.
        
        Args:
            template_name: Template filename
            data: Template data
        
        Returns:
            Rendered HTML
        """
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**data)
        except Exception as e:
            logger.error(f"Template render failed: {e}")
            raise EmailException(f"Failed to render template: {template_name}")
    
    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text (simple version)."""
        import re
        # Remove HTML tags
        text = re.sub('<[^<]+?>', '', html)
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    # =========================================================================
    # PROVIDER IMPLEMENTATIONS
    # =========================================================================
    
    async def _send_via_sendgrid(
        self,
        to_email: str,
        to_name: Optional[str],
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        """
        Send email via SendGrid API.
        
        Args:
            to_email: Recipient email
            to_name: Recipient name
            subject: Email subject
            html_body: HTML body
            text_body: Text body
        
        Returns:
            True if sent successfully
        """
        url = "https://api.sendgrid.com/v3/mail/send"
        
        headers = {
            "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "personalizations": [
                {
                    "to": [{"email": to_email, "name": to_name or to_email}],
                    "subject": subject,
                }
            ],
            "from": {
                "email": self.from_email,
                "name": self.from_name,
            },
            "content": [
                {"type": "text/plain", "value": text_body},
                {"type": "text/html", "value": html_body},
            ],
        }
        
        try:
            response = await self.http_client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            return True
        
        except httpx.HTTPError as e:
            logger.error(f"SendGrid error: {e}")
            return False
    
    async def _send_via_ses(
        self,
        to_email: str,
        to_name: Optional[str],
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        """
        Send email via AWS SES.
        
        Args:
            to_email: Recipient email
            to_name: Recipient name
            subject: Email subject
            html_body: HTML body
            text_body: Text body
        
        Returns:
            True if sent successfully
        """
        # TODO: Implement AWS SES using boto3
        logger.warning("AWS SES not yet implemented")
        return False
    
    async def _send_via_smtp(
        self,
        to_email: str,
        to_name: Optional[str],
        subject: str,
        html_body: str,
        text_body: str
    ) -> bool:
        """
        Send email via SMTP.
        
        Args:
            to_email: Recipient email
            to_name: Recipient name
            subject: Email subject
            html_body: HTML body
            text_body: Text body
        
        Returns:
            True if sent successfully
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = f"{to_name or to_email} <{to_email}>"
            
            # Add text and HTML parts
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            message.attach(part1)
            message.attach(part2)
            
            # Send via SMTP
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_TLS,
            )
            
            return True
        
        except Exception as e:
            logger.error(f"SMTP error: {e}", exc_info=True)
            return False
    
    # =========================================================================
    # BULK OPERATIONS
    # =========================================================================
    
    async def send_bulk_emails(
        self,
        recipients: List[Dict[str, str]],
        subject: str,
        template_name: str,
        template_data: Dict[str, Any]
    ) -> Dict[str, int]:
        """
        Send bulk emails (e.g., announcements).
        
        Args:
            recipients: List of {email, name} dicts
            subject: Email subject
            template_name: Template filename
            template_data: Template data
        
        Returns:
            Statistics {sent, failed}
        """
        sent = 0
        failed = 0
        
        for recipient in recipients:
            success = await self._send_templated_email(
                to_email=recipient["email"],
                to_name=recipient.get("name"),
                subject=subject,
                template_name=template_name,
                template_data=template_data,
            )
            
            if success:
                sent += 1
            else:
                failed += 1
        
        logger.info(
            f"Bulk email completed: {sent} sent, {failed} failed",
            extra={"sent": sent, "failed": failed}
        )
        
        return {"sent": sent, "failed": failed}


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["EmailService", "EmailType", "EmailProvider"]
