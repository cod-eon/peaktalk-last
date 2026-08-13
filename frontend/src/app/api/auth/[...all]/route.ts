import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getHandler(request: Request) {
  const { auth } = await import("@/lib/auth");
  return toNextJsHandler(auth).GET(request);
}

async function postHandler(request: Request) {
  const { auth } = await import("@/lib/auth");
  return toNextJsHandler(auth).POST(request);
}

export { getHandler as GET, postHandler as POST };
