import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "castellino_admin";
const ALG = "HS256";
const ISSUER = "castellino-admin";

async function isValid(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: ISSUER,
      algorithms: [ALG],
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public/unauthenticated routes
  if (pathname === "/admin/login") return NextResponse.next();

  const secret = process.env.ADMIN_JWT_SECRET;

  // If auth env is not configured, every /admin route surfaces a setup
  // notice rather than silently letting people through.
  if (!secret) {
    return NextResponse.rewrite(new URL("/admin/setup-needed", req.url));
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (await isValid(token, secret)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/add"],
};
