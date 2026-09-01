"use client";

import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import AssignModal from "@/components/sup/AssignModal";
import SupEvalForm from "@/components/sup/SupEvalForm";
import EmptyState from "@/components/ui/EmptyState";
import type { Assignment, Employee, SupUser, Tuan } from "@/lib/types";
import type { employeeProgress } from "@/lib/queries";

type Progress = ReturnType<typeof employeeProgress>;
type AssignFilter = "all" | "assigned" | "unassigned";
type EvalFilter = "all" | "evaluated" | "unevaluated";

function hasWorkAssignedThisWeek(assignments: Assignment[], p: Progress): boolean {
  const tuan = (p.dueWeek || 1) as Tuan;
  const current = assignments.find((a) => a.tuan === tuan);
  return !!current?.cong_viec?.trim();
}

function isEvaluatedThisWeek(p: Progress): boolean {
  return p.dueWeek !== 0 && p.supWeeksDone.includes(p.dueWeek);
}

export default function SupDashboardClient({
  sup,
  team,
  assignmentsByEmployee,
  progressByEmployee,
  dueEvaluated,
}: {
  sup: SupUser;
  team: Employee[];
  assignmentsByEmployee: Record<string, Assignment[]>;
  progressByEmployee: Record<string, Progress>;
  dueEvaluated: number;
}) {
  const [tab, setTab] = useState<"assign" | "eval">("assign");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("all");
  const [evalFilter, setEvalFilter] = useState<EvalFilter>("all");

  const assignedCount = team.filter((e) =>
    hasWorkAssignedThisWeek(assignmentsByEmployee[e.id] ?? [], progressByEmployee[e.id])
  ).length;
  const evaluatedCount = team.filter((e) => isEvaluatedThisWeek(progressByEmployee[e.id])).length;

  const assignList = team.filter((e) => {
    if (assignFilter === "all") return true;
    const assigned = hasWorkAssignedThisWeek(assignmentsByEmployee[e.id] ?? [], progressByEmployee[e.id]);
    return assignFilter === "assigned" ? assigned : !assigned;
  });

  const evalList = team.filter((e) => {
    if (evalFilter === "all") return true;
    const evaluated = isEvaluatedThisWeek(progressByEmployee[e.id]);
    return evalFilter === "evaluated" ? evaluated : !evaluated;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <DashboardHeader
        title={`Xin chào, ${sup.ho_ten}`}
        subtitle="Quản lý chung nhân viên theo Ca, phân công người hướng dẫn, giao việc theo ngày/tuần và đánh giá cuối ca."
        roleBadge={
          <span className="badge bg-slate-100 text-slate-600">
            Supervisor (Team {sup.ca_phu_trach.join(" / ")})
          </span>
        }
      />

      <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-ghn-50 px-3 py-1 text-xs font-semibold text-ghn-700">
        <span className="h-1.5 w-1.5 rounded-full bg-ghn-500" />
        KPI Giữ Người 14 Ngày
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Nhân viên trong Ca bạn phụ trách" value={`${team.length} Bạn`} />
        <StatCard label="Đã đánh giá cuối ca" value={`${dueEvaluated} / ${team.length}`} />
      </section>

      <p className="mb-6 text-sm text-slate-500">
        Toàn bộ Sup phụ trách cùng Ca đều thấy và có thể phân công/đánh giá chung danh sách nhân viên
        bên dưới — không cần nhận riêng từng người.
      </p>

      <div className="mb-4 inline-flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button onClick={() => setTab("assign")} className={`tab-pill ${tab === "assign" ? "tab-pill-active" : ""}`}>
          Danh sách &amp; Phân công 14 ngày
        </button>
        <button onClick={() => setTab("eval")} className={`tab-pill ${tab === "eval" ? "tab-pill-active" : ""}`}>
          Form đánh giá cuối ca
        </button>
      </div>

      {tab === "assign" ? (
        <div>
          <FilterPills<AssignFilter>
            value={assignFilter}
            onChange={setAssignFilter}
            options={[
              { value: "all", label: "Tất cả", count: team.length },
              { value: "assigned", label: "Đã phân công (tuần này)", count: assignedCount },
              { value: "unassigned", label: "Chưa phân công (tuần này)", count: team.length - assignedCount },
            ]}
          />

          <div className="table-shell overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Ca</th>
                  <th className="px-4 py-3">Người HD</th>
                  <th className="px-4 py-3">Khu vực/Line</th>
                  <th className="px-4 py-3">Tuần</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignList.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title={
                          team.length === 0
                            ? "Chưa có nhân viên nào trong Ca bạn phụ trách"
                            : "Không có nhân viên nào khớp bộ lọc"
                        }
                        description={
                          team.length === 0 ? "HRBP thêm NV mới thuộc Ca này sẽ tự động xuất hiện ở đây." : undefined
                        }
                      />
                    </td>
                  </tr>
                )}
                {assignList.map((e) => {
                  const p = progressByEmployee[e.id];
                  const assigned = hasWorkAssignedThisWeek(assignmentsByEmployee[e.id] ?? [], p);
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{e.ho_ten}</p>
                        <p className="text-xs text-slate-500">{e.ma_nv}</p>
                      </td>
                      <td className="px-4 py-3">
                        {e.ca}
                        {e.la_kpi_14ngay && (
                          <span className="badge ml-1 bg-orange-100 text-ghn-700">KPI14</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{e.nguoi_huong_dan ?? "—"}</td>
                      <td className="px-4 py-3">{e.khu_vuc_line ?? "—"}</td>
                      <td className="px-4 py-3">Tuần {p.dueWeek || 1}</td>
                      <td className="px-4 py-3">
                        {assigned ? (
                          <span className="badge bg-green-100 text-green-700">Đã phân công</span>
                        ) : (
                          <span className="badge bg-orange-100 text-ghn-700">Chưa phân công</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setEditingEmployee(e)} className="btn-secondary text-xs">
                          Phân công
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <FilterPills<EvalFilter>
            value={evalFilter}
            onChange={setEvalFilter}
            options={[
              { value: "all", label: "Tất cả", count: team.length },
              { value: "evaluated", label: "Đã đánh giá (tuần này)", count: evaluatedCount },
              { value: "unevaluated", label: "Chưa đánh giá (tuần này)", count: team.length - evaluatedCount },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {evalList.length === 0 && (
              <div className="card md:col-span-2">
                <EmptyState
                  title={
                    team.length === 0
                      ? "Chưa có nhân viên nào trong Ca bạn phụ trách để đánh giá"
                      : "Không có nhân viên nào khớp bộ lọc"
                  }
                />
              </div>
            )}
            {evalList.map((e) => {
              const p = progressByEmployee[e.id];
              return (
                <SupEvalForm
                  key={e.id}
                  employee={e}
                  allowedWeekNum={p.supAllowedWeek}
                  doneWeeks={p.supWeeksDone}
                />
              );
            })}
          </div>
        </div>
      )}

      {editingEmployee && (
        <AssignModal
          employee={editingEmployee}
          assignments={assignmentsByEmployee[editingEmployee.id] ?? []}
          defaultWeek={(progressByEmployee[editingEmployee.id]?.dueWeek || 1) as Tuan}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </main>
  );
}

function FilterPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count: number }[];
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition duration-150 ${
            value === opt.value
              ? "border-ghn bg-ghn text-white shadow-soft"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {opt.label} ({opt.count})
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-interactive p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
