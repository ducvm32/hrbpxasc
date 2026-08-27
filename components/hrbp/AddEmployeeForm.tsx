"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { addEmployeeAction, type ActionResult } from "@/lib/actions";
import { CA_LIST } from "@/lib/constants";

const initialState: ActionResult = {};

async function callAdd(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await addEmployeeAction(formData)) ?? {};
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Đang thêm..." : "Thêm nhân viên"}
    </button>
  );
}

export default function AddEmployeeForm({ today }: { today: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState(callAdd, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <div>
        <label className="label">Họ tên</label>
        <input name="ho_ten" required className="input" placeholder="Nguyễn Văn A" />
      </div>
      <div>
        <label className="label">Mã NV</label>
        <input name="ma_nv" required className="input" placeholder="4001234" />
      </div>
      <div>
        <label className="label">Ca làm việc</label>
        <select name="ca" required className="input" defaultValue="">
          <option value="" disabled>
            -- Chọn ca --
          </option>
          {CA_LIST.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Ngày nhận việc</label>
        <input type="date" name="ngay_nhan_viec" defaultValue={today} className="input" />
      </div>
      <div>
        <label className="label">Giai đoạn đánh giá</label>
        <input value="Tuần 1 (mặc định)" disabled className="input bg-slate-50 text-slate-400" />
      </div>

      <div className="sm:col-span-2 lg:col-span-5">
        {state?.error && (
          <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.success && (
          <p className="mb-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">
            Đã thêm nhân viên mới vào POOL.
          </p>
        )}
        <SubmitBtn />
      </div>
    </form>
  );
}
