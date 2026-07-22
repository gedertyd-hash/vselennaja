import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

function isProtectedRoute(path: string) {
  return (
    path.startsWith("/courses") ||
    path.startsWith("/lessons") ||
    path.startsWith("/admin")
  );
}

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute(path) && !session?.userId) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  if (
    (path === "/login" || path === "/register") &&
    session?.userId
  ) {
    return NextResponse.redirect(new URL("/courses", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};
