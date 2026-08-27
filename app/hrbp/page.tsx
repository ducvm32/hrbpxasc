import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { todayISO } from "@/lib/db";
import {
  currentWeekOf,
  getAllEmployees,
  getAllSupUsers,
  getAllSupEvaluations,
  getAllSelfEvaluations,
  getAreaReportByWeek,
  getRiskFlags,
  getSelfEvalSummary,
} from "@/lib/queries";
import HrbpDashboardClient from "@/components/hrbp/HrbpDashboardClient";

export default function HrbpPage() {
  const session = getSession();
  if (!session || session.role !== "hrbp") redirect("/login");

  const employees = getAllEmployees();
  const supUsers = getAllSupUsers();
  const supEvaluations = getAllSupEvaluations();
  const selfEvaluations = getAllSelfEvaluations();
  const areaReport = getAreaReportByWeek();
  const selfEvalSummary = getSelfEvalSummary();
  const riskFlags = getRiskFlags();
  const currentWeekByEmployeeId = Object.fromEntries(
    employees.map((e) => [e.id, currentWeekOf(e)])
  );

  return (
    <HrbpDashboardClient
      hrbpName={session.ho_ten}
      employees={employees}
      supUsers={supUsers}
      supEvaluations={supEvaluations}
      selfEvaluations={selfEvaluations}
      areaReport={areaReport}
      selfEvalSummary={selfEvalSummary}
      riskFlags={riskFlags}
      currentWeekByEmployeeId={currentWeekByEmployeeId}
      today={todayISO()}
    />
  );
}
