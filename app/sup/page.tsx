import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSupById, getTeamForSup, getAssignmentsForEmployee, employeeProgress } from "@/lib/queries";
import SupDashboardClient from "@/components/sup/SupDashboardClient";
import type { Assignment } from "@/lib/types";

export default function SupPage() {
  const session = getSession();
  if (!session || session.role !== "sup") redirect("/login");

  const sup = getSupById(session.id);
  if (!sup) redirect("/login");

  const team = getTeamForSup(sup.id);

  const assignmentsByEmployee: Record<string, Assignment[]> = {};
  const progressByEmployee: Record<string, ReturnType<typeof employeeProgress>> = {};
  for (const emp of team) {
    assignmentsByEmployee[emp.id] = getAssignmentsForEmployee(emp.id);
    progressByEmployee[emp.id] = employeeProgress(emp);
  }

  const dueEvaluated = team.filter((e) => {
    const p = progressByEmployee[e.id];
    return p.dueWeek !== 0 && p.supWeeksDone.includes(p.dueWeek);
  }).length;

  return (
    <SupDashboardClient
      sup={sup}
      team={team}
      assignmentsByEmployee={assignmentsByEmployee}
      progressByEmployee={progressByEmployee}
      dueEvaluated={dueEvaluated}
    />
  );
}
