import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-orange-50 via-white to-white px-4 py-10">
      <LoginForm />
    </main>
  );
}
