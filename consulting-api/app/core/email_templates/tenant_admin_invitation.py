"""Tenant Admin Invitation email — sent once, when a new tenant is created,
to the person provisioned as that tenant's administrator."""

from __future__ import annotations

from html import escape as _esc

from app.core.email_templates.base import (
    EmailContent,
    InfoRow,
    render_email_html,
    render_email_text,
)

_CTA_LABEL = "Accept Invitation & Set Password"


def _expiry_note(expires_in_days: int) -> str:
    unit = "day" if expires_in_days == 1 else "days"
    return f"This invitation expires in {expires_in_days} {unit}."


_SECURITY_NOTICE = (
    "This link is unique to you and lets you set your own password — we never send "
    "passwords by email. If you weren't expecting this invitation, you can safely "
    "ignore it; no account will be activated until the link above is used. Please "
    "don't forward this email or share the link with anyone else."
)


def render_tenant_admin_invitation_email(
    *,
    company_name: str,
    tenant_name: str,
    recipient_name: str,
    recipient_email: str,
    invitation_url: str,
    expires_in_days: int,
    company_logo_url: str | None,
    support_email: str,
    current_year: int,
) -> EmailContent:
    subject = f"You're invited to manage {tenant_name}"
    eyebrow = "You're invited"
    heading = f"Welcome to {tenant_name}"
    expiry_note = _expiry_note(expires_in_days)

    intro_html = (
        f'<p style="margin:0 0 14px;">Hi {_esc(recipient_name)},</p>'
        f'<p style="margin:0 0 14px;">'
        f"Your organization <strong>{_esc(tenant_name)}</strong> has been created on "
        f"{_esc(company_name)}, and your account has been set up as its "
        f"<strong>Tenant Administrator</strong>."
        f"</p>"
        f'<p style="margin:0;">'
        f"Activate your administrative account below to set your password and start "
        f"managing employees, roles, and permissions for your organization."
        f"</p>"
    )
    intro_text = (
        f"Hi {recipient_name},\n\n"
        f"Your organization {tenant_name} has been created on {company_name}, and "
        f"your account has been set up as its Tenant Administrator.\n\n"
        f"Activate your administrative account below to set your password and start "
        f"managing employees, roles, and permissions for your organization."
    )

    info_rows = [
        InfoRow("Account email", recipient_email),
        InfoRow("Role", "Tenant Administrator"),
        InfoRow("Organization", tenant_name),
    ]

    html = render_email_html(
        subject=subject,
        preheader=f"Your Tenant Administrator account for {tenant_name} is ready to activate.",
        brand_name=company_name,
        brand_logo_url=company_logo_url,
        eyebrow=eyebrow,
        heading=heading,
        intro_html=intro_html,
        info_rows=info_rows,
        cta_label=_CTA_LABEL,
        cta_url=invitation_url,
        expiry_note=expiry_note,
        security_notice=_SECURITY_NOTICE,
        support_email=support_email,
        current_year=current_year,
    )
    text = render_email_text(
        eyebrow=eyebrow,
        heading=heading,
        intro_text=intro_text,
        info_rows=info_rows,
        cta_label=_CTA_LABEL,
        cta_url=invitation_url,
        expiry_note=expiry_note,
        security_notice=_SECURITY_NOTICE,
        brand_name=company_name,
        support_email=support_email,
        current_year=current_year,
    )
    return EmailContent(subject=subject, html=html, text=text)
