import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default function Home() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/admin");
  if (session.role === "hrbp") redirect("/hrbp");
  if (session.role === "sup") redirect("/sup");
  redirect("/employee");
}
