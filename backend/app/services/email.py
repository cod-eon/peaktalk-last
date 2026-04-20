"""Email service for weekly scenario digest and notifications."""
import json
import logging
import os
from datetime import datetime, timezone

import httpx

logger = logging.getLogger("peaktalk.email")

_RESEND_API_URL = "https://api.resend.com/emails"
_FROM_ADDRESS = os.getenv("EMAIL_FROM_ADDRESS", "PeakTalk <noreply@peaktalk.ru>")


def _get_api_key() -> str | None:
    return os.getenv("RESEND_API_KEY")


async def _send_via_resend(to: str, subject: str, html: str) -> bool:
    api_key = _get_api_key()
    if not api_key:
        logger.warning("email: RESEND_API_KEY not set, skipping send to %s", to)
        return False

    payload = {
        "from": _FROM_ADDRESS,
        "to": [to],
        "subject": subject,
        "html": html,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            _RESEND_API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        if resp.status_code in (200, 201, 202):
            logger.info("email: sent to %s subject=%s", to, subject)
            return True
        logger.error(
            "email: failed to=%s status=%d body=%s",
            to, resp.status_code, resp.text,
        )
        return False


WEEKLY_TEMPLATE = """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 32px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb;">
    <tr>
      <td style="padding: 32px 24px 16px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #E8600A; font-weight: 700;">PeakTalk</span>
        <span style="font-size: 11px; color: #a3a3a3; margin-left: 8px;">Еженедельный сценарий</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 8px;">{title}</h1>
        <p style="font-size: 14px; color: #737373; line-height: 1.6; margin: 0 0 16px;">{subtitle}</p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; margin: 16px 0;">
          <p style="font-size: 13px; color: #525252; line-height: 1.6; margin: 0; white-space: pre-line;">{situation}</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 4px 0;">
              <span style="font-size: 11px; color: #a3a3a3;">ПЕРСОНА</span><br>
              <span style="font-size: 13px; font-weight: 600; color: #171717;">{persona}</span>
            </td>
            <td style="padding: 4px 0; text-align: right;">
              <span style="font-size: 11px; color: #a3a3a3;">СЛОЖНОСТЬ</span><br>
              <span style="font-size: 13px; font-weight: 600; color: #171717;">{difficulty}/5</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 24px 24px;">
        <a href="{cta_url}" style="display: block; background: #171717; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 24px; text-align: center; width: 100%; box-sizing: border-box;">
          Попробовать 3 вопроса бесплатно &rarr;
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #a3a3a3; text-align: center;">
        PeakTalk &mdash; стресс-тест аргументации до реальной встречи
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_weekly_scenario_email(
    to_email: str,
    scenario_title: str,
    scenario_subtitle: str,
    situation: str,
    persona: str,
    difficulty: int,
    scenario_slug: str,
    base_url: str = "https://peaktalk.ru",
) -> bool:
    cta_url = f"{base_url}/scenarios/{scenario_slug}"
    html = WEEKLY_TEMPLATE.format(
        title=scenario_title,
        subtitle=scenario_subtitle,
        situation=situation,
        persona=persona,
        difficulty=difficulty,
        cta_url=cta_url,
    )
    subject = f"Сценарий недели: {scenario_title}"
    return await _send_via_resend(to_email, subject, html)
