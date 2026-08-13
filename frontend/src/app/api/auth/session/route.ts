import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() { const { auth } = await import("@/lib/auth"); const data = await auth.api.getSession({ headers: await headers() }); const user = data?.user; return NextResponse.json({ isAuthenticated: Boolean(user), auth_state: !user ? "signed_out" : user.emailVerified ? "ready" : "email_verification_required", user: user ? { sub: user.id, email: user.email, email_verified: user.emailVerified, name: user.name } : null }, { headers: { "Cache-Control": "no-store" } }); }
