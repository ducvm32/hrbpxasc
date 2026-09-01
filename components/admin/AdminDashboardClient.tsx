"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import DashboardHeader from "@/components/DashboardHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import {
  createAccountAction,
  changeRoleAction,
  updateSupCaAction,
  deleteAccountAction,
  updateEmployeeAction,
  deleteEmployeeAction,
  type ActionResult,
} from "@/lib/actions";
import { CA_LIST } from "@/lib/constants";
import type { Employee, HrbpUser, SupUser } from "@/lib/types";

type AccountRole = "sup" | "hrbp";
type Account = { id: string; ho_ten: string; email: string; role: AccountRole; ca_phu_trach?: string[] };

const initialState: ActionResult = {};

function CaCheckboxes({ defaultValues = [] as string[] }: { defaultValues?: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 p-3 sm:grid-cols-3">
      {CA_LIST.map((ca) => (
        <label key={ca} className="flex items-center gap-1.5 text-xs text-slate-700">
          <input
            type="checkbox"
            name="ca_phu_trach"
            value={ca}
            defaultChecked={defaultValues.includes(ca)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          {ca}
        </label>
      ))}
    </div>
  );
}

function SubmitBtn({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

async function callCreate(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await createAccountAction(formData)) ?? {};
}

function AddAccountForm() {
  const router = useRouter();
  const [role, setRole] = useState<AccountRole>("sup");
  const [state, formAction] = useFormState(callCreate, initialState);

  return (
    <form
      action={formAction}
      onSubmit={() => setTimeout(() => router.refresh(), 300)}
      className="card space-y-4 p-4"
    >
      <h2 className="font-semibold text-slate-800">Thêm tài khoản Sup / HRBP mới</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Vai trò</label>
          <select
            name="role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as AccountRole)}
          >
            <option value="sup">Sup (Quản lý)</option>
            <option value="hrbp">HRBP</option>
          </select>
        </div>
        <div>
          <label className="label">Họ tên</label>
          <input name="ho_ten" required className="input" placeholder="Nguyễn Văn A" />
        </div>
        <div>
          <label className="label">Mã NV / ID đăng nhập</label>
          <input name="id" required className="input" placeholder="3099999" />
        </div>
        <div>
          <label className="label">Email (@ghn.vn)</label>
          <input name="email" type="email" required className="input" placeholder="ten@ghn.vn" />
        </div>
      </div>

      {role === "sup" && (
        <div>
          <label className="label">Ca phụ trách</label>
          <CaCheckboxes />
        </div>
      )}

      {state?.error && <p className="alert-error">{state.error}</p>}
      {state?.success && <p className="alert-success">Đã tạo tài khoản mới.</p>}

      <SubmitBtn label="Tạo tài khoản" pendingLabel="Đang tạo..." />
    </form>
  );
}

async function callChangeRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await changeRoleAction(formData)) ?? {};
}

function ChangeRoleModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction] = useFormState(callChangeRole, initialState);
  const toRole: AccountRole = account.role === "sup" ? "hrbp" : "sup";

  return (
    <Modal
      title="Đổi vai trò"
      subtitle={`${account.ho_ten} — hiện là ${account.role === "sup" ? "Sup" : "HRBP"}, chuyển thành ${
        toRole === "sup" ? "Sup" : "HRBP"
      }`}
      onClose={onClose}
    >
      <form
        action={formAction}
        onSubmit={() => setTimeout(() => { router.refresh(); onClose(); }, 300)}
        className="space-y-4"
      >
        <input type="hidden" name="account_id" value={account.id} />
        <input type="hidden" name="from_role" value={account.role} />
        <input type="hidden" name="to_role" value={toRole} />
        {toRole === "sup" && (
          <div>
            <label className="label">Chọn Ca phụ trách (bắt buộc)</label>
            <CaCheckboxes />
          </div>
        )}
        {state?.error && <p className="alert-error">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Đóng
          </button>
          <SubmitBtn label="Xác nhận đổi vai trò" pendingLabel="Đang đổi..." />
        </div>
      </form>
    </Modal>
  );
}

async function callUpdateCa(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await updateSupCaAction(formData)) ?? {};
}

function EditCaModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction] = useFormState(callUpdateCa, initialState);

  return (
    <Modal title="Sửa Ca phụ trách" subtitle={account.ho_ten} onClose={onClose} maxWidthClassName="max-w-md">
      <form
        action={formAction}
        onSubmit={() => setTimeout(() => { router.refresh(); onClose(); }, 300)}
        className="space-y-4"
      >
        <input type="hidden" name="account_id" value={account.id} />
        <CaCheckboxes defaultValues={account.ca_phu_trach} />
        {state?.error && <p className="alert-error">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Đóng
          </button>
          <SubmitBtn label="Lưu Ca phụ trách" pendingLabel="Đang lưu..." />
        </div>
      </form>
    </Modal>
  );
}

function DeleteButton({ account }: { account: Account }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Xoá tài khoản "${account.ho_ten}"? Hành động này không thể hoàn tác.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteAccountAction(account.id, account.role);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="text-right">
      <button onClick={handleDelete} disabled={isPending} className="btn-danger">
        Xoá
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

async function callUpdateEmployee(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await updateEmployeeAction(formData)) ?? {};
}

function EditEmployeeModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction] = useFormState(callUpdateEmployee, initialState);

  return (
    <Modal
      title="Sửa nhân viên"
      subtitle={`Mã NV hiện tại: ${employee.ma_nv}`}
      onClose={onClose}
      maxWidthClassName="max-w-md"
    >
      <form
        action={formAction}
        onSubmit={() => setTimeout(() => { router.refresh(); onClose(); }, 300)}
        className="space-y-4"
      >
        <input type="hidden" name="employee_id" value={employee.id} />
        <div>
          <label className="label">Họ tên</label>
          <input name="ho_ten" defaultValue={employee.ho_ten} required className="input" />
        </div>
        <div>
          <label className="label">Mã NV</label>
          <input name="ma_nv" defaultValue={employee.ma_nv} required className="input" />
        </div>
        <div>
          <label className="label">Ca làm việc</label>
          <select name="ca" defaultValue={employee.ca} className="input">
            {CA_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ngày nhận việc</label>
          <input type="date" name="ngay_nhan_viec" defaultValue={employee.ngay_nhan_viec} className="input" />
        </div>
        {state?.error && <p className="alert-error">{state.error}</p>}
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
    <div className="text-right">
      <button onClick={handleDelete} disabled={isPending} className="btn-danger">
        Xoá
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminDashboardClient({
  adminName,
  supUsers,
  hrbpUsers,
  employees,
}: {
  adminName: string;
  supUsers: SupUser[];
  hrbpUsers: HrbpUser[];
  employees: Employee[];
}) {
  const accounts: Account[] = [
    ...supUsers.map((s) => ({ id: s.id, ho_ten: s.ho_ten, email: s.email, role: "sup" as const, ca_phu_trach: s.ca_phu_trach })),
    ...hrbpUsers.map((h) => ({ id: h.id, ho_ten: h.ho_ten, email: h.email, role: "hrbp" as const })),
  ].sort((a, b) => a.ho_ten.localeCompare(b.ho_ten, "vi"));

  const [tab, setTab] = useState<"accounts" | "employees">("accounts");
  const [roleTarget, setRoleTarget] = useState<Account | null>(null);
  const [caTarget, setCaTarget] = useState<Account | null>(null);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <DashboardHeader
        title={`Xin chào, ${adminName}`}
        subtitle="Quản trị hệ thống — phân quyền và dữ liệu nhân viên."
        roleBadge={<span className="badge bg-slate-900 text-white">System Admin</span>}
      />

      <div className="mb-4 inline-flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button
          onClick={() => setTab("accounts")}
          className={`tab-pill ${tab === "accounts" ? "tab-pill-active" : ""}`}
        >
          Tài khoản Sup / HRBP
        </button>
        <button
          onClick={() => setTab("employees")}
          className={`tab-pill ${tab === "employees" ? "tab-pill-active" : ""}`}
        >
          Nhân viên ({employees.length})
        </button>
      </div>

      {tab === "accounts" ? (
        <div className="space-y-6">
          <AddAccountForm />

          <div className="table-shell overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mã / ID</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Ca phụ trách</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((a) => (
                  <tr key={`${a.role}-${a.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.ho_ten}</td>
                    <td className="px-4 py-3">{a.email}</td>
                    <td className="px-4 py-3 text-slate-500">{a.id}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${a.role === "sup" ? "bg-ghn-50 text-ghn-700" : "bg-slate-100 text-slate-600"}`}>
                        {a.role === "sup" ? "Sup" : "HRBP"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {a.role === "sup" ? a.ca_phu_trach?.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button onClick={() => setRoleTarget(a)} className="btn-secondary text-xs">
                          Đổi vai trò
                        </button>
                        {a.role === "sup" && (
                          <button onClick={() => setCaTarget(a)} className="btn-secondary text-xs">
                            Sửa Ca
                          </button>
                        )}
                        <DeleteButton account={a} />
                      </div>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="Chưa có tài khoản Sup/HRBP nào" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Ca</th>
                <th className="px-4 py-3">Ngày nhận việc</th>
                <th className="px-4 py-3">Sup phụ trách</th>
                <th className="px-4 py-3">KPI 14N</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{e.ho_ten}</p>
                    <p className="text-xs text-slate-500">{e.ma_nv}</p>
                  </td>
                  <td className="px-4 py-3">{e.ca}</td>
                  <td className="px-4 py-3">{e.ngay_nhan_viec}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const names = supUsers.filter((s) => s.ca_phu_trach.includes(e.ca)).map((s) => s.ho_ten);
                      return names.length > 0 ? (
                        names.join(", ")
                      ) : (
                        <span className="badge bg-orange-100 text-ghn-700">Chưa có Sup</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {e.la_kpi_14ngay && <span className="badge bg-ghn-50 text-ghn-700">Có</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button onClick={() => setEditEmployee(e)} className="btn-secondary text-xs">
                        Sửa
                      </button>
                      <DeleteEmployeeButton employee={e} />
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="Chưa có nhân viên nào trong hệ thống" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {roleTarget && <ChangeRoleModal account={roleTarget} onClose={() => setRoleTarget(null)} />}
      {caTarget && <EditCaModal account={caTarget} onClose={() => setCaTarget(null)} />}
      {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} />}
    </main>
  );
}
