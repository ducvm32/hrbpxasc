"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import DashboardHeader from "@/components/DashboardHeader";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import SearchBox, { matchesSearch } from "@/components/ui/SearchBox";
import TabBar from "@/components/ui/TabBar";
import { useCloseOnSuccess } from "@/components/ui/useCloseOnSuccess";
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
import { formatDate } from "@/lib/format";
import type { Employee, HrbpUser, SupUser } from "@/lib/types";

type AccountRole = "sup" | "hrbp";
type Account = { id: string; ho_ten: string; email: string; role: AccountRole; ca_phu_trach?: string[] };

const initialState: ActionResult = {};

function CaCheckboxes({ legend, defaultValues = [] as string[] }: { legend: string; defaultValues?: string[] }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="grid grid-cols-1 gap-1 rounded-lg border border-slate-200 p-2 min-[400px]:grid-cols-2 sm:grid-cols-3">
        {CA_LIST.map((ca) => (
          <label
            key={ca}
            className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name="ca_phu_trach"
              value={ca}
              defaultChecked={defaultValues.includes(ca)}
              className="h-4 w-4 shrink-0 rounded border-slate-300 accent-ghn-600"
            />
            {ca}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="alert-error" role="alert">
      {message}
    </p>
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
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setRole("sup");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="card space-y-4 p-4">
      <h2 className="font-semibold text-slate-800">Thêm tài khoản Sup / HRBP mới</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor={`${uid}-role`}>
            Vai trò
          </label>
          <select
            id={`${uid}-role`}
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
          <label className="label" htmlFor={`${uid}-ho_ten`}>
            Họ tên
          </label>
          <input id={`${uid}-ho_ten`} name="ho_ten" required className="input" placeholder="Nguyễn Văn A" />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-id`}>
            Mã NV
          </label>
          <input id={`${uid}-id`} name="id" required className="input" placeholder="3099999" />
        </div>
        <div>
          <label className="label" htmlFor={`${uid}-email`}>
            Email Google (@ghn.vn)
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            className="input"
            placeholder="ten@ghn.vn"
          />
        </div>
      </div>

      {role === "sup" && <CaCheckboxes legend="Ca phụ trách" />}

      <ErrorAlert message={state?.error} />
      {state?.success && <p className="alert-success">Đã tạo tài khoản mới.</p>}

      <SubmitBtn label="Tạo tài khoản" pendingLabel="Đang tạo..." />
    </form>
  );
}

async function callChangeRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return (await changeRoleAction(formData)) ?? {};
}

function ChangeRoleModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const [state, formAction] = useFormState(callChangeRole, initialState);
  useCloseOnSuccess(state, onClose);
  const toRole: AccountRole = account.role === "sup" ? "hrbp" : "sup";

  return (
    <Modal
      title="Đổi vai trò"
      subtitle={`${account.ho_ten} — hiện là ${account.role === "sup" ? "Sup" : "HRBP"}, chuyển thành ${
        toRole === "sup" ? "Sup" : "HRBP"
      }`}
      onClose={onClose}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="account_id" value={account.id} />
        <input type="hidden" name="from_role" value={account.role} />
        <input type="hidden" name="to_role" value={toRole} />
        {toRole === "sup" && <CaCheckboxes legend="Chọn Ca phụ trách (bắt buộc)" />}
        <ErrorAlert message={state?.error} />
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
  const [state, formAction] = useFormState(callUpdateCa, initialState);
  useCloseOnSuccess(state, onClose);

  return (
    <Modal title="Sửa Ca phụ trách" subtitle={account.ho_ten} onClose={onClose} maxWidthClassName="max-w-md">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="account_id" value={account.id} />
        <CaCheckboxes legend="Ca phụ trách" defaultValues={account.ca_phu_trach} />
        <ErrorAlert message={state?.error} />
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
    <div>
      <button onClick={handleDelete} disabled={isPending} className="btn-danger w-full">
        {isPending ? "Đang xoá..." : "Xoá"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
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
        <ErrorAlert message={state?.error} />
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
  const [search, setSearch] = useState("");

  const filteredAccounts = accounts.filter((a) => matchesSearch(search, a.ho_ten, a.id, a.email));
  const filteredEmployees = employees.filter((e) => matchesSearch(search, e.ho_ten, e.ma_nv, e.ca));
  const supNamesForCa = (ca: string) =>
    supUsers.filter((s) => s.ca_phu_trach.includes(ca)).map((s) => s.ho_ten);

  function accountActions(a: Account) {
    return (
      <>
        <button onClick={() => setRoleTarget(a)} className="btn-secondary text-xs">
          Đổi vai trò
        </button>
        {a.role === "sup" && (
          <button onClick={() => setCaTarget(a)} className="btn-secondary text-xs">
            Sửa Ca
          </button>
        )}
        <DeleteButton account={a} />
      </>
    );
  }

  function roleBadge(a: Account) {
    return (
      <span className={`badge ${a.role === "sup" ? "bg-ghn-50 text-ghn-700" : "bg-slate-100 text-slate-600"}`}>
        {a.role === "sup" ? "Sup" : "HRBP"}
      </span>
    );
  }

  function supCell(ca: string) {
    const names = supNamesForCa(ca);
    return names.length > 0 ? (
      names.join(", ")
    ) : (
      <span className="badge bg-orange-100 text-ghn-700">Chưa có Sup</span>
    );
  }

  const emptySearch = <EmptyState title="Không có kết quả khớp từ khoá tìm kiếm" />;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <DashboardHeader
        title={`Xin chào, ${adminName}`}
        subtitle="Quản trị hệ thống — phân quyền và dữ liệu nhân viên."
        roleBadge={<span className="badge bg-slate-900 text-white">System Admin</span>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <TabBar
          label="Mục quản trị"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "accounts", label: `Tài khoản Sup / HRBP (${accounts.length})` },
            { value: "employees", label: `Nhân viên (${employees.length})` },
          ]}
        />
        <div className="mb-4">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={tab === "accounts" ? "Tìm theo tên, mã, email..." : "Tìm theo họ tên hoặc mã NV..."}
          />
        </div>
      </div>

      {tab === "accounts" ? (
        <div className="space-y-6">
          <AddAccountForm />

          <div className="table-shell hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mã NV</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Ca phụ trách</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((a) => (
                  <tr key={`${a.role}-${a.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{a.ho_ten}</td>
                    <td className="px-4 py-3">{a.email}</td>
                    <td className="px-4 py-3 text-slate-500">{a.id}</td>
                    <td className="px-4 py-3">{roleBadge(a)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {a.role === "sup" ? a.ca_phu_trach?.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">{accountActions(a)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAccounts.length === 0 &&
              (accounts.length === 0 ? <EmptyState title="Chưa có tài khoản Sup/HRBP nào" /> : emptySearch)}
          </div>

          <ul className="space-y-3 md:hidden">
            {filteredAccounts.map((a) => (
              <li key={`${a.role}-${a.id}`} className="card p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{a.ho_ten}</p>
                    <p className="break-all text-xs text-slate-500">
                      {a.id} · {a.email}
                    </p>
                  </div>
                  {roleBadge(a)}
                </div>
                {a.role === "sup" && (
                  <p className="mt-2 text-xs text-slate-600">Ca: {a.ca_phu_trach?.join(", ") || "—"}</p>
                )}
                <div className={`mt-3 grid gap-2 ${a.role === "sup" ? "grid-cols-3" : "grid-cols-2"}`}>
                  {accountActions(a)}
                </div>
              </li>
            ))}
            {filteredAccounts.length === 0 && (
              <li className="card">
                {accounts.length === 0 ? <EmptyState title="Chưa có tài khoản Sup/HRBP nào" /> : emptySearch}
              </li>
            )}
          </ul>
        </div>
      ) : (
        <>
          <div className="table-shell hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="whitespace-nowrap">
                  <th className="px-4 py-3">Nhân viên</th>
                  <th className="px-4 py-3">Ca</th>
                  <th className="px-4 py-3">Nhận việc</th>
                  <th className="px-4 py-3">Sup phụ trách</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{e.ho_ten}</p>
                      <p className="text-xs text-slate-500">{e.ma_nv}</p>
                      {!e.sdt && <span className="badge mt-1 bg-amber-100 text-amber-800">Thiếu SĐT</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {e.ca}
                      {e.la_kpi_14ngay && <span className="badge ml-1 bg-ghn-50 text-ghn-700">KPI 14N</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(e.ngay_nhan_viec)}</td>
                    <td className="px-4 py-3">{supCell(e.ca)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditEmployee(e)} className="btn-secondary text-xs">
                          Sửa
                        </button>
                        <DeleteEmployeeButton employee={e} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEmployees.length === 0 &&
              (employees.length === 0 ? <EmptyState title="Chưa có nhân viên nào trong hệ thống" /> : emptySearch)}
          </div>

          <ul className="space-y-3 md:hidden">
            {filteredEmployees.map((e) => (
              <li key={e.id} className="card p-4 text-sm">
                <p className="font-medium text-slate-800">{e.ho_ten}</p>
                <p className="text-xs text-slate-500">
                  {e.ma_nv} · {e.ca}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {e.la_kpi_14ngay && <span className="badge bg-ghn-50 text-ghn-700">KPI 14N</span>}
                  {!e.sdt && <span className="badge bg-amber-100 text-amber-800">Thiếu SĐT</span>}
                </div>
                <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5">
                  <dt className="text-slate-500">Nhận việc</dt>
                  <dd className="text-slate-800">{formatDate(e.ngay_nhan_viec)}</dd>
                  <dt className="text-slate-500">Sup</dt>
                  <dd className="text-slate-800">{supCell(e.ca)}</dd>
                </dl>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => setEditEmployee(e)} className="btn-secondary text-xs">
                    Sửa
                  </button>
                  <DeleteEmployeeButton employee={e} />
                </div>
              </li>
            ))}
            {filteredEmployees.length === 0 && (
              <li className="card">
                {employees.length === 0 ? <EmptyState title="Chưa có nhân viên nào trong hệ thống" /> : emptySearch}
              </li>
            )}
          </ul>
        </>
      )}

      {roleTarget && <ChangeRoleModal account={roleTarget} onClose={() => setRoleTarget(null)} />}
      {caTarget && <EditCaModal account={caTarget} onClose={() => setCaTarget(null)} />}
      {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} />}
    </main>
  );
}
