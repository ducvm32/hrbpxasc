"use client";

import { logoutAction } from "@/lib/actions";
import { IconLogout } from "@/components/ui/icons";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 shadow-soft transition duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
      >
        <IconLogout className="h-4 w-4" />
        Đăng xuất
      </button>
    </form>
  );
}
