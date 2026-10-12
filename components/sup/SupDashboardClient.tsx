"use client";

import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import AssignModal from "@/components/sup/AssignModal";
import SupEvalForm from "@/components/sup/SupEvalForm";
import EmptyState from "@/components/ui/EmptyState";
import SearchBox, { matchesSearch } from "@/components/ui/SearchBox";
import TabBar from "@/components/ui/TabBar";
import { formatDate } from "@/lib/format";
import { isOnboardingDone } from "@/lib/week";
import type { Assignment, Employee, SupUser, Tuan } from "@/lib/types";
import type { employeeProgress } from "@/lib/queries";

type Progress = ReturnType<typeof employeeProgress>;
type AssignFilter = "all" | "unassigned" | "assigned" | "done";
type EvalFilter = "all" | "evaluated" | "unevaluated";

function currentAssignment(assignments: Assignment[], p: Progress): Assignment | undefined {
  const tuan = (p.dueWeek || 1) as Tuan;
  return assignments.find((a) => a.tuan === tuan && a.cong_viec?.trim());
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
  const [search, setSearch] = useState("");

  const isDone = (e: Employee) => isOnboardingDone(progressByEmployee[e.id].days);
  const isAssigned = (e: Employee) =>
    !!currentAssignment(assignmentsByEmployee[e.id] ?? [], progressByEmployee[e.id]);

  const searched = team.filter((e) => matchesSearch(search, e.ho_ten, e.ma_nv));
  const active = searched.filter((e) => !isDone(e));
  const done = searched.filter(isDone);
  const assignedCount = active.filter(isAssigned).length;
  const kpiCount = team.filter((e) => e.la_kpi_14ngay && !isDone(e)).length;
  const activeTeamCount = team.filter((e) => !isDone(e)).length;

  // NV đã qua 3 tuần không còn cần phân công — xếp xuống cuối danh sách "Tất cả"
  // và chỉ hiện riêng ở bộ lọc "Hoàn tất 3 tuần".
  const assignList =
    assignFilter === "all"
      ? [...active, ...done]
      : assignFilter === "done"
        ? done
        : active.filter((e) => (assignFilter === "assigned" ? isAssigned(e) : !isAssigned(e)));

  const evaluatedCount = searched.filter((e) => isEvaluatedThisWeek(progressByEmployee[e.id])).length;
  const evalList = searched
    .filter((e) => {
      if (evalFilter === "all") return true;
      const evaluated = isEvaluatedThisWeek(progressByEmployee[e.id]);
      return evalFilter === "evaluated" ? evaluated : !evaluated;
    })
    // NV đang mở đánh giá lên trước, NV chưa tới hạn/đã xong xuống sau.
    .sort((a, b) => Number(progressByEmployee[b.id].supAllowedWeek > 0) - Number(progressByEmployee[a.id].supAllowedWeek > 0));

  const emptyTitle =
    team.length === 0
      ? "Chưa có nhân viên nào trong Ca bạn phụ trách"
      : "Không có nhân viên nào khớp bộ lọc / từ khoá";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <DashboardHeader
        title={`Xin chào, ${sup.ho_ten}`}
        subtitle="Phân công người hướng dẫn, giao việc theo tuần và đánh giá cuối ca cho NV mới trong Ca bạn phụ trách."
        roleBadge={
          <span className="badge bg-slate-100 text-slate-600">Sup · {sup.ca_phu_trach.join(" / ")}</span>
        }
      />

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="NV đang trong 3 tuần onboarding" value={`${activeTeamCount}`} />
        <StatCard label="Đã đánh giá cuối ca (tuần hiện tại)" value={`${dueEvaluated} / ${activeTeamCount}`} />
        <StatCard label="Thuộc nhóm KPI giữ người 14 ngày" value={`${kpiCount}`} highlight={kpiCount > 0} />
      </section>

      <p className="mb-6 text-sm text-slate-500">
        Mọi Sup phụ trách cùng Ca đều thấy và có thể phân công/đánh giá chung danh sách dưới đây.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TabBar
          label="Công việc của Sup"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "assign", label: "Danh sách & Phân công" },
            { value: "eval", label: "Đánh giá cuối ca" },
          ]}
        />
        <div className="mb-4">
          <SearchBox value={search} onChange={setSearch} />
        </div>
      </div>

      {tab === "assign" ? (
        <div>
          <FilterPills<AssignFilter>
            label="Lọc theo trạng thái phân công"
            value={assignFilter}
            onChange={setAssignFilter}
            options={[
              { value: "all", label: "Tất cả", count: searched.length },
              { value: "unassigned", label: "Chưa phân công tuần này", count: active.length - assignedCount },
              { value: "assigned", label: "Đã phân công tuần này", count: assignedCount },
              { value: "done", label: "Hoàn tất 3 tuần", count: done.length },
            ]}
          />

          {/* Desktop (md+) */}
          <div className="table-shell hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Ca</th>
                  <th className="px-4 py-3">Tiến độ</th>
                  <th className="px-4 py-3">Người HD</th>
                  <th className="px-4 py-3">Công việc tuần này</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignList.map((e) => {
                  const p = progressByEmployee[e.id];
                  const cur = currentAssignment(assignmentsByEmployee[e.id] ?? [], p);
                  return (
                    <tr key={e.id} className={isDone(e) ? "text-slate-500" : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{e.ho_ten}</p>
                        <p className="text-xs text-slate-500">{e.ma_nv}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {e.ca}
                        {e.la_kpi_14ngay && <span className="badge ml-1 bg-orange-100 text-ghn-700">KPI14</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{stageLabel(e, p)}</td>
                      <td className="px-4 py-3">{e.nguoi_huong_dan ?? "—"}</td>
                      <td className="px-4 py-3">{cur?.cong_viec || "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge done={isDone(e)} assigned={!!cur} />
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
            {assignList.length === 0 && (
              <EmptyState
                title={emptyTitle}
                description={
                  team.length === 0 ? "HRBP thêm NV mới thuộc Ca này sẽ tự động xuất hiện ở đây." : undefined
                }
              />
            )}
          </div>

          {/* Mobile (<md) */}
          <ul className="space-y-3 md:hidden">
            {assignList.map((e) => {
              const p = progressByEmployee[e.id];
              const cur = currentAssignment(assignmentsByEmployee[e.id] ?? [], p);
              return (
                <li key={e.id} className="card p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{e.ho_ten}</p>
                      <p className="text-xs text-slate-500">
                        {e.ma_nv} · {e.ca}
                        {e.la_kpi_14ngay && " · KPI14"}
                      </p>
                    </div>
                    <StatusBadge done={isDone(e)} assigned={!!cur} />
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5">
                    <dt className="text-slate-500">Tiến độ</dt>
                    <dd className="text-slate-800">{stageLabel(e, p)}</dd>
                    <dt className="text-slate-500">Người HD</dt>
                    <dd className="text-slate-800">{e.nguoi_huong_dan ?? "—"}</dd>
                    <dt className="text-slate-500">Công việc</dt>
                    <dd className="text-slate-800">{cur?.cong_viec || "—"}</dd>
                  </dl>
                  <button onClick={() => setEditingEmployee(e)} className="btn-secondary mt-3 w-full text-sm">
                    Phân công
                  </button>
                </li>
              );
            })}
            {assignList.length === 0 && (
              <li className="card">
                <EmptyState title={emptyTitle} />
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div>
          <FilterPills<EvalFilter>
            label="Lọc theo trạng thái đánh giá"
            value={evalFilter}
            onChange={setEvalFilter}
            options={[
              { value: "all", label: "Tất cả", count: searched.length },
              { value: "unevaluated", label: "Chưa đánh giá tuần này", count: searched.length - evaluatedCount },
              { value: "evaluated", label: "Đã đánh giá tuần này", count: evaluatedCount },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {evalList.length === 0 && (
              <div className="card md:col-span-2">
                <EmptyState title={emptyTitle} />
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

function stageLabel(e: Employee, p: Progress): string {
  if (p.dueWeek === 0) return `Nhận việc ${formatDate(e.ngay_nhan_viec)}`;
  if (isOnboardingDone(p.days)) return "Đã qua 3 tuần";
  return `Tuần ${p.dueWeek} · Ngày ${p.days}`;
}

function StatusBadge({ done, assigned }: { done: boolean; assigned: boolean }) {
  if (done) return <span className="badge shrink-0 bg-slate-100 text-slate-600">Hoàn tất 3 tuần</span>;
  return assigned ? (
    <span className="badge shrink-0 bg-green-100 text-green-800">Đã phân công</span>
  ) : (
    <span className="badge shrink-0 bg-orange-100 text-ghn-700">Chưa phân công</span>
  );
}

function FilterPills<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count: number }[];
}) {
  return (
    <div role="group" aria-label={label} className="mb-3 flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition duration-150 ${
            value === opt.value
              ? "border-ghn-600 bg-ghn-600 text-white shadow-soft"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {opt.label} ({opt.count})
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`card card-interactive p-4 ${highlight ? "border-ghn-200 bg-ghn-50" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "text-ghn-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
