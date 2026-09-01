import crypto from "crypto";
import { cookies } from "next/headers";
import type { SessionData } from "./types";

const DEV_FALLBACK_SECRET = "ghn-onboarding-dev-secret-change-me";
const COOKIE_NAME = "ghn_session";

// SESSION_SECRET ký cookie phiên đăng nhập (mọi vai trò, kể cả admin) — nếu
// dùng giá trị mặc định (biết trước, nằm sẵn trong mã nguồn public trên
// GitHub) ở production, kẻ tấn công có thể tự ký cookie giả mạo bất kỳ vai
// trò nào. Chỉ cho phép fallback khi chạy dev cục bộ (NODE_ENV !== production);
// production bắt buộc phải tự set biến môi trường này, thiếu thì chặn khởi động.
export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Thiếu biến môi trường SESSION_SECRET ở production — không được dùng giá trị mặc định trong mã nguồn (không an toàn). Đặt SESSION_SECRET thành một chuỗi ngẫu nhiên bí mật trước khi khởi động."
    );
  }
  return DEV_FALLBACK_SECRET;
}

function sign(payload: string): string {
  // Lấy secret lúc ký/verify (không phải lúc module load) — `next build` chạy
  // với NODE_ENV=production nhưng chưa có biến môi trường thật của server, gọi
  // getSessionSecret() ở module scope sẽ làm build luôn thất bại.
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
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
