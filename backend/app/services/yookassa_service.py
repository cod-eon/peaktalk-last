"""YooKassa integration for PeakTalk subscriptions.

Docs: https://yookassa.ru/developers/api
Python SDK: yookassa

Payment flows:
1. User clicks "Upgrade" → POST /billing/payment → create_payment() → return payment_url
2. User pays → YooKassa sends webhook → POST /webhooks/yookassa
3. payment.succeeded → activate subscription + save payment_method_id for recurrent
4. Monthly auto-charge → charge_recurring() with saved payment_method_id
5. payment.cancelled/failed → set subscription to past_due
"""

import ipaddress
import logging
import uuid
from typing import Any
from decimal import Decimal

from app.config import settings
from app.models.subscription import PlanType

logger = logging.getLogger("peaktalk.yookassa")

# ---------------------------------------------------------------------------
# Plan configuration
# ---------------------------------------------------------------------------

# Amounts in kopecks (1 RUB = 100 kopecks)
PLAN_PRICES: dict[PlanType, int] = {
    PlanType.per_session: 29900,   # 299 RUB — one-time credit
    PlanType.personal: 79000,      # 790 RUB/month
    PlanType.pro: 149000,          # 1490 RUB/month
    PlanType.team: 499000,         # 4990 RUB/month
}

PLAN_DESCRIPTIONS: dict[PlanType, str] = {
    PlanType.per_session: "PeakTalk — одна полная сессия",
    PlanType.personal: "PeakTalk Personal — месячная подписка",
    PlanType.pro: "PeakTalk PRO — месячная подписка",
    PlanType.team: "PeakTalk TEAM — месячная подписка",
}

# YooKassa IP ranges for webhook source verification
# https://yookassa.ru/developers/using-api/webhooks
_YOOKASSA_IP_NETWORKS = [
    "185.71.76.0/27",
    "185.71.77.0/27",
    "77.75.153.0/25",
    "77.75.154.128/25",
    "2a02:5180::/32",
]
_YOOKASSA_INDIVIDUAL_IPS = {"77.75.156.11", "77.75.156.35"}

_CARD_BRAND_LABELS = {
    "mastercard": "Mastercard",
    "visa": "Visa",
    "mir": "Mir",
    "unionpay": "UnionPay",
    "jcb": "JCB",
    "american_express": "Amex",
}


def _kopecks_to_rub(kopecks: int) -> str:
    """Convert kopecks integer to RUB decimal string (e.g. 99000 → '990.00')."""
    rub = Decimal(kopecks) / Decimal(100)
    return f"{rub:.2f}"


def _get_configuration():
    """Configure YooKassa SDK lazily. Raises RuntimeError if credentials missing."""
    try:
        from yookassa import Configuration
    except ImportError as exc:
        raise RuntimeError(
            "yookassa package not installed. Run: pip install yookassa==3.3.0"
        ) from exc

    if not settings.yookassa_shop_id or not settings.yookassa_secret_key:
        raise RuntimeError(
            "YooKassa credentials not configured. "
            "Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY in .env"
        )

    Configuration.account_id = settings.yookassa_shop_id
    Configuration.secret_key = settings.yookassa_secret_key
    return Configuration


def _read_nested_value(source: Any, *path: str) -> Any:
    """Safely read a nested field from either dicts or SDK objects."""
    current = source
    for key in path:
        if current is None:
            return None
        if isinstance(current, dict):
            current = current.get(key)
        else:
            current = getattr(current, key, None)
    return current


