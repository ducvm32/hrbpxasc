import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getEmployeeById,
  getSupById,
  getAssignmentsForEmployee,
  employeeProgress,
  getSelfEvaluations,
} from "@/lib/queries";
import EmployeeDashboardClient from "@/components/employee/EmployeeDashboardClient";

export default function EmployeePage() {
  const session = getSession();
  if (!session || session.role !== "nhanvien") redirect("/login");

  const employee = getEmployeeById(session.id);
  if (!employee) redirect("/login");

  const sup = employee.sup_id ? getSupById(employee.sup_id) : null;
  const assignments = getAssignmentsForEmployee(employee.id);
  const progress = employeeProgress(employee);
  const history = getSelfEvaluations(employee.id);

  return (
    <EmployeeDashboardClient
      employee={employee}
      sup={sup}
      assignments={assignments}
      progress={progress}
      history={history}
    />
  );
}
