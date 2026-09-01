import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default function LoginPage({ searchParams }: { searchParams?: { google_error?: string } }) {
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-ghn-50 via-white to-white px-4 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-ghn-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-ghn-200/40 blur-3xl" />
      <LoginForm googleError={searchParams?.google_error} />
    </main>
  );
}
