import crypto from "crypto";
import { cookies } from "next/headers";
import type { SessionData } from "./types";

const SECRET = process.env.SESSION_SECRET || "ghn-onboarding-dev-secret-change-me";
const COOKIE_NAME = "ghn_session";

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data), "utf-8").toString("base64url");
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeSession(token: string | undefined): SessionData | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as SessionData;
  } catch {
    return null;
  }
}

export function getSession(): SessionData | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  return decodeSession(token);
}

// Chỉ bật cookie Secure khi triển khai thật sự có HTTPS (đặt COOKIE_SECURE=true).
// Mặc định tắt vì app này thường chạy nội bộ qua HTTP (IP nội bộ/server chưa có
// TLS) — bật Secure trong trường hợp đó khiến trình duyệt âm thầm không lưu
// cookie và mọi request sau đăng nhập bị coi như chưa đăng nhập.
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";

export function setSessionCookie(data: SessionData) {
  cookies().set(COOKIE_NAME, encodeSession(data), {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
