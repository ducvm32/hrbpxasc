import crypto from "crypto";
import { getSessionSecret } from "./auth";

// Google OAuth 2.0 / OpenID Connect — dùng cho đăng nhập Admin/Sup/HRBP bằng
// tài khoản Google Workspace của công ty (@ghn.vn). Không dùng thư viện ngoài
// (jsonwebtoken/jwks-rsa/google-auth-library) — Node 20 hỗ trợ sẵn
// crypto.createPublicKey({format:"jwk"}) để verify RS256, đủ cho nhu cầu này.

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS_ENDPOINT = "https://www.googleapis.com/oauth2/v3/certs";
const VALID_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  hdDomain: string;
}

export function getGoogleConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Thiếu cấu hình Google OAuth — cần đặt đủ biến môi trường GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI"
    );
  }
  const hdDomain = process.env.GOOGLE_HD_DOMAIN || "ghn.vn";
  return { clientId, clientSecret, redirectUri, hdDomain };
}

export function buildAuthorizationUrl(state: string, nonce: string): string {
  const env = getGoogleConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    scope: "openid email profile",
    state,
    nonce,
    hd: env.hdDomain,
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const env = getGoogleConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    redirect_uri: env.redirectUri,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || "Không đổi được mã xác thực lấy token từ Google");
  }
  return data as TokenResponse;
}

// ---------- JWKS + verify id_token ----------

let jwksCache: { keys: any[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getJwks(): Promise<any[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetch(JWKS_ENDPOINT, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được JWKS từ Google (HTTP ${res.status})`);
  const data = await res.json();
  jwksCache = { keys: data.keys ?? [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

function decodeJwt(token: string) {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) throw new Error("ID token không đúng định dạng JWT");
  return {
    header: JSON.parse(Buffer.from(h, "base64url").toString("utf-8")),
    payload: JSON.parse(Buffer.from(p, "base64url").toString("utf-8")),
    signingInput: `${h}.${p}`,
    signature: Buffer.from(s, "base64url"),
  };
}

export async function verifyIdToken(idToken: string, expectedNonce: string): Promise<Record<string, any>> {
  const env = getGoogleConfig();
  const { header, payload, signingInput, signature } = decodeJwt(idToken);
  if (header.alg !== "RS256") throw new Error("Thuật toán ký ID token không được hỗ trợ");

  const keys = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("Không tìm thấy khóa xác thực (kid) phù hợp trong JWKS của Google");

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const validSignature = crypto.verify("RSA-SHA256", Buffer.from(signingInput), publicKey, signature);
  if (!validSignature) throw new Error("Chữ ký ID token không hợp lệ");

  const now = Math.floor(Date.now() / 1000);
  if (!VALID_ISSUERS.includes(payload.iss)) throw new Error("ID token có iss không khớp với Google");
  if (payload.aud !== env.clientId) throw new Error("ID token có aud không khớp với client_id");
  if (typeof payload.exp !== "number" || payload.exp < now) throw new Error("ID token đã hết hạn");
  if (payload.nonce !== expectedNonce) throw new Error("ID token có nonce không khớp — có thể bị replay");
  if (String(payload.email_verified) !== "true") throw new Error("Email Google chưa được xác minh");
  if (payload.hd !== env.hdDomain) {
    throw new Error(`Chỉ chấp nhận tài khoản Google Workspace @${env.hdDomain}`);
  }

  return payload;
}

// ---------- Flow cookie (state + nonce tạm thời trong lúc redirect qua Google) ----------

export const GOOGLE_FLOW_COOKIE_NAME = "ghn_google_flow";
const FLOW_TTL_MS = 10 * 60 * 1000;

function signFlow(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function encodeGoogleFlow(state: string, nonce: string): string {
  const payload = Buffer.from(JSON.stringify({ state, nonce, exp: Date.now() + FLOW_TTL_MS }), "utf-8").toString(
    "base64url"
  );
  return `${payload}.${signFlow(payload)}`;
}

export function decodeGoogleFlow(token: string | undefined): { state: string; nonce: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = signFlow(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { state: data.state, nonce: data.nonce };
  } catch {
    return null;
  }
}
