"use client";

import { useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { RadioQuestion, StarRating } from "@/components/ui/FormControls";
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
                  ? "border-brand-100 bg-brand-50 text-brand-700"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500"
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
  const uid = useId();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <div className="card space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-neutral-800">{employee.ho_ten} — {employee.ma_nv}</p>
          <p className="text-xs text-neutral-500">{employee.ca}</p>
        </div>
        {allowedWeekNum > 0 && (
          <span className="badge bg-brand-50 text-brand-700">Đánh giá Tuần {allowedWeekNum}</span>
        )}
      </div>

      <WeekTracker doneWeeks={doneWeeks} allowedWeekNum={allowedWeekNum} />

      {state?.success && (
        <p className="text-sm text-green-700">Đã ghi nhận đánh giá. Cảm ơn Sup!</p>
      )}

      {allowedWeekNum === 0 ? (
        <p className="text-sm text-neutral-500">
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

          <StarRating name="danh_gia_sao" legend="4. Đánh giá thái độ & hiệu suất của NV tuần này" />

          <div>
            <label className="label" htmlFor={`${uid}-noi-dung`}>
              Nội dung đánh giá
            </label>
            <textarea id={`${uid}-noi-dung`} name="noi_dung" className="input" rows={3} placeholder="Nhận xét về thái độ, tiến độ..." />
          </div>

          <div>
            <label className="label" htmlFor={`${uid}-van-de`}>
              Vấn đề phát sinh (nếu có)
            </label>
            <textarea id={`${uid}-van-de`} name="van_de_phat_sinh" className="input" rows={2} />
          </div>

          <div>
            <label className="label" htmlFor={`${uid}-anh`}>
              Hình ảnh xác nhận thực tế
            </label>
            <input id={`${uid}-anh`} type="file" name="anh" accept="image/*" multiple className="text-sm" />
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
