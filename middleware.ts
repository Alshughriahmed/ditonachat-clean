import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // السماح بمسارات النظام والـ API وصفحة العمر نفسها
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname === "/age"
  ) {
    return NextResponse.next();
  }

  const ageOk = req.cookies.get("age_ok")?.value === "1";
  if (!ageOk) {
    const url = req.nextUrl.clone();
    url.pathname = "/age";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// طبّق على كل المسارات
export const config = {
  matcher: ["/:path*"],
};
