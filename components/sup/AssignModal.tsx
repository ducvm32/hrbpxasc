"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveAssignmentAction, type ActionResult } from "@/lib/actions";
import { jobsForCa } from "@/lib/constants";
import type { Assignment, Employee, Tuan } from "@/lib/types";

const initialState: ActionResult = {};

async function callSave(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await saveAssignmentAction(formData)) ?? {};
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Đang lưu..." : "Lưu phân công"}
    </button>
  );
}

function parseTimeMap(thoiGianHuongDan: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!thoiGianHuongDan) return map;
  thoiGianHuongDan.split(";").forEach((part) => {
    const idx = part.lastIndexOf(":");
    if (idx === -1) return;
    const time = part.slice(0, idx).trim();
    const job = part.slice(idx + 1).trim();
    if (job) map[job] = time;
  });
  return map;
}

function JobTimePicker({
  tuan,
  jobs,
  current,
}: {
  tuan: Tuan;
  jobs: readonly { value: string; mota: string }[];
  current: Assignment | undefined;
}) {
  const initialSelected = current?.cong_viec
    ? current.cong_viec.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const initialTimes = parseTimeMap(current?.thoi_gian_huong_dan);
  const [times, setTimes] = useState<Record<string, string>>(() => {
    const t: Record<string, string> = {};
    initialSelected.forEach((j) => {
      t[j] = initialTimes[j] ?? "";
    });
    return t;
  });

  const selectedJobs = Object.keys(times);
  const congViecValue = selectedJobs.join(", ");
  const thoiGianValue = selectedJobs.map((j) => `${times[j] || "?"}: ${j}`).join("; ");

  function toggle(job: string) {
    setTimes((prev) => {
      const next = { ...prev };
      if (job in next) delete next[job];
      else next[job] = "";
      return next;
    });
  }

  function setTime(job: string, value: string) {
    setTimes((prev) => ({ ...prev, [job]: value }));
  }

  return (
    <div>
      <label className="label">Khu vực (tick chọn nhiều — mỗi khu vực gắn công việc cụ thể, Tuần {tuan})</label>
      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        {jobs.map((j) => {
          const checked = j.value in times;
          return (
            <div key={j.value} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <label className="flex flex-1 items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(j.value)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {j.value}
                </label>
                {checked && (
                  <input
                    value={times[j.value]}
                    onChange={(e) => setTime(j.value, e.target.value)}
                    placeholder="VD: 14h30 - 17h"
                    className="input w-36 text-xs"
                  />
                )}
              </div>
              <p className="ml-6 mt-0.5 text-xs text-slate-400">{j.mota}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Thời gian hướng dẫn (tự tổng hợp): {thoiGianValue || "— chưa chọn khu vực nào —"}
      </p>
      <p className="mt-1 text-xs text-amber-600">
        * Vị trí công việc có thể thay đổi theo ngày để đảm bảo vận hành. Nếu có thay đổi, Sup note rõ
        ở "Ghi chú thêm" sẽ phân công làm khâu nào, dự kiến trong bao lâu.
      </p>

      <input type="hidden" name="cong_viec" value={congViecValue} />
      <input type="hidden" name="thoi_gian_huong_dan" value={thoiGianValue} />
    </div>
  );
}

export default function AssignModal({
  employee,
  assignments,
  defaultWeek,
  onClose,
}: {
  employee: Employee;
  assignments: Assignment[];
  defaultWeek: Tuan;
  onClose: () => void;
}) {
  const [tuan, setTuan] = useState<Tuan>(defaultWeek);
  const [state, formAction] = useFormState(callSave, initialState);
  const jobs = jobsForCa(employee.ca);
  const current = assignments.find((a) => a.tuan === tuan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="card max-h-full w-full max-w-xl overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Phân công — {employee.ho_ten}</h3>
            <p className="text-sm text-slate-500">
              Mã NV {employee.ma_nv} · {employee.ca}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {[1, 2, 3].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setTuan(w as Tuan)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tuan === w ? "bg-ghn text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Tuần {w}
            </button>
          ))}
        </div>

        <form
          action={formAction}
          key={tuan}
          onSubmit={() => setTimeout(onClose, 50)}
          className="space-y-4"
        >
          <input type="hidden" name="employee_id" value={employee.id} />
          <input type="hidden" name="tuan" value={tuan} />

          <div>
            <label className="label">Người trực tiếp hướng dẫn</label>
            <input
              name="nguoi_huong_dan"
              defaultValue={employee.nguoi_huong_dan ?? ""}
              className="input"
              placeholder="Họ tên người kèm cặp"
            />
          </div>

          <JobTimePicker tuan={tuan} jobs={jobs} current={current} />

          <div>
            <label className="label">Ghi chú thêm (Sup)</label>
            <textarea
              name="sup_note"
              defaultValue={current?.sup_note ?? ""}
              className="input"
              rows={2}
            />
          </div>

          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Đóng
            </button>
            <SaveButton />
          </div>
        </form>
      </div>
    </div>
  );
}
