import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me-at-least-32-characters");

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  const token = request.cookies.get("vikingos_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/login", request.url));
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("vikingos_session");
    return response;
  }
}

export const config = { matcher: ["/admin/:path*"] };
