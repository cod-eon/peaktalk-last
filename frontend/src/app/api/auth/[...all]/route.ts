import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request) {
  const { auth } = await import("@/lib/auth");
  return toNextJsHandler(auth).GET(request);
}

export { handle as GET, handle as POST };
