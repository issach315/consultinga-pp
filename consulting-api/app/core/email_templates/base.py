"""Shared enterprise-grade HTML/plain-text email layout.

Every transactional email (tenant-admin invitation, employee invitation, and
any future one) is built from this single layout instead of hand-rolling its
own HTML, so the visual design only lives in one place:

    BaseEmailTemplate
    ├── Header          (_render_header)
    ├── Content         (heading + intro + account info card)
    ├── CTA             (_render_cta)
    ├── SecurityNotice  (_render_security_notice)
    └── Footer          (_render_footer)

No templating engine is used — the codebase has no Jinja2 dependency, and a
handful of composable string-building functions is simpler and avoids
introducing one. All dynamic values are HTML-escaped before interpolation
(``_esc``) since they can contain user-supplied data (tenant/company legal
names, recipient names) — this is a plain-string template, not an
autoescaping one, so every call site must go through it.

Markup deliberately uses `<table>`-based layout with inline styles (rather
than flexbox/grid) because that's what renders consistently across Gmail,
Outlook desktop/web, and mobile mail clients — the same reason no CSS
gradients, animations, or box-shadows are used anywhere in this file.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape as _esc

BRAND_COLOR = "#4f46e5"
TEXT_PRIMARY = "#111827"
TEXT_SECONDARY = "#6b7280"
BORDER_COLOR = "#e5e7eb"
PAGE_BG = "#f4f5f7"
CARD_BG = "#ffffff"
MUTED_BG = "#f9fafb"
FOOTER_MUTED = "#9ca3af"

FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

_STYLE_BLOCK = """
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; height:auto; line-height:100%;
          outline:none; text-decoration:none; }
    body { margin:0 !important; padding:0 !important; width:100% !important; }
    @media screen and (max-width: 600px) {
      .email-container { width:100% !important; }
      .email-px { padding-left:20px !important; padding-right:20px !important; }
    }
