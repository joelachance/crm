import { NextResponse } from "next/server";

import { createSiteAuthToken, getAuthCookieName, getSitePassword, isSitePasswordRequired } from "@/lib/site-auth";

export async function POST(request: Request) {
  if (!isSitePasswordRequired()) {
    return NextResponse.json({ error: "Site password is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const submitted = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/");
  const redirectPath = nextPath.startsWith("/") ? nextPath : "/";
  const password = getSitePassword();

  if (submitted !== password) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "1");
    loginUrl.searchParams.set("next", redirectPath);
    return NextResponse.redirect(loginUrl);
  }

  const token = await createSiteAuthToken(password);
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  response.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
