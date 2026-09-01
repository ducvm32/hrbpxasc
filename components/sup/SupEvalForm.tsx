"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { submitSupEvaluationAction, type ActionResult } from "@/lib/actions";
import {
  DUNG_CONG_VIEC_SUP_OPTIONS,
  KHA_NANG_TIEP_THU_OPTIONS,
  KHOI_LUONG_CONG_VIEC_OPTIONS,
} from "@/lib/constants";
import type { Employee } from "@/lib/types";

const initialState: ActionResult = {};

async function callSubmit(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await submitSupEvaluationAction(formData)) ?? {};
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Đang gửi..." : "Gửi đánh giá"}
    </button>
  );
}

function RadioQuestion({
  name,
  question,
  options,
}: {
  name: string;
  question: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="label">{question}</label>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition duration-150 has-[:checked]:border-ghn has-[:checked]:bg-ghn-50 has-[:checked]:text-ghn-700 hover:bg-slate-50"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              required
              className="h-4 w-4 border-slate-300 text-ghn focus:ring-ghn/30"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function StarRating({ name }: { name: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  return (
    <div>
      <label className="label">Đánh giá thái độ &amp; hiệu suất của NV tuần này</label>
      <input type="hidden" name={name} value={value || ""} required />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl leading-none transition-transform duration-100 hover:scale-110"
            aria-label={`${star} sao`}
          >
            <span className={(hover || value) >= star ? "text-ghn-500" : "text-slate-300"}>★</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekTracker({ doneWeeks, allowedWeekNum }: { doneWeeks: number[]; allowedWeekNum: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {([1, 2, 3] as const).map((tuan) => {
        const done = doneWeeks.includes(tuan);
        const open = allowedWeekNum === tuan;
        return (
          <div
            key={tuan}
            className={`rounded-lg border px-2 py-1.5 text-center text-xs ${
              done
                ? "border-green-200 bg-green-50 text-green-700"
                : open
                  ? "border-ghn-100 bg-ghn-50 text-ghn-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            <p className="font-medium">Tuần {tuan}</p>
            <p>{done ? "Đã đánh giá" : open ? "Đang mở" : "Chưa tới hạn"}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function SupEvalForm({
  employee,
  allowedWeekNum,
  doneWeeks,
}: {
  employee: Employee;
  allowedWeekNum: number;
  doneWeeks: number[];
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(callSubmit, initialState);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-800">{employee.ho_ten} — {employee.ma_nv}</p>
          <p className="text-xs text-slate-500">{employee.ca}</p>
        </div>
        {allowedWeekNum > 0 && (
          <span className="badge bg-ghn-50 text-ghn-700">Đánh giá Tuần {allowedWeekNum}</span>
        )}
      </div>

      <WeekTracker doneWeeks={doneWeeks} allowedWeekNum={allowedWeekNum} />

      {state?.success && (
        <p className="text-sm text-green-600">Đã ghi nhận đánh giá. Cảm ơn Sup!</p>
      )}

      {allowedWeekNum === 0 ? (
        <p className="text-sm text-slate-500">
          {doneWeeks.length >= 3
            ? "Đã hoàn tất đánh giá đủ 3 tuần."
            : "Chưa đến hạn đánh giá tuần mới cho nhân viên này."}
        </p>
      ) : (
        <form action={formAction} key={allowedWeekNum} className="space-y-3">
          <input type="hidden" name="employee_id" value={employee.id} />
          <input type="hidden" name="tuan" value={allowedWeekNum} />

          <RadioQuestion
            name="dung_cong_viec"
            question="1. NV có đang làm đúng công việc/line được phân công không?"
            options={DUNG_CONG_VIEC_SUP_OPTIONS}
          />

          <RadioQuestion
            name="kha_nang_tiep_thu"
            question="2. Khả năng tiếp thu & thực hiện công việc của NV thế nào?"
            options={KHA_NANG_TIEP_THU_OPTIONS}
          />

          <RadioQuestion
            name="khoi_luong_cong_viec"
            question="3. Theo bạn, khối lượng công việc hiện tại của NV thế nào?"
            options={KHOI_LUONG_CONG_VIEC_OPTIONS}
          />

          <StarRating name="danh_gia_sao" />

          <div>
            <label className="label">Nội dung đánh giá</label>
            <textarea name="noi_dung" className="input" rows={3} placeholder="Nhận xét về thái độ, tiến độ..." />
          </div>

          <div>
            <label className="label">Vấn đề phát sinh (nếu có)</label>
            <textarea name="van_de_phat_sinh" className="input" rows={2} />
          </div>

          <div>
            <label className="label">Hình ảnh xác nhận thực tế</label>
            <input type="file" name="anh" accept="image/*" multiple className="text-sm" />
          </div>

          {state?.error && <p className="alert-error">{state.error}</p>}

          <div className="flex justify-end">
            <SubmitBtn />
          </div>
        </form>
      )}
    </div>
  );
}
