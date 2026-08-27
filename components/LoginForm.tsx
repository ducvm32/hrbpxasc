"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginEmployeeAction, loginAdminAction, type ActionResult } from "@/lib/actions";

const initialState: ActionResult = {};

async function callEmployeeLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await loginEmployeeAction(formData)) ?? {};
}

async function callAdminLogin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await loginAdminAction(formData)) ?? {};
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Đang đăng nhập..." : label}
    </button>
  );
}

export default function LoginForm() {
  const [mode, setMode] = useState<"nhanvien" | "quantri">("nhanvien");
  const [empState, empAction] = useFormState(callEmployeeLogin, initialState);
  const [adminState, adminAction] = useFormState(callAdminLogin, initialState);

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
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
          <form action={adminAction} className="animate-fade-in space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Tài khoản (email @ghn.vn)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="ten@ghn.vn"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                autoComplete="current-password"
                required
              />
            </div>
            {adminState?.error && <p className="alert-error">{adminState.error}</p>}
            <SubmitButton label="Đăng Nhập (SSO @ghn.vn)" />
          </form>
        )}
      </div>
    </div>
  );
}
