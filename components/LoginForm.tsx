"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useFormState, useFormStatus } from "react-dom";
import { loginEmployeeAction, type ActionResult } from "@/lib/actions";

const initialState: ActionResult = {};

// Tên callback global mà script recaptcha/api.js sẽ gọi khi tải xong (dùng
// render=explicit — xem giải thích ở effect renderRecaptcha bên dưới).
const RECAPTCHA_ONLOAD_CALLBACK = "__ghnRecaptchaOnload";

// Luôn dùng size="normal" (304px, mặc định của Google) — từng thử co nhỏ
// bằng CSS transform: scale() thì bị lỗi hiển thị iframe (paint trắng/sai ở
// lần vẽ đầu, cả Chrome lẫn Firefox mobile); thử tiếp size="compact" (164px)
// thì hết lỗi nhưng bố cục xấu (logo chồng lên ô tick). Giải pháp cuối: giữ
// nguyên "normal" cho đẹp, bọc trong overflow-x-auto để màn quá hẹp (< 304px)
// tự cuộn ngang đúng vùng widget thay vì tràn cả trang — không đụng tới
// transform nên không tái phát lỗi paint iframe.
const RECAPTCHA_WIDTH = 304;

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, params: { sitekey: string }) => number;
      reset: (widgetId?: number) => void;
    };
    __ghnRecaptchaOnload?: () => void;
  }
}

async function callEmployeeLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await loginEmployeeAction(formData)) ?? {};
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Đang đăng nhập..." : label}
    </button>
  );
}

