"""One-time, fail-closed bootstrap for the first Better Auth admin.

Run only with BETTER_AUTH_BOOTSTRAP_ADMIN_EMAIL supplied by a protected
runtime environment. The value is never written to the repository or logs.
Remove/unset the runtime variable and this one-shot script after success.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings


async def run() -> int:
    raw_email = os.environ.get("BETTER_AUTH_BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    if not raw_email or "@" not in raw_email:
        print("bootstrap identity is missing from protected runtime configuration", file=sys.stderr)
        return 2

    engine = create_async_engine(settings.database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory.begin() as db:
            target_rows = (await db.execute(text('SELECT "id", "role", "emailVerified" FROM "user" WHERE lower("email") = :email FOR UPDATE'), {"email": raw_email})).mappings().all()
            if len(target_rows) != 1:
                print("bootstrap identity must match exactly one Better Auth user", file=sys.stderr)
                return 2
            target = target_rows[0]
            if not target["emailVerified"]:
                print("bootstrap identity must be email verified", file=sys.stderr)
                return 2

            admin_rows = (await db.execute(text('SELECT "id" FROM "user" WHERE "role" = \'admin\' FOR UPDATE'))).scalars().all()
            if any(str(admin_id) != str(target["id"]) for admin_id in admin_rows):
                print("a different Better Auth admin already exists; refusing to replace it", file=sys.stderr)
                return 3
            if str(target["role"] or "user") == "admin":
                print("bootstrap admin already assigned")
                return 0

            await db.execute(text('UPDATE "user" SET "role" = \'admin\', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = :user_id'), {"user_id": target["id"]})
            await db.execute(
                text("INSERT INTO admin_audit_events (id, actor_user_id, target_user_id, action, outcome, metadata) VALUES (:id, :actor, :target, :action, :outcome, :metadata)"),
                {"id": str(uuid.uuid4()), "actor": "bootstrap", "target": str(target["id"]), "action": "bootstrap_admin", "outcome": "success", "metadata": json.dumps({"source": "protected_runtime"})},
            )
        print("bootstrap admin assigned; unset the protected runtime variable and remove this one-shot script")
        return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(run()))
