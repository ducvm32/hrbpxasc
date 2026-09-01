import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { buildAuthorizationUrl, encodeGoogleFlow, GOOGLE_FLOW_COOKIE_NAME } from "@/lib/google-oauth";

// Route này không đọc gì từ request (không gọi cookies()/headers()) nên
// Next.js không tự nhận diện được là cần render động — nếu để mặc định, nó
// bị tối ưu thành static route và cache CHUNG 1 response (state/nonce chống
// CSRF cố định) cho mọi lượt đăng nhập, vô hiệu hoá luôn bảo vệ CSRF của OAuth.
export const dynamic = "force-dynamic";

const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

export async function GET(req: NextRequest) {
  const state = crypto.randomBytes(32).toString("hex");
  const nonce = crypto.randomBytes(32).toString("hex");

  let authorizeUrl: string;
  try {
    authorizeUrl = buildAuthorizationUrl(state, nonce);
  } catch (e: any) {
    // Location tương đối — xem giải thích trong app/api/auth/google/callback/route.ts
    return new NextResponse(null, {
      status: 307,
      headers: { Location: `/login?google_error=${encodeURIComponent(e?.message || "Lỗi cấu hình Google OAuth")}` },
    });
  }

  const res = NextResponse.redirect(authorizeUrl);
  res.cookies.set(GOOGLE_FLOW_COOKIE_NAME, encodeGoogleFlow(state, nonce), {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: 600,
  });
  return res;
}
