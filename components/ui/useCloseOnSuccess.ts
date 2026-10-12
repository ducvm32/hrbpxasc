"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions";

/**
 * Đóng modal + tải lại dữ liệu CHỈ KHI server action trả về thành công. Trước
 * đây modal tự đóng theo setTimeout ngay lúc bấm Lưu, nên lỗi validate từ
 * server (VD SĐT sai) không bao giờ kịp hiện ra — người dùng tưởng đã lưu.
 */
export function useCloseOnSuccess(state: ActionResult, onClose: () => void) {
  const router = useRouter();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (state?.success) {
      router.refresh();
      onCloseRef.current();
    }
  }, [state, router]);
}
