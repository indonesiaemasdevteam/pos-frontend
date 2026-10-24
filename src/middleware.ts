// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGE_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forget-password",
  "/apps-merchant-register",
];

const isPublicApi = (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  return (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/apps/auth/login/email" ||
    pathname === "/api/apps/auth/merchant-login" ||
    pathname === "/api/apps/auth/merchant-register" ||
    pathname === "/api/apps/auth/merchant-regions" ||
    pathname.startsWith("/api/apps/region/") ||
    (pathname === "/api/apps/merchant/panel" && req.method === "POST") ||
    /\/api\/.*\/public(\/|$)/.test(pathname) ||
    pathname === "/api/apps/post/public"
  );
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Template preview: do not run authentication or database-backed APIs.
  if (process.env.PREVIEW_MODE === "true") {
    const isPosApi =
      pathname.startsWith("/api/apps/merchant/") ||
      pathname.startsWith("/api/apps/region/") ||
      pathname === "/api/apps/auth/merchant-login" ||
      pathname === "/api/apps/auth/merchant-register" ||
      pathname === "/api/apps/auth/merchant-regions";

    if (isPosApi) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "API dinonaktifkan selama mode preview." },
        { status: 503 }
      );
    }

    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const isPublicPage = PUBLIC_PAGE_PATHS.some(p => pathname.startsWith(p));

  if (isPublicPage) {
    if (token && pathname === "/auth/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (isPublicApi(req)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  if (!token) return NextResponse.redirect(new URL("/auth/login", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images|fonts|api/auth/.*).*)",
  ],
};
// export const config = {
//   matcher: [
//     "/dashboard",
//     "/dashboard/:path*",
//     "/dashboard-analytics/:path*",
//     "/dashboard-blog/:path*",
//     "/dashboard-crm/:path*",
//     "/dashboard-job/:path*",
//     "/dashboard-nft/:path*",
//     "/dashboard-projects/:path*",
//     "/profile/:path*",
//     "/profile-settings/:path*",
//     "/starter/:path*",
//     "/terms-condition/:path*",
//     "/privacy-policy/:path*",
//     "/search-results/:path*",
//     "/gallery/:path*",
//     "/pricing/:path*",
//     "/faqs/:path*",
//     "/timeline/:path*",
//     "/team/:path*",
//     "/apps/:path*",
//     "/auth/login",
//     "/auth/register",
//     "/auth/forget-password",
//   ],
// };
