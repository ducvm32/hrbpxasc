"use client";

import DashboardHeader from "@/components/DashboardHeader";
import SelfEvalForm from "@/components/employee/SelfEvalForm";
import { jobMota } from "@/lib/constants";
import type { Assignment, Employee, SelfEvaluation, SupUser } from "@/lib/types";
import type { employeeProgress } from "@/lib/queries";

type Progress = ReturnType<typeof employeeProgress>;

export default function EmployeeDashboardClient({
  employee,
  sup,
  assignments,
  progress,
  history,
}: {
  employee: Employee;
  sup: SupUser | null;
  assignments: Assignment[];
  progress: Progress;
  history: SelfEvaluation[];
}) {
  const currentAssignment =
    assignments.find((a) => a.tuan === (progress.dueWeek || 1)) ?? assignments[assignments.length - 1];
  const congViecList = currentAssignment?.cong_viec
    ? currentAssignment.cong_viec.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <DashboardHeader
        title={`Xin chào, ${employee.ho_ten}`}
        subtitle={`Mã NV ${employee.ma_nv} · ${employee.ca} · Ngày nhận việc ${employee.ngay_nhan_viec}`}
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="Đang ở" value={`Ngày ${Math.max(progress.days, 1)} · Tuần ${progress.dueWeek || 1}`} />
        <InfoCard label="Sup phụ trách" value={sup ? sup.ho_ten : "Đang chờ Sup nhận"} />
        <InfoCard label="Người hướng dẫn" value={employee.nguoi_huong_dan ?? "Chưa phân công"} />
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Phân công hiện tại</h2>
        {!sup ? (
          <p className="text-sm text-slate-500">
            Bạn chưa được Sup phụ trách nhận vào team. Vui lòng chờ Sup hoặc liên hệ HRBP.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Row label="Thời gian hướng dẫn" value={currentAssignment?.thoi_gian_huong_dan ?? "—"} />
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Công việc</dt>
              {congViecList.length > 0 ? (
                <dd className="mt-1 space-y-2">
                  {congViecList.map((cv) => {
                    const mota = jobMota(employee.ca, cv);
                    return (
                      <div key={cv} className="rounded-lg border border-slate-200 p-2">
                        <p className="font-medium text-slate-800">{cv}</p>
                        {mota && <p className="mt-0.5 text-xs text-slate-500">{mota}</p>}
                      </div>
                    );
                  })}
                </dd>
              ) : (
                <dd className="font-medium text-slate-800">—</dd>
              )}
            </div>
            <div className="sm:col-span-2">
              <Row label="Ghi chú từ Sup" value={currentAssignment?.sup_note || "—"} />
            </div>
          </dl>
        )}
      </section>

      <section className="card mb-6 p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Tiến độ tự đánh giá 3 tuần</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([1, 2, 3] as const).map((tuan) => {
            const done = progress.selfWeeksDone.includes(tuan);
            const open = progress.selfAllowedWeek === tuan;
            return (
              <div
                key={tuan}
                className={`rounded-lg border p-3 text-sm ${
                  done
                    ? "border-green-200 bg-green-50"
                    : open
                      ? "border-ghn-100 bg-ghn-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="font-medium text-slate-800">Tuần {tuan}</p>
                <p
                  className={
                    done ? "text-green-700" : open ? "text-ghn-700" : "text-slate-500"
                  }
                >
                  {done ? "Đã nộp" : open ? "Đang mở" : "Chưa tới hạn"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <SelfEvalForm allowedWeekNum={progress.selfAllowedWeek} doneWeeks={progress.selfWeeksDone} />
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Lịch sử tự đánh giá của bạn</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="card p-3 text-sm">
                <p className="font-medium text-slate-700">
                  Tuần {h.tuan} — {new Date(h.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
