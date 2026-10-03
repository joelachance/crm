import { NextResponse, type NextRequest } from "next/server";

import { getAuthCookieName, getSitePassword, isSitePasswordRequired, isValidSiteAuthToken } from "@/lib/site-auth";

const PUBLIC_PATHS = ["/login", "/api/site-auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".otf") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  if (!isSitePasswordRequired()) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
      return new NextResponse("ERA_SITE_PASSWORD is not configured.", { status: 503 });
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const password = getSitePassword();
  const cookieToken = request.cookies.get(getAuthCookieName())?.value;

  if (await isValidSiteAuthToken(password, cookieToken)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
