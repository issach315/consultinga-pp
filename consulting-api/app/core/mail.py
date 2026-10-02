from email.message import EmailMessage

import aiosmtplib

from app.core.config import get_settings

settings = get_settings()


class MailClient:
    """Reusable SMTP client abstraction, backed by Mailpit in development."""

    async def send(self, to: str, subject: str, body: str, html: str | None = None) -> None:
        message = EmailMessage()
        message["From"] = f"{settings.mail_from_name} <{settings.mail_from}>"
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        if html:
            message.add_alternative(html, subtype="html")

        await aiosmtplib.send(
            message,
            hostname=settings.mail_host,
            port=settings.mail_port,
            username=settings.mail_username or None,
            password=settings.mail_password or None,
            use_tls=settings.mail_use_tls,
            start_tls=settings.mail_start_tls,
        )


def get_mail_client() -> MailClient:
    return MailClient()


async def ping_mail() -> bool:
    try:
        smtp = aiosmtplib.SMTP(hostname=settings.mail_host, port=settings.mail_port)
        await smtp.connect()
        await smtp.quit()
        return True
    except Exception:
        return False
