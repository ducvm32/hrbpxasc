"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import AddEmployeeForm from "@/components/hrbp/AddEmployeeForm";
import { assignEmployeeToSupAction, exportExcelBase64Action } from "@/lib/actions";
import {
  DUNG_CONG_VIEC_LABEL,
  isKpiCa,
  KHOI_LUONG_CONG_VIEC_LABEL,
  MUC_DO_HUONG_DAN_LABEL,
} from "@/lib/constants";
import type { AreaReportRow, RiskFlag, SelfEvalSummary } from "@/lib/queries";
import type { Employee, SelfEvaluation, SupEvaluation, SupUser, Tuan } from "@/lib/types";

export default function HrbpDashboardClient({
  hrbpName,
  employees,
  supUsers,
  supEvaluations,
  selfEvaluations,
  areaReport,
  selfEvalSummary,
  riskFlags,
  currentWeekByEmployeeId,
  today,
}: {
  hrbpName: string;
  employees: Employee[];
  supUsers: SupUser[];
  supEvaluations: SupEvaluation[];
  selfEvaluations: SelfEvaluation[];
  areaReport: AreaReportRow[];
  selfEvalSummary: SelfEvalSummary;
  riskFlags: RiskFlag[];
  currentWeekByEmployeeId: Record<string, Tuan | 0>;
  today: string;
}) {
  const [tab, setTab] = useState<"nv" | "eval" | "report">("nv");
  const [exporting, setExporting] = useState(false);
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
    } finally {
      setExporting(false);
    }
  }

  const kpiCount = employees.filter((e) => e.la_kpi_14ngay).length;
  const poolCount = employees.filter((e) => !e.sup_id).length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/ghn-logo.png" alt="Giao Hàng Nhanh" className="h-8 w-auto" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Xin chào, {hrbpName}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Thêm nhân viên mới, hỗ trợ gắn Sup, xem toàn bộ đánh giá và xuất báo cáo Excel.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-slate-100 text-slate-600">HRBP (Admin)</span>
          <button onClick={handleExport} disabled={exporting} className="btn-primary text-sm">
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng nhân viên mới" value={`${employees.length}`} />
        <StatCard label="Đang chờ nhận (POOL)" value={`${poolCount}`} highlight />
        <StatCard label="Thuộc nhóm KPI giữ người 14 ngày" value={`${kpiCount}`} />
        <StatCard
          label="Cảnh báo nguy cơ nghỉ việc"
          value={`${riskEmployeeIds.size}`}
          danger={riskEmployeeIds.size > 0}
        />
      </section>

      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button
          onClick={() => setTab("nv")}
          className={`rounded-md px-4 py-2 ${tab === "nv" ? "bg-white text-ghn shadow" : "text-slate-500"}`}
        >
          Nhân viên &amp; Gắn Sup
        </button>
        <button
          onClick={() => setTab("eval")}
          className={`rounded-md px-4 py-2 ${tab === "eval" ? "bg-white text-ghn shadow" : "text-slate-500"}`}
        >
          Đánh giá
        </button>
        <button
          onClick={() => setTab("report")}
          className={`relative rounded-md px-4 py-2 ${tab === "report" ? "bg-white text-ghn shadow" : "text-slate-500"}`}
        >
          Báo cáo tổng
          {riskEmployeeIds.size > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
              {riskEmployeeIds.size}
            </span>
          )}
        </button>
      </div>

      {tab === "nv" ? (
        <div className="space-y-6">
          <AddEmployeeForm today={today} />

          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Ca</th>
                  <th className="px-4 py-3">Ngày nhận việc</th>
                  <th className="px-4 py-3">Tuần hiện tại</th>
                  <th className="px-4 py-3">Sup phụ trách</th>
                  <th className="px-4 py-3">Người HD</th>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">KPI 14N</th>
                  <th className="px-4 py-3">Đánh giá (Sup / NV)</th>
                  <th className="px-4 py-3">Cảnh báo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => {
                  const tuanHienTai = currentWeekByEmployeeId[e.id] ?? 0;
                  const supDone = supWeeksByEmployee.get(e.id)?.size ?? 0;
                  const selfDone = selfWeeksByEmployee.get(e.id)?.size ?? 0;
                  const isRisk = riskEmployeeIds.has(e.id);
                  return (
                    <tr key={e.id} className={isRisk ? "bg-red-50/60" : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{e.ho_ten}</p>
                        <p className="text-xs text-slate-500">{e.ma_nv}</p>
                      </td>
                      <td className="px-4 py-3">{e.ca}</td>
                      <td className="px-4 py-3">{e.ngay_nhan_viec}</td>
                      <td className="px-4 py-3">{tuanHienTai ? `Tuần ${tuanHienTai}` : "—"}</td>
                      <td className="px-4 py-3">
                        {e.sup_id ? (
                          supById.get(e.sup_id)?.ho_ten
                        ) : (
                          <span className="badge bg-orange-100 text-ghn-700">POOL</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{e.nguoi_huong_dan ?? "—"}</td>
                      <td className="px-4 py-3">{e.khu_vuc_line ?? "—"}</td>
                      <td className="px-4 py-3">
                        {isKpiCa(e.ca) && <span className="badge bg-ghn-50 text-ghn-700">Có</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        Sup {supDone}/3 · NV {selfDone}/3
                      </td>
                      <td className="px-4 py-3">
                        {isRisk && <span className="badge bg-red-100 text-red-700">Nguy cơ nghỉ việc</span>}
                      </td>
                      <td className="px-4 py-3">
                        {!e.sup_id && <AssignToSupCell employeeId={e.id} supUsers={supUsers} caFilter={e.ca} />}
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-slate-400">
                      Chưa có nhân viên nào. Thêm mới ở form phía trên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "eval" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-600">
              Đánh giá của Sup ({supEvaluations.length})
            </h2>
            <div className="space-y-2">
              {supEvaluations.map((ev) => {
                const emp = empById.get(ev.employee_id);
                const negative = !ev.lam_dung_cong_viec || !!ev.van_de_phat_sinh;
                return (
                  <div key={ev.id} className={`card p-3 text-sm ${negative ? "border-red-200 bg-red-50/60" : ""}`}>
                    <p className="font-medium text-slate-800">
                      {emp?.ho_ten} ({emp?.ma_nv}) — Tuần {ev.tuan} — {ev.ngay}
                    </p>
                    <p className="text-slate-500">Sup: {supById.get(ev.sup_id)?.ho_ten}</p>
                    <p className={`mt-1 ${ev.lam_dung_cong_viec ? "text-slate-600" : "text-red-600 font-medium"}`}>
                      Đúng việc: {ev.lam_dung_cong_viec ? "Có" : "Không"}
                      {ev.noi_dung ? ` — ${ev.noi_dung}` : ""}
                    </p>
                    {ev.van_de_phat_sinh && (
                      <p className="text-red-600">Vấn đề: {ev.van_de_phat_sinh}</p>
                    )}
                  </div>
                );
              })}
              {supEvaluations.length === 0 && (
                <p className="card p-4 text-sm text-slate-400">Chưa có đánh giá nào từ Sup.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-600">
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
                      {emp?.ho_ten} ({emp?.ma_nv}) — Tuần {ev.tuan} — {ev.ngay}
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
                <p className="card p-4 text-sm text-slate-400">Chưa có tự đánh giá nào từ NV.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-600">
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
                    {f.evaluation.ngay}
                  </p>
                  <p className="text-slate-500">
                    Sup phụ trách: {f.employee.sup_id ? supById.get(f.employee.sup_id)?.ho_ten ?? "—" : "Chưa nhận (POOL)"}
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
                <p className="card p-4 text-sm text-slate-400">Chưa ghi nhận cảnh báo nào.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-600">
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

          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-600">
              Phân bổ khu vực theo Ca &amp; Tuần nhận việc
            </h2>
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Ca</th>
                    <th className="px-4 py-3">Tuần</th>
                    <th className="px-4 py-3">Tổng NV</th>
                    <th className="px-4 py-3">Khu vực chính</th>
                    <th className="px-4 py-3">Chi tiết khu vực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {areaReport.map((row) => (
                    <tr key={`${row.ca}-${row.tuan}`}>
                      <td className="px-4 py-3">{row.ca}</td>
                      <td className="px-4 py-3">Tuần {row.tuan}</td>
                      <td className="px-4 py-3">{row.total}</td>
                      <td className="px-4 py-3">
                        {row.topArea ? (
                          <span className="badge bg-ghn-50 text-ghn-700">
                            {row.topArea} ({row.topCount})
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {row.areas.map((a) => `${a.khu_vuc}: ${a.count}`).join(" · ")}
                      </td>
                    </tr>
                  ))}
                  {areaReport.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        Chưa có NV nào đang trong 3 tuần nhận việc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 shrink-0 text-slate-600">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-ghn-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right text-slate-500">
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
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className={`card p-4 ${highlight ? "border-ghn-200 bg-ghn-50" : ""} ${danger ? "border-red-200 bg-red-50" : ""}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          danger ? "text-red-700" : highlight ? "text-ghn-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AssignToSupCell({
  employeeId,
  supUsers,
  caFilter,
}: {
  employeeId: string;
  supUsers: SupUser[];
  caFilter: string;
}) {
  const router = useRouter();
  const [supId, setSupId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const candidates = supUsers.filter((s) => s.ca_phu_trach.includes(caFilter));

  function assign() {
    if (!supId) return;
    setMsg(null);
    startTransition(async () => {
      const res = await assignEmployeeToSupAction(employeeId, supId);
      if (res?.error) setMsg(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={supId}
        onChange={(e) => setSupId(e.target.value)}
        className="input w-40 text-xs"
      >
        <option value="">-- Chọn Sup --</option>
        {candidates.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ho_ten}
          </option>
        ))}
      </select>
      <button onClick={assign} disabled={isPending || !supId} className="btn-secondary text-xs">
        Gắn
      </button>
      {msg && <span className="text-xs text-red-600">{msg}</span>}
    </div>
  );
}
