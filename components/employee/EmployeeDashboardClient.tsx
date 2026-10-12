"use client";

import DashboardHeader from "@/components/DashboardHeader";
import SelfEvalForm from "@/components/employee/SelfEvalForm";
import {
  DUNG_CONG_VIEC_LABEL,
  jobMota,
  KHOI_LUONG_CONG_VIEC_LABEL,
  MUC_DO_HUONG_DAN_LABEL,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";
import { isOnboardingDone } from "@/lib/week";
import type { Assignment, Employee, SelfEvaluation, SupUser } from "@/lib/types";
import type { employeeProgress } from "@/lib/queries";

type Progress = ReturnType<typeof employeeProgress>;

export default function EmployeeDashboardClient({
  employee,
  sups,
  assignments,
  progress,
  history,
}: {
  employee: Employee;
  sups: SupUser[];
  assignments: Assignment[];
  progress: Progress;
  history: SelfEvaluation[];
}) {
  // Chỉ tính các phân công thực sự có công việc — bản ghi rỗng (dữ liệu cũ
  // trước khi bắt buộc chọn công việc) coi như chưa được phân công.
  const realAssignments = assignments.filter((a) => a.cong_viec?.trim());
  const currentAssignment =
    realAssignments.find((a) => a.tuan === (progress.dueWeek || 1)) ??
    realAssignments[realAssignments.length - 1];
  const congViecList = currentAssignment?.cong_viec
    ? currentAssignment.cong_viec.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const supNames = sups.map((s) => s.ho_ten).join(", ");
  // Dữ liệu cũ có thể ghi thời gian dạng tự do, không tách được theo từng việc —
  // khi đó vẫn hiện nguyên chuỗi để NV không mất thông tin.
  const rawTime = currentAssignment?.thoi_gian_huong_dan?.trim() ?? "";
  const hasPerJobTime = congViecList.some((cv) => timeForJob(rawTime, cv));

  const notStarted = progress.dueWeek === 0;
  const done = isOnboardingDone(progress.days);
  const stageValue = notStarted
    ? `Chưa tới ngày nhận việc (${formatDate(employee.ngay_nhan_viec)})`
    : done
      ? "Đã hoàn tất 3 tuần onboarding"
      : `Ngày ${progress.days} · Tuần ${progress.dueWeek}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <DashboardHeader
        title={`Xin chào, ${employee.ho_ten}`}
        subtitle={`Mã NV ${employee.ma_nv} · ${employee.ca} · Nhận việc ${formatDate(employee.ngay_nhan_viec)}`}
      />

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <InfoCard label="Tiến độ" value={stageValue} />
        <InfoCard label="Sup phụ trách" value={supNames || "Chưa có Sup phụ trách ca này"} />
        <InfoCard label="Người hướng dẫn" value={employee.nguoi_huong_dan ?? "Chưa phân công"} />
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 font-semibold text-slate-800">
          Phân công hiện tại
          {currentAssignment && (
            <span className="badge ml-2 bg-slate-100 text-slate-600">Tuần {currentAssignment.tuan}</span>
          )}
        </h2>
        {!currentAssignment ? (
          <p className="text-sm text-slate-500">
            Chưa có Sup nào phân công công việc cụ thể cho bạn. Vui lòng chờ Sup hoặc liên hệ HRBP.
          </p>
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Công việc &amp; thời gian hướng dẫn</dt>
              <dd className="mt-1 space-y-2">
                {congViecList.map((cv) => {
                  const mota = jobMota(employee.ca, cv);
                  const time = timeForJob(currentAssignment.thoi_gian_huong_dan, cv);
                  return (
                    <div key={cv} className="rounded-lg border border-slate-200 p-2.5">
                      <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="font-medium text-slate-800">{cv}</span>
                        {time && <span className="badge bg-ghn-50 text-ghn-700">{time}</span>}
                      </p>
                      {mota && <p className="mt-1 text-xs text-slate-500">{mota}</p>}
                    </div>
                  );
                })}
              </dd>
            </div>
            {rawTime && !hasPerJobTime && (
              <div>
                <dt className="text-xs text-slate-500">Thời gian hướng dẫn</dt>
                <dd className="font-medium text-slate-800">{rawTime}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-slate-500">Ghi chú từ Sup</dt>
              <dd className="font-medium text-slate-800">{currentAssignment.sup_note || "—"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Tiến độ tự đánh giá 3 tuần</h2>
        <ol className="grid grid-cols-3 gap-2 sm:gap-3">
          {([1, 2, 3] as const).map((tuan) => {
            const submitted = progress.selfWeeksDone.includes(tuan);
            const open = progress.selfAllowedWeek === tuan;
            return (
              <li
                key={tuan}
                className={`rounded-lg border p-2.5 text-center text-sm sm:p-3 sm:text-left ${
                  submitted
                    ? "border-green-200 bg-green-50"
                    : open
                      ? "border-ghn-200 bg-ghn-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="font-medium text-slate-800">Tuần {tuan}</p>
                <p className={`text-xs sm:text-sm ${submitted ? "text-green-700" : open ? "text-ghn-700" : "text-slate-500"}`}>
                  {submitted ? "Đã nộp" : open ? "Đang mở" : "Chưa tới hạn"}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mb-6">
        <SelfEvalForm allowedWeekNum={progress.selfAllowedWeek} doneWeeks={progress.selfWeeksDone} />
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="section-title">Lịch sử tự đánh giá của bạn</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="card p-3 text-sm">
                <p className="flex flex-wrap items-center justify-between gap-2 font-medium text-slate-800">
                  <span>Tuần {h.tuan}</span>
                  <span className="text-xs font-normal text-slate-500">{formatDateTime(h.created_at)}</span>
                </p>
                <p className="mt-1 text-slate-600">
                  {DUNG_CONG_VIEC_LABEL[h.dung_cong_viec]} · {MUC_DO_HUONG_DAN_LABEL[h.muc_do_huong_dan]} ·{" "}
                  {KHOI_LUONG_CONG_VIEC_LABEL[h.khoi_luong_cong_viec]} · {h.danh_gia_sao}★
                </p>
                {h.chia_se_cai_thien && <p className="mt-1 text-slate-500">“{h.chia_se_cai_thien}”</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/** Tách giờ hướng dẫn của 1 công việc từ chuỗi "8h - 10h: Nhập hàng; 10h - 12h: Xuất hàng". */
function timeForJob(thoiGianHuongDan: string, job: string): string | null {
  for (const part of thoiGianHuongDan.split(";")) {
    const idx = part.lastIndexOf(":");
    if (idx === -1) continue;
    if (part.slice(idx + 1).trim() === job) {
      const time = part.slice(0, idx).trim();
      return time && time !== "?" ? time : null;
    }
  }
  return null;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