"""


@dataclass(frozen=True)
class EmailContent:
    """The fully rendered, ready-to-send email produced by a template."""

    subject: str
    html: str
    text: str


@dataclass(frozen=True)
class InfoRow:
    label: str
    value: str


def _render_header(brand_name: str, brand_logo_url: str | None) -> str:
    if brand_logo_url:
        brand_mark = (
            f'<img src="{_esc(brand_logo_url)}" alt="{_esc(brand_name)}" height="32" '
            f'style="height:32px;max-width:220px;object-fit:contain;display:block;" />'
        )
    else:
        brand_mark = (
            f'<span style="font-family:{FONT_STACK};font-size:18px;font-weight:700;'
            f'color:{TEXT_PRIMARY};letter-spacing:-0.01em;">{_esc(brand_name)}</span>'
        )
    header_td_style = f"padding:30px 40px 24px;border-bottom:1px solid {BORDER_COLOR};"
    return f"""
        <tr>
          <td class="email-px" style="{header_td_style}">
            {brand_mark}
          </td>
        </tr>"""


def _render_info_card(info_rows: list[InfoRow]) -> str:
    if not info_rows:
        return ""
    row_cells = []
    last = len(info_rows) - 1
    for i, row in enumerate(info_rows):
        cell_border = "" if i == last else f"border-bottom:1px solid {BORDER_COLOR};"
        label_style = (
            f"padding:11px 0;{cell_border}font-family:{FONT_STACK};font-size:13px;"
            f"color:{TEXT_SECONDARY};width:38%;vertical-align:top;"
        )
        value_style = (
            f"padding:11px 0;{cell_border}font-family:{FONT_STACK};font-size:13px;"
            f"color:{TEXT_PRIMARY};font-weight:600;text-align:right;vertical-align:top;"
        )
        row_cells.append(
            f"""
              <tr>
                <td style="{label_style}">{_esc(row.label)}</td>
                <td style="{value_style}">{_esc(row.value)}</td>
              </tr>"""
        )
    rows_html = "".join(row_cells)
    card_style = f"background-color:{MUTED_BG};border:1px solid {BORDER_COLOR};border-radius:8px;"
    return f"""
        <tr>
          <td class="email-px" style="padding:4px 40px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="{card_style}">
              <tr>
                <td style="padding:6px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                         border="0">
                    {rows_html}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>"""


def _render_content(
    eyebrow: str, heading: str, intro_html: str, info_rows: list[InfoRow]
) -> str:
    eyebrow_style = (
        f"margin:0 0 12px;font-family:{FONT_STACK};font-size:12px;font-weight:700;"
        f"letter-spacing:0.07em;text-transform:uppercase;color:{BRAND_COLOR};"
    )
    heading_style = (
        f"margin:0 0 18px;font-family:{FONT_STACK};font-size:22px;line-height:1.35;"
        f"font-weight:700;color:{TEXT_PRIMARY};"
    )
    intro_style = (
        f"font-family:{FONT_STACK};font-size:15px;line-height:1.65;color:{TEXT_SECONDARY};"
    )
    content = f"""
        <tr>
          <td class="email-px" style="padding:36px 40px 20px;">
            <p style="{eyebrow_style}">{_esc(eyebrow)}</p>
            <h1 style="{heading_style}">{_esc(heading)}</h1>
            <div style="{intro_style}">
              {intro_html}
            </div>
          </td>
        </tr>"""
    return content + _render_info_card(info_rows)


def _render_cta(cta_label: str, cta_url: str, expiry_note: str) -> str:
    button_style = (
        f"display:inline-block;padding:14px 34px;font-family:{FONT_STACK};font-size:15px;"
        f"font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;"
    )
    expiry_style = f"margin:0;font-family:{FONT_STACK};font-size:12.5px;color:{TEXT_SECONDARY};"
    return f"""
        <tr>
          <td class="email-px" align="center" style="padding:32px 40px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="{BRAND_COLOR}" style="border-radius:6px;">
                  <a href="{_esc(cta_url)}" target="_blank" rel="noopener" style="{button_style}">
                    {_esc(cta_label)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="email-px" align="center" style="padding:8px 40px 4px;">
            <p style="{expiry_style}">{_esc(expiry_note)}</p>
          </td>
        </tr>"""


def _render_security_notice(security_notice: str) -> str:
    box_style = (
        f"background-color:{MUTED_BG};border-left:3px solid {BRAND_COLOR};"
        f"border-radius:0 6px 6px 0;"
    )
    text_style = (
        f"margin:0;font-family:{FONT_STACK};font-size:12.5px;line-height:1.6;"
        f"color:{TEXT_SECONDARY};"
    )
    return f"""
        <tr>
          <td class="email-px" style="padding:24px 40px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="{box_style}">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="{text_style}">{_esc(security_notice)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>"""


def _render_footer(brand_name: str, support_email: str, current_year: int) -> str:
    td_style = (
        f"padding:28px 40px 32px;border-top:1px solid {BORDER_COLOR};"
        f"background-color:{MUTED_BG};"
    )
    name_style = (
        f"margin:0 0 6px;font-family:{FONT_STACK};font-size:13px;font-weight:600;"
        f"color:{TEXT_PRIMARY};"
    )
    line_style = (
        f"margin:0 0 4px;font-family:{FONT_STACK};font-size:12px;line-height:1.6;"
        f"color:{TEXT_SECONDARY};"
    )
    contact_style = f"margin:0;font-family:{FONT_STACK};font-size:12px;color:{TEXT_SECONDARY};"
    copyright_style = (
        f"margin:14px 0 0;font-family:{FONT_STACK};font-size:11px;color:{FOOTER_MUTED};"
    )
    contact_link_style = f"color:{BRAND_COLOR};text-decoration:none;"
    return f"""
        <tr>
          <td class="email-px" style="{td_style}">
            <p style="{name_style}">{_esc(brand_name)}</p>
            <p style="{line_style}">
              This is an automated account invitation.<br />Please do not reply to this email.
            </p>
            <p style="{contact_style}">
              For assistance, contact
              <a href="mailto:{_esc(support_email)}" style="{contact_link_style}">
                {_esc(support_email)}</a>.
            </p>
            <p style="{copyright_style}">
              &copy; {current_year} {_esc(brand_name)}. All rights reserved.
            </p>
          </td>
        </tr>"""


def render_email_html(
    *,
    subject: str,
    preheader: str,
    brand_name: str,
    brand_logo_url: str | None,
    eyebrow: str,
    heading: str,
    intro_html: str,
    info_rows: list[InfoRow],
    cta_label: str,
    cta_url: str,
    expiry_note: str,
    security_notice: str,
    support_email: str,
    current_year: int,
) -> str:
    """Assembles the full HTML document from the shared layout sections."""
    body = "".join(
        [
            _render_header(brand_name, brand_logo_url),
            _render_content(eyebrow, heading, intro_html, info_rows),
            _render_cta(cta_label, cta_url, expiry_note),
            _render_security_notice(security_notice),
            _render_footer(brand_name, support_email, current_year),
        ]
    )
    card_style = (
        f"width:600px;max-width:600px;background-color:{CARD_BG};"
        f"border:1px solid {BORDER_COLOR};border-radius:12px;"
    )
    page_bg_style = f"background-color:{PAGE_BG};"
    preheader_style = "display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light" />
<title>{_esc(subject)}</title>
<style>{_STYLE_BLOCK}</style>
</head>
<body style="margin:0;padding:0;{page_bg_style}">
  <div style="{preheader_style}">{_esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="{page_bg_style}">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0"
               cellspacing="0" border="0" style="{card_style}">
          {body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def render_email_text(
    *,
    eyebrow: str,
    heading: str,
    intro_text: str,
    info_rows: list[InfoRow],
    cta_label: str,
    cta_url: str,
    expiry_note: str,
    security_notice: str,
    brand_name: str,
    support_email: str,
    current_year: int,
) -> str:
    """Plain-text alternative for clients that don't render HTML. The
    invitation URL necessarily appears as visible text here — there's no way
    to "hide" a link behind a button in plain text — but nowhere else."""
    info_lines = "\n".join(f"{row.label}: {row.value}" for row in info_rows)
    lines = [eyebrow, "", heading, "", intro_text]
    if info_lines:
        lines += ["", info_lines]
    lines += [
        "",
        f"{cta_label}: {cta_url}",
        "",
        expiry_note,
        "",
        security_notice,
        "",
        "---",
        brand_name,
        "This is an automated account invitation. Please do not reply to this email.",
        f"For assistance, contact {support_email}.",
        f"© {current_year} {brand_name}. All rights reserved.",
    ]
    return "\n".join(lines)
