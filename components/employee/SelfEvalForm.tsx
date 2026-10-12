"use client";

import { useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { RadioQuestion, StarRating } from "@/components/ui/FormControls";
import { useFormState, useFormStatus } from "react-dom";
import { submitSelfEvaluationAction, type ActionResult } from "@/lib/actions";
import {
  DUNG_CONG_VIEC_OPTIONS,
  KHOI_LUONG_CONG_VIEC_OPTIONS,
  MUC_DO_HUONG_DAN_OPTIONS,
} from "@/lib/constants";

const initialState: ActionResult = {};

async function callSubmit(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await submitSelfEvaluationAction(formData)) ?? {};
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Đang gửi..." : "Gửi tự đánh giá"}
    </button>
  );
}



export default function SelfEvalForm({
  allowedWeekNum,
  doneWeeks,
}: {
  allowedWeekNum: number;
  doneWeeks: number[];
}) {
  const router = useRouter();
  const [state, formAction] = useFormState(callSubmit, initialState);
  const uid = useId();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  if (allowedWeekNum === 0) {
    return (
      <div className="card p-4 text-sm text-slate-500">
        {state?.success && (
          <p className="mb-2 text-green-700">Đã ghi nhận tự đánh giá của bạn. Cảm ơn bạn!</p>
        )}
        {doneWeeks.length >= 3
          ? "Bạn đã hoàn tất tự đánh giá đủ 3 tuần. Cảm ơn bạn!"
          : "Chưa đến hạn tự đánh giá tuần mới. Vui lòng quay lại sau."}
      </div>
    );
  }

  return (
    <form action={formAction} key={allowedWeekNum} className="card space-y-4 p-4">
      <input type="hidden" name="tuan" value={allowedWeekNum} />
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Tự đánh giá — Tuần {allowedWeekNum}</h3>
        <span className="badge bg-ghn-50 text-ghn-700">Đang mở</span>
      </div>

      <RadioQuestion
        name="dung_cong_viec"
        question="1. Hôm nay bạn có thực tế làm đúng công việc/line mà Sup đã gắn không?"
        options={DUNG_CONG_VIEC_OPTIONS}
      />

      <RadioQuestion
        name="muc_do_huong_dan"
        question="2. Người hướng dẫn trực tiếp có kèm cặp, chỉ bảo thực tế cho bạn không?"
        options={MUC_DO_HUONG_DAN_OPTIONS}
      />

      <RadioQuestion
        name="khoi_luong_cong_viec"
        question="3. Bạn cảm thấy khối lượng công việc tuần này thế nào?"
        options={KHOI_LUONG_CONG_VIEC_OPTIONS}
      />

      <StarRating name="danh_gia_sao" legend="4. Bạn đánh giá quản lý & người hướng dẫn công việc thế nào?" />

      <div>
        <label className="label" htmlFor={`${uid}-chia-se`}>
          5. Bạn có điều chia sẻ gì để cải thiện công việc tốt hơn (không bắt buộc)
        </label>
        <textarea id={`${uid}-chia-se`} name="chia_se_cai_thien" className="input" rows={3} />
      </div>

      <div>
        <label className="label" htmlFor={`${uid}-anh`}>
          Hình ảnh / bằng chứng (nếu cần)
        </label>
        <input id={`${uid}-anh`} type="file" name="anh" accept="image/*" multiple className="text-sm" />
      </div>

      <p className="rounded-md bg-ghn-50 px-3 py-2 text-xs leading-relaxed text-ghn-700">
        <b>Cam kết bảo mật 100%:</b> Nội dung tự đánh giá này được bảo mật và chuyển thẳng về cho Bộ
        phận Nhân sự (HRBP) để hỗ trợ bạn. Quản lý trực tiếp (Sup) hoàn toàn không xem được nhận xét
        riêng của bạn. Hãy an tâm chia sẻ trung thực nhé!
      </p>

      {state?.error && <p className="alert-error">{state.error}</p>}

      <SubmitBtn />
    </form>
  );
}
