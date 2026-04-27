import { NextRequest, NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "../../../lib/steam-auth";

export function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/profile", request.url), 303);
  response.cookies.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
