"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginEmployeeAction, type ActionResult } from "@/lib/actions";

const initialState: ActionResult = {};

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

export default function LoginForm({ googleError }: { googleError?: string }) {
  const [mode, setMode] = useState<"nhanvien" | "quantri">(googleError ? "quantri" : "nhanvien");
  const [empState, empAction] = useFormState(callEmployeeLogin, initialState);

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center gap-2">
        <img src="/ghn-logo.png" alt="Giao Hàng Nhanh" className="h-12 w-auto" />
        <p className="text-xs font-medium uppercase tracking-wide text-ghn">GHN Onboarding</p>
      </div>

      <div className="card p-6 sm:p-8">
        <h1 className="mb-1 text-center text-lg font-semibold text-slate-900">
          Đăng nhập hệ thống Gắn NV &amp; Đánh giá Onboarding
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Gắn nhân viên mới, phân công kèm cặp và đánh giá 3 tuần đầu
        </p>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode("nhanvien")}
            className={`rounded-md py-2 transition duration-150 ${
              mode === "nhanvien" ? "bg-white text-ghn shadow-soft" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Nhân Viên
          </button>
          <button
            type="button"
            onClick={() => setMode("quantri")}
            className={`rounded-md py-2 transition duration-150 ${
              mode === "quantri" ? "bg-white text-ghn shadow-soft" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Quản Trị (Sup / HRBP / Admin)
          </button>
        </div>

        {mode === "nhanvien" ? (
          <form action={empAction} className="animate-fade-in space-y-4">
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
            {empState?.error && <p className="alert-error">{empState.error}</p>}
            <SubmitButton label="Đăng Nhập" />
          </form>
        ) : (
          <div className="animate-fade-in space-y-4">
            <p className="text-center text-sm text-slate-500">
              Đăng nhập bằng tài khoản Google Workspace của công ty (@ghn.vn).
            </p>
            {googleError && <p className="alert-error">{googleError}</p>}
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
        )}
      </div>
    </div>
  );
}
