import { NextRequest, NextResponse } from "next/server";
import { isLanguageCode } from "../../../lib/i18n-data";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lang = searchParams.get("lang");
  const next = searchParams.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(new URL(safeNext, request.url));

  if (isLanguageCode(lang)) {
    response.cookies.set("srpg_lang", lang, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
