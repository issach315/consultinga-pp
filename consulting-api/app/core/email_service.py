"""Single place that sends invitation emails — resolves the per-tenant invite
link, picks the right template, and dispatches through MailClient. Routers
must call this instead of building subject/body strings themselves, so the
two invitation flows (tenant admin, employee) never drift out of sync."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from app.core.config import get_settings
from app.core.email_templates import EmailContent
from app.core.email_templates.employee_invitation import render_employee_invitation_email
from app.core.email_templates.tenant_admin_invitation import render_tenant_admin_invitation_email
from app.core.mail import MailClient, get_mail_client
from app.core.urls import build_frontend_url
from app.modules.employees.schemas import EmployeeOut
from app.modules.tenants.schemas import TenantOut

logger = logging.getLogger(__name__)


class InvitationEmailService:
    """Sends the enterprise tenant-admin and employee invitation emails."""

    def __init__(self, mail_client: MailClient | None = None) -> None:
        self._mail_client = mail_client or get_mail_client()

    async def send_tenant_admin_invitation(self, *, tenant: TenantOut, raw_token: str) -> bool:
        settings = get_settings()
        content = render_tenant_admin_invitation_email(
            company_name=settings.app_name,
            tenant_name=tenant.display_name or tenant.legal_company_name,
            recipient_name=tenant.admin_first_name,
            recipient_email=tenant.admin_email,
            invitation_url=_invitation_url(tenant.subdomain, raw_token),
            expires_in_days=settings.invitation_expiry_days,
            company_logo_url=tenant.logo_url,
            support_email=tenant.support_email or settings.support_email,
            current_year=_current_year(),
        )
        return await self._dispatch(content, tenant.admin_email, "tenant admin")

    async def send_employee_invitation(
        self,
        *,
        tenant: TenantOut,
        employee: EmployeeOut,
        raw_token: str,
        inviter_name: str,
        employee_role_label: str,
        is_reset: bool = False,
    ) -> bool:
        settings = get_settings()
        content = render_employee_invitation_email(
            company_name=settings.app_name,
            tenant_name=tenant.display_name or tenant.legal_company_name,
            recipient_name=employee.first_name,
            recipient_email=employee.email,
            employee_role=employee_role_label,
            inviter_name=inviter_name,
            invitation_url=_invitation_url(tenant.subdomain, raw_token),
            expires_in_days=settings.invitation_expiry_days,
            company_logo_url=tenant.logo_url,
            support_email=tenant.support_email or settings.support_email,
            current_year=_current_year(),
            is_reset=is_reset,
        )
        return await self._dispatch(content, employee.email, "employee")

    async def _dispatch(self, content: EmailContent, to: str, kind: str) -> bool:
        """Returns whether the email actually sent — callers must not report
        success to the client when this is False. A transient SMTP failure
        shouldn't roll back the account/invitation record already committed,
        but it also must not be reported as an email that went out."""
        try:
            await self._mail_client.send(
                to=to, subject=content.subject, body=content.text, html=content.html
            )
            return True
        except Exception:
            logger.exception("Failed to send %s invitation email to %s", kind, to)
            return False


def _invitation_url(subdomain: str, raw_token: str) -> str:
    return build_frontend_url(subdomain, f"/accept-invite/{raw_token}")


def _current_year() -> int:
    return datetime.now(UTC).year


def get_invitation_email_service() -> InvitationEmailService:
    return InvitationEmailService()
