"use client";

import { useId, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Modal from "@/components/ui/Modal";
import { useCloseOnSuccess } from "@/components/ui/useCloseOnSuccess";
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
    <fieldset>
      <legend className="label">
        Công việc Tuần {tuan} <span className="font-normal text-neutral-500">(chọn 1 hoặc nhiều, ghi giờ hướng dẫn cho từng việc)</span>
      </legend>
      <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
        {jobs.map((j) => {
          const checked = j.value in times;
          return (
            <div key={j.value} className="border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-800">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(j.value)}
                    className="h-5 w-5 shrink-0 rounded border-neutral-300 accent-brand-600"
                  />
                  {j.value}
                </label>
                {checked && (
                  <input
                    value={times[j.value]}
                    onChange={(e) => setTime(j.value, e.target.value)}
                    placeholder="VD: 14h30 - 17h"
                    aria-label={`Giờ hướng dẫn cho ${j.value}`}
                    className="input w-full text-xs sm:w-36"
                  />
                )}
              </div>
              <p className="ml-7 mt-0.5 text-xs text-neutral-500">{j.mota}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        Tổng hợp: {thoiGianValue || "— chưa chọn công việc nào —"}
      </p>
      <p className="mt-1 text-xs text-amber-700">
        * Vị trí công việc có thể thay đổi theo ngày để đảm bảo vận hành. Nếu có thay đổi, Sup note rõ
        ở "Ghi chú thêm" sẽ phân công làm khâu nào, dự kiến trong bao lâu.
      </p>

      <input type="hidden" name="cong_viec" value={congViecValue} />
      <input type="hidden" name="thoi_gian_huong_dan" value={thoiGianValue} />
    </fieldset>
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
  useCloseOnSuccess(state, onClose);
  const uid = useId();
  const jobs = jobsForCa(employee.ca);
  const current = assignments.find((a) => a.tuan === tuan);

  return (
    <Modal
      title={`Phân công — ${employee.ho_ten}`}
      subtitle={`Mã NV ${employee.ma_nv} · ${employee.ca}`}
      onClose={onClose}
      maxWidthClassName="max-w-xl"
    >
      <div role="group" aria-label="Chọn tuần phân công" className="mb-4 grid grid-cols-3 gap-2 sm:flex">
        {[1, 2, 3].map((w) => {
          const has = assignments.some((a) => a.tuan === w && a.cong_viec?.trim());
          return (
            <button
              key={w}
              type="button"
              aria-pressed={tuan === w}
              onClick={() => setTuan(w as Tuan)}
              className={`min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium transition duration-150 ${
                tuan === w ? "bg-brand-600 text-white shadow-soft" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              Tuần {w}
              {has && (
                <>
                  <span aria-hidden="true"> ✓</span>
                  <span className="sr-only"> (đã phân công)</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <form action={formAction} key={tuan} className="space-y-4">
        <input type="hidden" name="employee_id" value={employee.id} />
        <input type="hidden" name="tuan" value={tuan} />

        <div>
          <label className="label" htmlFor={`${uid}-hd`}>
            Người trực tiếp hướng dẫn
          </label>
          <input
            id={`${uid}-hd`}
            name="nguoi_huong_dan"
            defaultValue={employee.nguoi_huong_dan ?? ""}
            className="input"
            placeholder="Họ tên người kèm cặp"
          />
        </div>

        <JobTimePicker tuan={tuan} jobs={jobs} current={current} />

        <div>
          <label className="label" htmlFor={`${uid}-note`}>
            Ghi chú thêm (Sup)
          </label>
          <textarea
            id={`${uid}-note`}
            name="sup_note"
            defaultValue={current?.sup_note ?? ""}
            className="input"
            rows={2}
          />
        </div>

        {state?.error && (
          <p className="alert-error" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Đóng
          </button>
          <SaveButton />
        </div>
      </form>
    </Modal>
  );
}
