import { NextRequest, NextResponse } from "next/server";

const GRADE_COOKIE = "poly_grade";
const SESSION_COOKIE = "poly_sga_session";

const PUBLIC_PATHS = [
  "/welcome",
  "/admin",
  "/api",
  "/_next",
  "/favicon",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Officers are already identified by their session — no need to pick a grade
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (session) return NextResponse.next();

  const grade = req.cookies.get(GRADE_COOKIE)?.value;
  if (!grade) {
    const url = req.nextUrl.clone();
    url.pathname = "/welcome";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|.*\\..*).*)"],
};
