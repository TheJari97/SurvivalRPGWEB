import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "../../../../lib/steam-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/profile", request.url));
  response.cookies.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
