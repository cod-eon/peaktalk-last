import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
export async function GET() { const data = await auth.api.getSession({ headers: await headers() }); const user = data?.user; return NextResponse.json({ isAuthenticated: Boolean(user), auth_state: !user ? "signed_out" : user.emailVerified ? "ready" : "email_verification_required", user: user ? { sub: user.id, email: user.email, email_verified: user.emailVerified, name: user.name } : null }, { headers: { "Cache-Control": "no-store" } }); }
