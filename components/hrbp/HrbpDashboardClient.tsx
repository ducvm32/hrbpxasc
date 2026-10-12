"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import DashboardHeader from "@/components/DashboardHeader";
import AddEmployeeForm from "@/components/hrbp/AddEmployeeForm";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import SearchBox, { matchesSearch } from "@/components/ui/SearchBox";
import TabBar from "@/components/ui/TabBar";
import { useCloseOnSuccess } from "@/components/ui/useCloseOnSuccess";
import { IconAlertTriangle, IconDownload, IconUsers } from "@/components/ui/icons";
import {
  deleteEmployeeAction,
  exportExcelBase64Action,
  updateEmployeeAction,
  type ActionResult,
} from "@/lib/actions";
import {
  CA_LIST,
  DUNG_CONG_VIEC_LABEL,
  DUNG_CONG_VIEC_SUP_LABEL,
  isKpiCa,
  KHA_NANG_TIEP_THU_LABEL,
  KHOI_LUONG_CONG_VIEC_LABEL,
  MUC_DO_HUONG_DAN_LABEL,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { RiskFlag, SelfEvalSummary } from "@/lib/queries";
import type { Employee, SelfEvaluation, SupEvaluation, SupUser, Tuan } from "@/lib/types";

const initialState: ActionResult = {};

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

async function callUpdateEmployee(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await updateEmployeeAction(formData)) ?? {};
}

function EditEmployeeModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [state, formAction] = useFormState(callUpdateEmployee, initialState);
  useCloseOnSuccess(state, onClose);
  const uid = useId();

  return (
    <Modal
      title="Sửa nhân viên"
      subtitle={`Mã NV hiện tại: ${employee.ma_nv}`}
      onClose={onClose}
      maxWidthClassName="max-w-md"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="employee_id" value={employee.id} />
        <div>
          <label className="label" htmlFor={`${uid}-ho_ten`}>
            Họ tên
          </label>
          <input id={`${uid}-ho_ten`} name="ho_ten" defaultValue={employee.ho_ten} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-ma_nv`}>
            Mã NV
          </label>
          <input id={`${uid}-ma_nv`} name="ma_nv" defaultValue={employee.ma_nv} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-sdt`}>
            Số điện thoại
          </label>
          <input
            id={`${uid}-sdt`}
            name="sdt"
            type="tel"
            defaultValue={employee.sdt}
            required
            className="input"
            placeholder="0901234567"
          />
          {!employee.sdt && (
            <p className="mt-1 text-xs text-amber-700">
              NV này chưa có SĐT nên chưa đăng nhập được — cần bổ sung.
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-ca`}>
            Ca làm việc
          </label>
          <select id={`${uid}-ca`} name="ca" defaultValue={employee.ca} className="input">
            {CA_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-ngay`}>
            Ngày nhận việc
          </label>
          <input
            id={`${uid}-ngay`}
            type="date"
            name="ngay_nhan_viec"
            defaultValue={employee.ngay_nhan_viec}
            className="input"
          />
        </div>
        {state?.error && (
          <p className="alert-error" role="alert">
            {state.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Đóng
          </button>
          <SubmitBtn label="Lưu thay đổi" pendingLabel="Đang lưu..." />
        </div>
      </form>
    </Modal>
  );
}

function DeleteEmployeeButton({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (
      !confirm(
        `Xoá nhân viên "${employee.ho_ten}" (${employee.ma_nv})? Toàn bộ phân công và đánh giá liên quan sẽ bị xoá theo. Hành động này không thể hoàn tác.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteEmployeeAction(employee.id);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button onClick={handleDelete} disabled={isPending} className="btn-danger w-full">
        {isPending ? "Đang xoá..." : "Xoá"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function HrbpDashboardClient({
  hrbpName,
  employees,
  supUsers,
  supEvaluations,
  selfEvaluations,
  selfEvalSummary,
  riskFlags,
  currentWeekByEmployeeId,
  assignedJobByEmployeeId,
  today,
}: {
  hrbpName: string;
  employees: Employee[];
  supUsers: SupUser[];
  supEvaluations: SupEvaluation[];
  selfEvaluations: SelfEvaluation[];
  selfEvalSummary: SelfEvalSummary;
  riskFlags: RiskFlag[];
  currentWeekByEmployeeId: Record<string, Tuan | 0>;
  assignedJobByEmployeeId: Record<string, string>;
  today: string;
}) {
  const [tab, setTab] = useState<"nv" | "eval" | "report">("nv");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const supById = new Map(supUsers.map((s) => [s.id, s]));
  const empById = new Map(employees.map((e) => [e.id, e]));
  const riskEmployeeIds = new Set(riskFlags.map((f) => f.employee.id));
  const supWeeksByEmployee = new Map<string, Set<Tuan>>();
  for (const ev of supEvaluations) {
    if (!supWeeksByEmployee.has(ev.employee_id)) supWeeksByEmployee.set(ev.employee_id, new Set());
    supWeeksByEmployee.get(ev.employee_id)!.add(ev.tuan);
  }
  const selfWeeksByEmployee = new Map<string, Set<Tuan>>();
  for (const ev of selfEvaluations) {
    if (!selfWeeksByEmployee.has(ev.employee_id)) selfWeeksByEmployee.set(ev.employee_id, new Set());
    selfWeeksByEmployee.get(ev.employee_id)!.add(ev.tuan);
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const { base64, filename } = await exportExcelBase64Action();
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Xuất Excel thất bại. Vui lòng thử lại sau ít phút hoặc tải lại trang.");
    } finally {
      setExporting(false);
    }
  }

  const kpiCount = employees.filter((e) => e.la_kpi_14ngay).length;
  const supNamesForCa = (ca: string) =>
    supUsers.filter((s) => s.ca_phu_trach.includes(ca)).map((s) => s.ho_ten);

  const filteredEmployees = employees.filter((e) => matchesSearch(search, e.ho_ten, e.ma_nv, e.ca));

  function rowInfo(e: Employee) {
    const tuan = currentWeekByEmployeeId[e.id] ?? 0;
    const names = supNamesForCa(e.ca);
    return {
      isRisk: riskEmployeeIds.has(e.id),
      supDone: supWeeksByEmployee.get(e.id)?.size ?? 0,
      selfDone: selfWeeksByEmployee.get(e.id)?.size ?? 0,
      stage: e.ngay_nhan_viec > today ? "Chưa nhận việc" : tuan ? `Tuần ${tuan}` : "—",
      supCell:
        names.length > 0 ? (
          names.join(", ")
        ) : (
          <span className="badge bg-orange-100 text-ghn-700">Chưa có Sup</span>
        ),
    };
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <DashboardHeader
        title={`Xin chào, ${hrbpName}`}
        subtitle="Thêm nhân viên mới, xem toàn bộ đánh giá và xuất báo cáo Excel."
        roleBadge={<span className="badge bg-slate-100 text-slate-600">HRBP</span>}
        actions={
          <button onClick={handleExport} disabled={exporting} className="btn-primary text-sm">
            <IconDownload className="h-4 w-4" />
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
        }
      />

      {exportError && (
        <p className="alert-error mb-4" role="alert">
          {exportError}
        </p>
      )}

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard label="Tổng nhân viên mới" value={`${employees.length}`} icon={<IconUsers className="h-5 w-5" />} />
        <StatCard label="Thuộc nhóm KPI giữ người 14 ngày" value={`${kpiCount}`} icon={<IconUsers className="h-5 w-5" />} />
        <StatCard
          label="Cảnh báo nguy cơ nghỉ việc"
          value={`${riskEmployeeIds.size}`}
          danger={riskEmployeeIds.size > 0}
          icon={<IconAlertTriangle className="h-5 w-5" />}
        />
      </section>

      <TabBar
        label="Mục quản lý"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            value: "nv",
            label: (
              <>
                <span className="sm:hidden">Nhân viên</span>
                <span className="hidden sm:inline">Nhân viên &amp; Gắn Sup</span>
              </>
            ),
          },
          { value: "eval", label: "Đánh giá" },
          {
            value: "report",
            label: (
              <>
                Báo cáo tổng
                {riskEmployeeIds.size > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
                    <span className="sr-only">, có </span>
                    {riskEmployeeIds.size}
                    <span className="sr-only"> cảnh báo</span>
                  </span>
                )}
              </>
            ),
          },
        ]}
      />

      {tab === "nv" ? (
        <div className="space-y-6">
          <AddEmployeeForm today={today} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="section-title mb-0">
              Danh sách nhân viên ({filteredEmployees.length}
              {filteredEmployees.length !== employees.length && ` / ${employees.length}`})
            </h2>
            <SearchBox value={search} onChange={setSearch} />
          </div>

          {/* Desktop (md+): bảng gọn — cảnh báo gộp vào cột tên, KPI gộp vào cột Ca. */}
          <div className="table-shell hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="whitespace-nowrap">
                  <th className="px-3 py-3">Nhân viên</th>
                  <th className="px-3 py-3">Ca</th>
                  <th className="px-3 py-3">Nhận việc</th>
                  <th className="px-3 py-3">Sup phụ trách</th>
                  <th className="px-3 py-3">Người HD</th>
                  <th className="px-3 py-3">Công việc được gán</th>
                  <th className="px-3 py-3">Đánh giá</th>
                  <th className="px-3 py-3 text-right">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((e) => {
                  const row = rowInfo(e);
                  return (
                    <tr key={e.id} className={row.isRisk ? "bg-red-50/60" : undefined}>
                      <td className="min-w-40 px-3 py-3">
                        <p className="font-medium text-slate-800">{e.ho_ten}</p>
                        <p className="text-xs text-slate-500">{e.ma_nv}</p>
                        {row.isRisk && <span className="badge mt-1 bg-red-100 text-red-700">Nguy cơ nghỉ việc</span>}
                        {!e.sdt && <span className="badge mt-1 bg-amber-100 text-amber-800">Thiếu SĐT</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {e.ca}
                        {isKpiCa(e.ca) && <span className="badge ml-1 bg-ghn-50 text-ghn-700">KPI 14N</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDate(e.ngay_nhan_viec)}
                        <p className="text-xs text-slate-500">{row.stage}</p>
                      </td>
                      <td className="min-w-36 px-3 py-3 text-xs text-slate-600">{row.supCell}</td>
                      <td className="px-3 py-3">{e.nguoi_huong_dan ?? "—"}</td>
                      <td className="px-3 py-3">{assignedJobByEmployeeId[e.id] || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">
                        <p>Sup {row.supDone}/3</p>
                        <p>NV {row.selfDone}/3</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditEmployee(e)} className="btn-secondary text-xs">
                            Sửa
                          </button>
                          <DeleteEmployeeButton employee={e} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredEmployees.length === 0 && <EmployeesEmpty hasAny={employees.length > 0} />}
          </div>

          {/* Mobile (<md): mỗi NV là 1 thẻ, không phải cuộn ngang bảng 8 cột. */}
          <ul className="space-y-3 md:hidden">
            {filteredEmployees.map((e) => {
              const row = rowInfo(e);
              return (
                <li key={e.id} className={`card p-4 text-sm ${row.isRisk ? "border-red-200 bg-red-50/60" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{e.ho_ten}</p>
                      <p className="text-xs text-slate-500">
                        {e.ma_nv} · {e.ca}
                      </p>
                    </div>
                    <span className="badge shrink-0 bg-slate-100 text-slate-600">{row.stage}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.isRisk && <span className="badge bg-red-100 text-red-700">Nguy cơ nghỉ việc</span>}
                    {isKpiCa(e.ca) && <span className="badge bg-ghn-50 text-ghn-700">KPI 14N</span>}
                    {!e.sdt && <span className="badge bg-amber-100 text-amber-800">Thiếu SĐT</span>}
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5">
                    <dt className="text-slate-500">Nhận việc</dt>
                    <dd className="text-slate-800">{formatDate(e.ngay_nhan_viec)}</dd>
                    <dt className="text-slate-500">Sup</dt>
                    <dd className="text-slate-800">{row.supCell}</dd>
                    <dt className="text-slate-500">Người HD</dt>
                    <dd className="text-slate-800">{e.nguoi_huong_dan ?? "—"}</dd>
                    <dt className="text-slate-500">Công việc</dt>
                    <dd className="text-slate-800">{assignedJobByEmployeeId[e.id] || "—"}</dd>
                    <dt className="text-slate-500">Đánh giá</dt>
                    <dd className="text-slate-800">
                      Sup {row.supDone}/3 · NV {row.selfDone}/3
                    </dd>
                  </dl>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => setEditEmployee(e)} className="btn-secondary text-xs">
                      Sửa
                    </button>
                    <DeleteEmployeeButton employee={e} />
                  </div>
                </li>
              );
            })}
            {filteredEmployees.length === 0 && (
              <li className="card">
                <EmployeesEmpty hasAny={employees.length > 0} />
              </li>
            )}
          </ul>

          {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} />}
        </div>
      ) : tab === "eval" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="section-title">
              Đánh giá của Sup ({supEvaluations.length})
            </h2>
            <div className="space-y-2">
              {supEvaluations.map((ev) => {
                const emp = empById.get(ev.employee_id);
                const negative =
                  ev.dung_cong_viec !== "dung_100" ||
                  ev.kha_nang_tiep_thu === "kho_tiep_thu" ||
                  ev.danh_gia_sao < 3 ||
                  !!ev.van_de_phat_sinh;
                return (
                  <div key={ev.id} className={`card p-3 text-sm ${negative ? "border-red-200 bg-red-50/60" : ""}`}>
                    <p className="font-medium text-slate-800">
                      {emp?.ho_ten} ({emp?.ma_nv}) — Tuần {ev.tuan} — {formatDate(ev.ngay)}
                    </p>
                    <p className="text-slate-500">Sup: {supById.get(ev.sup_id)?.ho_ten}</p>
                    <p className="mt-1 text-slate-600">
                      {DUNG_CONG_VIEC_SUP_LABEL[ev.dung_cong_viec]} · {KHA_NANG_TIEP_THU_LABEL[ev.kha_nang_tiep_thu]}{" "}
                      · {KHOI_LUONG_CONG_VIEC_LABEL[ev.khoi_luong_cong_viec]} · {ev.danh_gia_sao}★
                    </p>
                    {ev.noi_dung && <p className="text-slate-500">{ev.noi_dung}</p>}
                    {ev.van_de_phat_sinh && (
                      <p className="text-red-600">Vấn đề: {ev.van_de_phat_sinh}</p>
                    )}
                  </div>
                );
              })}
              {supEvaluations.length === 0 && (
                <p className="card p-4 text-sm text-slate-500">Chưa có đánh giá nào từ Sup.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="section-title">
              Tự đánh giá của NV ({selfEvaluations.length})
            </h2>
            <div className="space-y-2">
              {selfEvaluations.map((ev) => {
                const emp = empById.get(ev.employee_id);
                const reasons: string[] = [];
                if (ev.muc_do_huong_dan === "khong_duoc") reasons.push("Không được ai hướng dẫn");
                if (ev.khoi_luong_cong_viec === "qua_tai") reasons.push("Quá nặng / Quá tải");
                if (ev.danh_gia_sao < 3) reasons.push(`Đánh giá quản lý/HD ${ev.danh_gia_sao}★`);
                const negative = reasons.length > 0;
                return (
                  <div key={ev.id} className={`card p-3 text-sm ${negative ? "border-red-200 bg-red-50/60" : ""}`}>
                    <p className="font-medium text-slate-800">
                      {emp?.ho_ten} ({emp?.ma_nv}) — Tuần {ev.tuan} — {formatDate(ev.ngay)}
                    </p>
                    <p className="text-slate-600">
                      {DUNG_CONG_VIEC_LABEL[ev.dung_cong_viec]} · {MUC_DO_HUONG_DAN_LABEL[ev.muc_do_huong_dan]} ·{" "}
                      {KHOI_LUONG_CONG_VIEC_LABEL[ev.khoi_luong_cong_viec]} · {ev.danh_gia_sao}★
                    </p>
                    {ev.chia_se_cai_thien && (
                      <p className="text-slate-500">Chia sẻ: {ev.chia_se_cai_thien}</p>
                    )}
                    {negative && (
                      <p className="mt-1 text-red-600">
                        <span className="badge bg-red-100 text-red-700">Nguy cơ nghỉ việc</span>{" "}
                        {reasons.join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })}
              {selfEvaluations.length === 0 && (
                <p className="card p-4 text-sm text-slate-500">Chưa có tự đánh giá nào từ NV.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="section-title">
              Cảnh báo nguy cơ nghỉ việc ({riskFlags.length} lượt / {riskEmployeeIds.size} NV)
            </h2>
            <p className="mb-2 text-xs text-slate-500">
              NV tự đánh giá tick &quot;Không được ai hướng dẫn&quot;, &quot;Quá nặng / Quá tải&quot;, hoặc cho
              điểm quản lý &amp; người hướng dẫn dưới 3 sao.
            </p>
            <div className="space-y-2">
              {riskFlags.map((f) => (
                <div key={f.evaluation.id} className="card border-red-200 bg-red-50/60 p-3 text-sm">
                  <p className="font-medium text-slate-800">
                    {f.employee.ho_ten} ({f.employee.ma_nv}) — {f.employee.ca} — Tuần {f.evaluation.tuan} —{" "}
                    {formatDate(f.evaluation.ngay)}
                  </p>
                  <p className="text-slate-500">
                    Sup phụ trách: {supNamesForCa(f.employee.ca).join(", ") || "Chưa có Sup phụ trách ca này"}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {f.reasons.map((r) => (
                      <span key={r} className="badge bg-red-100 text-red-700">
                        {r}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
              {riskFlags.length === 0 && (
                <p className="card p-4 text-sm text-slate-500">Chưa ghi nhận cảnh báo nào.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="section-title">
              Tổng hợp tự đánh giá của NV ({selfEvalSummary.total} lượt)
            </h2>
            <div className="card grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-slate-500">Điểm trung bình quản lý &amp; HD</p>
                <p className="text-2xl font-bold text-slate-900">
                  {selfEvalSummary.total ? selfEvalSummary.avgStars.toFixed(1) : "—"}★
                </p>
                <div className="mt-2 space-y-1">
                  {([5, 4, 3, 2, 1] as const).map((sao) => (
                    <SummaryBar
                      key={sao}
                      label={`${sao}★`}
                      count={selfEvalSummary.starCounts[sao]}
                      total={selfEvalSummary.total}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase text-slate-500">Mức độ hướng dẫn</p>
                  {Object.entries(selfEvalSummary.mucDoHuongDanCounts).map(([k, v]) => (
                    <SummaryBar
                      key={k}
                      label={MUC_DO_HUONG_DAN_LABEL[k as keyof typeof MUC_DO_HUONG_DAN_LABEL]}
                      count={v}
                      total={selfEvalSummary.total}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Khối lượng công việc</p>
                  {Object.entries(selfEvalSummary.khoiLuongCongViecCounts).map(([k, v]) => (
                    <SummaryBar
                      key={k}
                      label={KHOI_LUONG_CONG_VIEC_LABEL[k as keyof typeof KHOI_LUONG_CONG_VIEC_LABEL]}
                      count={v}
                      total={selfEvalSummary.total}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Đúng công việc / line</p>
                  {Object.entries(selfEvalSummary.dungCongViecCounts).map(([k, v]) => (
                    <SummaryBar
                      key={k}
                      label={DUNG_CONG_VIEC_LABEL[k as keyof typeof DUNG_CONG_VIEC_LABEL]}
                      count={v}
                      total={selfEvalSummary.total}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function EmployeesEmpty({ hasAny }: { hasAny: boolean }) {
  return hasAny ? (
    <EmptyState title="Không có nhân viên nào khớp từ khoá tìm kiếm" />
  ) : (
    <EmptyState title="Chưa có nhân viên nào" description="Thêm mới ở form phía trên." />
  );
}

function SummaryBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="w-32 shrink-0 text-slate-600">{label}</span>
      <div className="mt-1.5 h-2 flex-1 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-ghn-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="mt-0.5 w-14 shrink-0 text-right text-slate-500">
        {count} ({pct}%)
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  danger,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`card card-interactive flex items-start justify-between gap-3 p-4 ${
        highlight ? "border-ghn-200 bg-ghn-50" : ""
      } ${danger ? "border-red-200 bg-red-50" : ""}`}
    >
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p
          className={`mt-1 text-2xl font-bold ${
            danger ? "text-red-700" : highlight ? "text-ghn-700" : "text-slate-900"
          }`}
        >
          {value}
        </p>
      </div>
      {icon && (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            danger ? "bg-red-100 text-red-600" : highlight ? "bg-ghn-100 text-ghn-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </span>
      )}
    </div>
  );
}
