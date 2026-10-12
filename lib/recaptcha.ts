// Google reCAPTCHA v2 — chặn bot vét cạn (brute-force) mã NV ở form đăng nhập
// Nhân Viên (chỉ cần biết đúng mã NV là vào được, xem lib/actions.ts
// loginEmployeeAction). Tính năng tắt hoàn toàn nếu chưa cấu hình đủ 2 biến
// môi trường bên dưới, để không chặn chạy thử cục bộ khi chưa có site key.

const VERIFY_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify";

export function getRecaptchaSiteKey(): string | null {
  return process.env.RECAPTCHA_SITE_KEY || null;
}

export function isRecaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY);
}

/**
 * Xác thực token "g-recaptcha-response" từ form với Google. Trả về true nếu
 * chưa cấu hình RECAPTCHA_SECRET_KEY (tính năng đang tắt) — chỉ thực sự kiểm
 * tra khi đã bật.
 */
export async function verifyRecaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return data?.success === true;
  } catch {
    return false;
  }
}
