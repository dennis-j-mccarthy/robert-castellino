import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await clearSessionCookie();
  // Redirect from the form-post submission back to the login page.
  const url = new URL("/admin/login", req.url);
  return NextResponse.redirect(url, { status: 303 });
}
