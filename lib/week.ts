import type { Tuan } from "./types";

// Mục 9 — Quy tắc mở tuần: Tuần 1 = ngày 1-7, Tuần 2 = ngày 8-14, Tuần 3 = ngày 15-21
// tính từ ngay_nhan_viec (ngày nhận việc = ngày 1).
export function daysSinceStart(ngay_nhan_viec: string, today = new Date()): number {
  const start = new Date(ngay_nhan_viec + "T00:00:00");
  const now = new Date(today.toISOString().slice(0, 10) + "T00:00:00");
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // ngày nhận việc là ngày 1
}

export function weekByDate(days: number): Tuan | 0 {
  if (days < 1) return 0; // chưa tới ngày nhận việc
  if (days <= 7) return 1;
  if (days <= 14) return 2;
  return 3; // ngày 15 trở đi tính là tuần 3 (đánh giá cuối)
}

/**
 * Tuần được phép mở đánh giá mới = tuần đã tới hạn theo lịch VÀ tuần liền sau
 * tuần cuối cùng đã có đánh giá (đảm bảo Tuần 1 -> 2 -> 3, không nhảy cóc).
 * Trả về 0 nếu chưa được mở tuần nào (chưa tới ngày nhận việc, hoặc đã hoàn tất cả 3 tuần).
 */
export function allowedWeek(ngay_nhan_viec: string, submittedWeeks: Tuan[]): Tuan | 0 {
  const dueWeek = weekByDate(daysSinceStart(ngay_nhan_viec));
  if (dueWeek === 0) return 0;
  const maxSubmitted = submittedWeeks.length ? (Math.max(...submittedWeeks) as Tuan) : 0;
  const nextSequential = (maxSubmitted + 1) as Tuan | 4;
  if (nextSequential > 3) return 0; // đã đánh giá đủ 3 tuần
  if (nextSequential > dueWeek) return 0; // tuần kế tiếp chưa tới hạn theo lịch
  return nextSequential as Tuan;
}

/** Giai đoạn onboarding kéo dài 3 tuần = 21 ngày tính từ ngày nhận việc. */
export const ONBOARDING_DAYS = 21;

/** Đã qua hết 3 tuần onboarding (ngày 22 trở đi). */
export function isOnboardingDone(days: number): boolean {
  return days > ONBOARDING_DAYS;
}
