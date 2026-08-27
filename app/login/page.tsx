import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import { IconCheckCircle, IconClipboard, IconUsers } from "@/components/ui/icons";

export default function LoginPage() {
  const session = getSession();
  if (session) {
    const dest =
      session.role === "admin"
        ? "/admin"
        : session.role === "hrbp"
        ? "/hrbp"
        : session.role === "sup"
        ? "/sup"
        : "/employee";
    redirect(dest);
  }

  return (
    <main className="flex min-h-screen bg-white">
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden bg-gradient-to-br from-ghn-50 via-white to-orange-50 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-ghn-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-ghn-200/50 blur-3xl" />

        <div className="relative">
          <img src="/ghn-logo.png" alt="Giao Hàng Nhanh" className="h-10 w-auto" />
          <h2 className="mt-10 max-w-sm text-3xl font-bold leading-tight text-slate-900">
            Đồng hành cùng nhân viên mới trong 3 tuần đầu tiên
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            Hệ thống gắn nhân viên, phân công kèm cặp và đánh giá onboarding — giúp tân binh hoà nhập
            nhanh, Sup quản lý gọn, HRBP nắm toàn cảnh.
          </p>
        </div>

        <div className="relative space-y-4">
          <FeatureRow icon={<IconUsers className="h-4 w-4" />} text="Gắn nhân viên mới về đúng Sup, đúng ca" />
          <FeatureRow
            icon={<IconClipboard className="h-4 w-4" />}
            text="Phân công kèm cặp theo tuần, theo khu vực"
          />
          <FeatureRow
            icon={<IconCheckCircle className="h-4 w-4" />}
            text="Tự đánh giá và cảnh báo nguy cơ nghỉ việc sớm"
          />
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-[#f7f7f9] px-4 py-10 lg:bg-white">
        <LoginForm />
      </div>
    </main>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ghn shadow-soft">
        {icon}
      </span>
      <p className="text-sm font-medium text-slate-700">{text}</p>
    </div>
  );
}
