"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import DashboardHeader from "@/components/DashboardHeader";
import AssignModal from "@/components/sup/AssignModal";
import SupEvalForm from "@/components/sup/SupEvalForm";
import EmptyState from "@/components/ui/EmptyState";
import { claimEmployeeAction } from "@/lib/actions";
import type { Assignment, Employee, SupUser, Tuan } from "@/lib/types";
import type { employeeProgress } from "@/lib/queries";

type Progress = ReturnType<typeof employeeProgress>;

export default function SupDashboardClient({
  sup,
  team,
  pool,
  assignmentsByEmployee,
  progressByEmployee,
  dueEvaluated,
}: {
  sup: SupUser;
  team: Employee[];
  pool: Employee[];
  assignmentsByEmployee: Record<string, Assignment[]>;
  progressByEmployee: Record<string, Progress>;
  dueEvaluated: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"assign" | "eval">("assign");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isPending, startTransition] = useTransition();
  const [claimError, setClaimError] = useState<string | null>(null);

  function claim(employeeId: string) {
    setClaimError(null);
    startTransition(async () => {
      const res = await claimEmployeeAction(employeeId);
      if (res?.error) setClaimError(res.error);
      else router.refresh();
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    if (e.over?.id === "team-dropzone" && typeof e.active.id === "string") {
      claim(e.active.id);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <DashboardHeader
          title={`Xin chào, ${sup.ho_ten}`}
          subtitle="Quản lý nhận việc, phân công người hướng dẫn, giao việc theo ngày/tuần và đánh giá cuối ca."
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

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Nhân viên trong team" value={`${team.length} Bạn`} />
          <StatCard label="NV mới chờ nhận (POOL)" value={`${pool.length} Bạn`} highlight />
          <StatCard label="Đã đánh giá cuối ca" value={`${dueEvaluated} / ${team.length}`} />
        </section>

        {pool.length > 0 && (
          <div className="mb-6 rounded-xl border border-ghn-100 bg-ghn-50 p-4">
            <p className="text-sm text-slate-700">
              Có nhân viên mới vừa nhận việc cần Sup phụ trách — bấm nhận ngay để đưa vào team và phân
              công người kèm cặp 14 ngày.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pool.map((e) => (
                <button
                  key={e.id}
                  onClick={() => claim(e.id)}
                  disabled={isPending}
                  className="btn-primary text-sm"
                >
                  Nhận {e.ho_ten} ({e.ma_nv} – {e.ca})
                </button>
              ))}
            </div>
            {claimError && <p className="mt-2 text-sm text-red-600">{claimError}</p>}
          </div>
        )}

        <div className="mb-4 inline-flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button onClick={() => setTab("assign")} className={`tab-pill ${tab === "assign" ? "tab-pill-active" : ""}`}>
            Danh sách &amp; Phân công 14 ngày
          </button>
          <button onClick={() => setTab("eval")} className={`tab-pill ${tab === "eval" ? "tab-pill-active" : ""}`}>
            Form đánh giá cuối ca
          </button>
        </div>

        {tab === "assign" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TeamDropZone>
                <div className="table-shell overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3">Nhân viên</th>
                        <th className="px-4 py-3">Ca</th>
                        <th className="px-4 py-3">Người HD</th>
                        <th className="px-4 py-3">Khu vực/Line</th>
                        <th className="px-4 py-3">Tuần</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {team.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            <EmptyState
                              title="Chưa có nhân viên trong team"
                              description='Kéo thả hoặc bấm "Nhận" từ POOL bên phải.'
                            />
                          </td>
                        </tr>
                      )}
                      {team.map((e) => {
                        const p = progressByEmployee[e.id];
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
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setEditingEmployee(e)}
                                className="btn-secondary text-xs"
                              >
                                Phân công
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TeamDropZone>
            </div>

            <div>
              <h2 className="section-title">POOL — NV mới chờ nhận ({pool.length})</h2>
              <div className="space-y-2">
                {pool.length === 0 && (
                  <div className="card">
                    <EmptyState title="Không có nhân viên chờ nhận" />
                  </div>
                )}
                {pool.map((e) => (
                  <PoolCard key={e.id} employee={e} onClaim={() => claim(e.id)} pending={isPending} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {team.length === 0 && (
              <div className="card md:col-span-2">
                <EmptyState title="Chưa có nhân viên trong team để đánh giá" />
              </div>
            )}
            {team.map((e) => {
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
        )}
      </main>

      {editingEmployee && (
        <AssignModal
          employee={editingEmployee}
          assignments={assignmentsByEmployee[editingEmployee.id] ?? []}
          defaultWeek={(progressByEmployee[editingEmployee.id]?.dueWeek || 1) as Tuan}
          onClose={() => setEditingEmployee(null)}
        />
      )}
    </DndContext>
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

function TeamDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "team-dropzone" });
  return (
    <div ref={setNodeRef} className={isOver ? "rounded-xl ring-2 ring-ghn ring-offset-2" : ""}>
      {children}
    </div>
  );
}

function PoolCard({
  employee,
  onClaim,
  pending,
}: {
  employee: Employee;
  onClaim: () => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: employee.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className="card p-3">
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <p className="font-medium text-slate-800">{employee.ho_ten}</p>
        <p className="text-xs text-slate-500">
          {employee.ma_nv} · {employee.ca}
        </p>
        <p className="mt-1 text-xs text-slate-400">Nhận việc: {employee.ngay_nhan_viec}</p>
      </div>
      <button
        onClick={onClaim}
        disabled={pending}
        className="btn-primary mt-2 w-full text-xs"
      >
        Nhận vào team
      </button>
    </div>
  );
}