def _format_payment_method_summary(payment_method_obj: Any) -> dict[str, str] | None:
    """Normalize YooKassa payment method object into a UI-friendly summary."""
    if payment_method_obj is None:
        return None

    payment_type = _read_nested_value(payment_method_obj, "type")
    if not payment_type:
        return None

    payment_type = str(payment_type)

    if payment_type == "bank_card":
        last4 = _read_nested_value(payment_method_obj, "card", "last4") or _read_nested_value(payment_method_obj, "last4")
        brand = _read_nested_value(payment_method_obj, "card", "card_type") or _read_nested_value(payment_method_obj, "card_type")
        brand_label = _CARD_BRAND_LABELS.get(str(brand).lower(), "Карта") if brand else "Карта"
        display_label = f"{brand_label} •••• {last4}" if last4 else brand_label
        return {"type": payment_type, "display_label": display_label}

    if payment_type in {"yoo_money", "yoomoney"}:
        account_number = _read_nested_value(payment_method_obj, "account_number")
        account_tail = str(account_number)[-4:] if account_number else ""
        display_label = f"ЮMoney •••• {account_tail}" if account_tail else "ЮMoney кошелёк"
        return {"type": payment_type, "display_label": display_label}

    if payment_type == "sbp":
        return {"type": payment_type, "display_label": "СБП"}

    if payment_type in {"sberbank", "sber_bank"}:
        return {"type": payment_type, "display_label": "SberPay"}

    if payment_type in {"tinkoff_bank", "tbank"}:
        return {"type": payment_type, "display_label": "T-Bank"}

    title = _read_nested_value(payment_method_obj, "title") or _read_nested_value(payment_method_obj, "name")
    return {
        "type": payment_type,
        "display_label": str(title or "Привязанный способ оплаты"),
    }


def _build_receipt(customer_email: str, description: str, amount_str: str) -> dict:
    """Build a 54-FZ compliant receipt object for YooKassa payment."""
    return {
        "customer": {
            "email": customer_email,
        },
        "tax_system_code": settings.yookassa_tax_system_code,
        "items": [
            {
                "description": description,
                "quantity": "1.00",
                "amount": {
                    "value": amount_str,
                    "currency": "RUB",
                },
                "vat_code": settings.yookassa_vat_code,
                "payment_subject": "service",
                "payment_mode": "full_payment",
            }
        ],
    }


async def create_payment(
    user_id: str,
    plan: PlanType,
    return_url: str,
    customer_email: str,
    idempotency_key: str | None = None,
) -> dict:
    """Create a YooKassa payment for subscription upgrade.

    Returns:
        {"payment_id": str, "confirmation_url": str}

    The payment is created with save_payment_method=True so the returned
    payment_method.id can be used for monthly recurrent charges.
    """
    if plan not in PLAN_PRICES:
        raise ValueError(f"Unsupported plan for payment: {plan}")

    _get_configuration()

    try:
        from yookassa import Payment as YKPayment
    except ImportError as exc:
        raise RuntimeError("yookassa package not installed") from exc

    idem_key = idempotency_key or str(uuid.uuid4())
    amount_str = _kopecks_to_rub(PLAN_PRICES[plan])
    description = PLAN_DESCRIPTIONS[plan]

    # per_session is a one-time payment: do not save the payment method for
    # recurrent billing; all other plans are monthly subscriptions.
    save_method = plan != PlanType.per_session

    payment_data = {
        "amount": {
            "value": amount_str,
            "currency": "RUB",
        },
        "confirmation": {
            "type": "redirect",
            "return_url": return_url,
        },
        "capture": True,
        "save_payment_method": save_method,
        "description": description,
        "metadata": {
            "user_id": user_id,
            "plan": plan.value,
        },
    }

    # 54-FZ receipt: only for ИП/ООО with ОФД. Самозанятые (НПД) exempt.
    if settings.yookassa_send_receipt:
        payment_data["receipt"] = _build_receipt(
            customer_email, description, amount_str
        )

    logger.info(
        "yookassa: creating payment user_id=%s plan=%s amount=%s",
        user_id, plan.value, amount_str,
    )

    payment = YKPayment.create(payment_data, idem_key)

    confirmation_url = payment.confirmation.confirmation_url
    logger.info(
        "yookassa: payment created payment_id=%s user_id=%s",
        payment.id, user_id,
    )

    return {
        "payment_id": payment.id,
        "confirmation_url": confirmation_url,
    }


