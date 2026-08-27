import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllSupUsers, getAllHrbpUsers, getAllEmployees } from "@/lib/queries";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export default function AdminPage() {
  const session = getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const supUsers = getAllSupUsers();
  const hrbpUsers = getAllHrbpUsers();
  const employees = getAllEmployees();

  return (
    <AdminDashboardClient
      adminId={session.id}
      adminName={session.ho_ten}
      supUsers={supUsers}
      hrbpUsers={hrbpUsers}
      employees={employees}
    />
  );
}