export default function LoginForm({
  googleError,
  recaptchaSiteKey,
}: {
  googleError?: string;
  recaptchaSiteKey?: string | null;
}) {
  const [mode, setMode] = useState<"nhanvien" | "quantri">(googleError ? "quantri" : "nhanvien");
  const [empState, empAction] = useFormState(callEmployeeLogin, initialState);
  const firstRender = useRef(true);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  // reCAPTCHA v2 chỉ dùng được 1 lần — sau mỗi lượt submit lỗi (kể cả sai mã
  // NV) phải reset lại ô "Tôi không phải người máy" để người dùng xác nhận
  // lại cho lượt thử tiếp theo.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current);
  }, [empState]);

  // Tự gọi grecaptcha.render() thay vì để script tự quét div .g-recaptcha
  // (data-sitekey) — script api.js chỉ tự quét DOM 1 LẦN CHO CẢ TRÌNH DUYỆT
  // (không phải 1 lần mỗi khi /login được mở). Sau khi Nhân viên đăng xuất,
  // logoutAction() redirect về /login là điều hướng phía CLIENT (không reload
  // lại cả trang) — script cũ vẫn còn nguyên nhưng LoginForm là component mới
  // với div .g-recaptcha mới, nên script không bao giờ quét lại được nữa.
  // render() thủ công ở đây thì luôn chạy đúng dù script đã tải sẵn từ trước
  // (điều hướng lại/đăng xuất) hay chưa tải xong (lần đầu mở trang).
  useEffect(() => {
    if (!recaptchaSiteKey) return;

    function renderWidget() {
      if (recaptchaContainerRef.current && widgetIdRef.current === null && window.grecaptcha?.render) {
        widgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
          sitekey: recaptchaSiteKey as string,
        });
      }
    }

    if (window.grecaptcha?.render) {
      renderWidget();
    } else {
      window[RECAPTCHA_ONLOAD_CALLBACK] = renderWidget;
    }
  }, [recaptchaSiteKey]);

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center">
        <img src="/logo.png" alt="GHN" className="h-12 w-auto" />
      </div>

      <div className="card p-6 sm:p-8">
        <h1 className="mb-1 text-center text-lg font-semibold text-neutral-900">
          Đăng nhập hệ thống Gắn NV &amp; Đánh giá Onboarding
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          Gắn nhân viên mới, phân công kèm cặp và đánh giá 3 tuần đầu
        </p>

        <div role="tablist" aria-label="Loại tài khoản" className="mb-6 grid grid-cols-2 rounded-lg bg-neutral-100 p-1 text-sm font-medium">
          <button
            type="button"
            role="tab"
            id="tab-nhanvien"
            aria-selected={mode === "nhanvien"}
            aria-controls="panel-nhanvien"
            onClick={() => setMode("nhanvien")}
            className={`min-h-10 rounded-md px-2 py-2 transition duration-150 ${
              mode === "nhanvien" ? "bg-white text-brand-700 shadow-soft" : "text-neutral-600 hover:text-neutral-800"
            }`}
          >
            Nhân Viên
          </button>
          <button
            type="button"
            role="tab"
            id="tab-quantri"
            aria-selected={mode === "quantri"}
            aria-controls="panel-quantri"
            onClick={() => setMode("quantri")}
            className={`min-h-10 rounded-md px-2 py-2 transition duration-150 ${
              mode === "quantri" ? "bg-white text-brand-700 shadow-soft" : "text-neutral-600 hover:text-neutral-800"
            }`}
          >
            Quản Trị (Sup / HRBP / Admin)
          </button>
        </div>

        {/* Cả 2 form luôn nằm trong DOM, chỉ ẩn/hiện bằng CSS (không unmount) —
            script reCAPTCHA chỉ quét & render widget .g-recaptcha đúng 1 lần
            lúc load trang, nếu unmount rồi mount lại div thì widget biến mất
            vĩnh viễn và form Nhân Viên không bao giờ gửi được nữa. */}
        <div
          id="panel-nhanvien"
          role="tabpanel"
          aria-labelledby="tab-nhanvien"
          className={mode === "nhanvien" ? "animate-fade-in" : "hidden"}
        >
          <form action={empAction} className="space-y-4">
            <div>
              <label className="label" htmlFor="ma_nv">
                Mã nhân viên
              </label>
              <input
                id="ma_nv"
                name="ma_nv"
                className="input"
                placeholder="VD: 4001234"
                autoComplete="off"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="sdt_4so">
                4 số cuối SĐT
              </label>
              <input
                id="sdt_4so"
                name="sdt_4so"
                className="input"
                placeholder="VD: 4567"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                autoComplete="off"
                required
              />
            </div>
            {recaptchaSiteKey && (
              <>
                <Script
                  src={`https://www.google.com/recaptcha/api.js?onload=${RECAPTCHA_ONLOAD_CALLBACK}&render=explicit`}
                  strategy="afterInteractive"
                />
                <div className="overflow-x-auto">
                  <div className="mx-auto" style={{ width: RECAPTCHA_WIDTH }}>
                    <div ref={recaptchaContainerRef} />
                  </div>
                </div>
              </>
            )}
            {empState?.error && (
              <p className="alert-error" role="alert">
                {empState.error}
              </p>
            )}
            <SubmitButton label="Đăng Nhập" />
          </form>
        </div>
        <div
          id="panel-quantri"
          role="tabpanel"
          aria-labelledby="tab-quantri"
          className={`space-y-4 ${mode === "quantri" ? "animate-fade-in" : "hidden"}`}>
          <p className="text-center text-sm text-neutral-500">
            Đăng nhập bằng tài khoản Google Workspace của công ty (@ghn.vn).
          </p>
          {googleError && (
            <p className="alert-error" role="alert">
              {googleError}
            </p>
          )}
          <a
            href="/api/auth/google/login"
            className="btn-primary flex w-full items-center justify-center gap-2 text-center"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.4-1.6 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.98 3.6 14.9 2.7 12.18 2.7 6.98 2.7 2.77 6.9 2.77 12s4.21 9.3 9.41 9.3c5.43 0 9.03-3.82 9.03-9.19 0-.62-.07-1.09-.14-1.55z"
              />
            </svg>
            Đăng Nhập bằng Google
          </a>
        </div>
      </div>
    </div>
  );
}
