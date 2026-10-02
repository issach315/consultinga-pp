"""Employee Invitation email — sent when a tenant admin onboards a new
employee, and reused (as a "reset password" variant) when re-issuing a
credential link for an employee who already has an account."""

from __future__ import annotations

from html import escape as _esc

from app.core.email_templates.base import (
    EmailContent,
    InfoRow,
    render_email_html,
    render_email_text,
)

_INVITE_CTA_LABEL = "Accept Invitation & Set Password"
_RESET_CTA_LABEL = "Reset Password"


def _expiry_note(expires_in_days: int) -> str:
    unit = "day" if expires_in_days == 1 else "days"
    return f"This invitation expires in {expires_in_days} {unit}."


_SECURITY_NOTICE = (
    "This link is unique to you and lets you set your own password — we never send "
    "passwords by email. If you weren't expecting this invitation, you can safely "
    "ignore it; no account will be activated until the link above is used. Please "
    "don't forward this email or share the link with anyone else."
)


def _invite_copy(
    recipient_name: str, inviter_name: str, tenant_name: str, employee_role: str
) -> tuple[str, str]:
    intro_html = (
        f'<p style="margin:0 0 14px;">Hi {_esc(recipient_name)},</p>'
        f'<p style="margin:0 0 14px;">'
        f"<strong>{_esc(inviter_name)}</strong> has invited you to join "
        f"<strong>{_esc(tenant_name)}</strong>. You've been assigned the "
        f"<strong>{_esc(employee_role)}</strong> role."
        f"</p>"
        f'<p style="margin:0;">'
        f"Activate your employee account below to set your password and get started."
        f"</p>"
    )
    intro_text = (
        f"Hi {recipient_name},\n\n"
        f"{inviter_name} has invited you to join {tenant_name}. You've been assigned "
        f"the {employee_role} role.\n\n"
        f"Activate your employee account below to set your password and get started."
    )
    return intro_html, intro_text


def _reset_copy(recipient_name: str, tenant_name: str) -> tuple[str, str]:
    intro_html = (
        f'<p style="margin:0 0 14px;">Hi {_esc(recipient_name)},</p>'
        f'<p style="margin:0;">'
        f"Use the secure link below to set a new password for your "
        f"<strong>{_esc(tenant_name)}</strong> account."
        f"</p>"
    )
    intro_text = (
        f"Hi {recipient_name},\n\n"
        f"Use the secure link below to set a new password for your {tenant_name} account."
    )
    return intro_html, intro_text


def render_employee_invitation_email(
    *,
    company_name: str,
    tenant_name: str,
    recipient_name: str,
    recipient_email: str,
    employee_role: str,
    inviter_name: str,
    invitation_url: str,
    expires_in_days: int,
    company_logo_url: str | None,
    support_email: str,
    current_year: int,
    is_reset: bool = False,
) -> EmailContent:
    expiry_note = _expiry_note(expires_in_days)

    if is_reset:
        subject = f"Reset your {tenant_name} password"
        eyebrow = "Password reset"
        heading = f"Reset your {tenant_name} password"
        cta_label = _RESET_CTA_LABEL
        intro_html, intro_text = _reset_copy(recipient_name, tenant_name)
    else:
        subject = f"You're invited to join {tenant_name}"
        eyebrow = "You're invited"
        heading = f"Welcome to {tenant_name}"
        cta_label = _INVITE_CTA_LABEL
        intro_html, intro_text = _invite_copy(
            recipient_name, inviter_name, tenant_name, employee_role
        )

    info_rows = [
        InfoRow("Account email", recipient_email),
        InfoRow("Role", employee_role),
        InfoRow("Organization", tenant_name),
    ]
    if not is_reset:
        info_rows.append(InfoRow("Invited by", inviter_name))

    preheader = (
        f"Set a new password for your {tenant_name} account."
        if is_reset
        else f"You've been invited to join {tenant_name} as {employee_role}."
    )

    html = render_email_html(
        subject=subject,
        preheader=preheader,
        brand_name=company_name,
        brand_logo_url=company_logo_url,
        eyebrow=eyebrow,
        heading=heading,
        intro_html=intro_html,
        info_rows=info_rows,
        cta_label=cta_label,
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
        cta_label=cta_label,
        cta_url=invitation_url,
        expiry_note=expiry_note,
        security_notice=_SECURITY_NOTICE,
        brand_name=company_name,
        support_email=support_email,
        current_year=current_year,
    )
    return EmailContent(subject=subject, html=html, text=text)
