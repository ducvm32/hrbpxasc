"use client";

import { useEffect, useId, useRef } from "react";
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
  const uid = useId();

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
      <h2 className="font-semibold text-slate-800 sm:col-span-2 lg:col-span-5">Thêm nhân viên mới</h2>
      <div>
        <label className="label" htmlFor={`${uid}-ho_ten`}>
          Họ tên
        </label>
        <input id={`${uid}-ho_ten`} name="ho_ten" required className="input" placeholder="Nguyễn Văn A" />
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-ma_nv`}>
          Mã NV
        </label>
        <input id={`${uid}-ma_nv`} name="ma_nv" required className="input" placeholder="4001234" />
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-sdt`}>
          Số điện thoại
        </label>
        <input
          id={`${uid}-sdt`}
          name="sdt"
          type="tel"
          required
          className="input"
          placeholder="0901234567"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="label" htmlFor={`${uid}-ca`}>
          Ca làm việc
        </label>
        <select id={`${uid}-ca`} name="ca" required className="input" defaultValue="">
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
        <label className="label" htmlFor={`${uid}-ngay_nhan_viec`}>
          Ngày nhận việc
        </label>
        <input type="date" id={`${uid}-ngay_nhan_viec`} name="ngay_nhan_viec" defaultValue={today} className="input" />
      </div>

      <div className="sm:col-span-2 lg:col-span-5">
        {state?.error && <p className="alert-error mb-2">{state.error}</p>}
        {state?.success && <p className="alert-success mb-2">Đã thêm nhân viên mới. Sup phụ trách Ca này sẽ thấy NV ngay.</p>}
        <div className="flex flex-wrap items-center gap-3">
          <SubmitBtn />
          <p className="text-xs text-slate-500">NV mới bắt đầu ở Tuần 1, tự chuyển tuần theo ngày nhận việc.</p>
        </div>
      </div>
    </form>
  );
}
