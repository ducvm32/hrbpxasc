"use client";

import { logoutAction } from "@/lib/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        Đăng xuất
      </button>
    </form>
  );
}