async def charge_recurring(
    user_id: str,
    subscription_id: str,
    payment_method_id: str,
    plan: PlanType,
    customer_email: str,
    idempotency_key: str,
) -> dict:
    """Auto-charge for subscription renewal using a saved payment method.

    Returns:
        {"payment_id": str, "status": str}
    """
    if plan not in PLAN_PRICES:
        raise ValueError(f"Unsupported plan for recurring charge: {plan}")

    _get_configuration()

    try:
        from yookassa import Payment as YKPayment
    except ImportError as exc:
        raise RuntimeError("yookassa package not installed") from exc

    amount_str = _kopecks_to_rub(PLAN_PRICES[plan])
    description = f"{PLAN_DESCRIPTIONS[plan]} (автопродление)"

    payment_data = {
        "amount": {
            "value": amount_str,
            "currency": "RUB",
        },
        "capture": True,
        "payment_method_id": payment_method_id,
        "description": description,
        "metadata": {
            "user_id": user_id,
            "subscription_id": subscription_id,
            "plan": plan.value,
            "type": "recurrent",
        },
    }

    # 54-FZ receipt: only for ИП/ООО with ОФД. Самозанятые (НПД) exempt.
    if settings.yookassa_send_receipt:
        payment_data["receipt"] = _build_receipt(
            customer_email, description, amount_str
        )

    logger.info(
        "yookassa: recurring charge user_id=%s plan=%s amount=%s "
        "payment_method_id=%s",
        user_id, plan.value, amount_str, payment_method_id,
    )

    payment = YKPayment.create(payment_data, idempotency_key)

    logger.info(
        "yookassa: recurring payment created payment_id=%s status=%s",
        payment.id, payment.status,
    )

    return {
        "payment_id": payment.id,
        "status": payment.status,
    }


async def get_saved_payment_method_summary(payment_id: str) -> dict[str, str] | None:
    """Fetch the payment method details for a completed YooKassa payment."""
    _get_configuration()

    try:
        from yookassa import Payment as YKPayment
    except ImportError as exc:
        raise RuntimeError("yookassa package not installed") from exc

    payment = YKPayment.find_one(payment_id)
    payment_method = getattr(payment, "payment_method", None)
    return _format_payment_method_summary(payment_method)


async def create_refund(payment_id: str, amount: Decimal) -> dict:
    """Issue a refund for a completed payment.

    Returns:
        {"refund_id": str, "status": str}
    """
    _get_configuration()

    try:
        from yookassa import Refund
    except ImportError as exc:
        raise RuntimeError("yookassa package not installed") from exc

    refund_data = {
        "payment_id": payment_id,
        "amount": {
            "value": f"{amount:.2f}",
            "currency": "RUB",
        },
    }

    logger.info("yookassa: creating refund payment_id=%s amount=%s", payment_id, amount)

    refund = Refund.create(refund_data, str(uuid.uuid4()))

    logger.info("yookassa: refund created refund_id=%s status=%s", refund.id, refund.status)

    return {
        "refund_id": refund.id,
        "status": refund.status,
    }


def verify_webhook_ip(ip: str) -> bool:
    """Verify that a webhook request originates from a known YooKassa IP address.

    Checks both individual IPs and CIDR network ranges.
    Returns True if the IP is trusted.
    """
    if ip in _YOOKASSA_INDIVIDUAL_IPS:
        return True

    try:
        client_addr = ipaddress.ip_address(ip)
    except ValueError:
        logger.warning("yookassa: invalid IP address in webhook request: %s", ip)
        return False

    for network_cidr in _YOOKASSA_IP_NETWORKS:
        try:
            if client_addr in ipaddress.ip_network(network_cidr, strict=False):
                return True
        except ValueError:
            logger.error("yookassa: invalid network CIDR in config: %s", network_cidr)

    return False
