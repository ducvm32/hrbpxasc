import { readDB } from "./db";
import { allowedWeek, daysSinceStart, weekByDate } from "./week";
import type {
  DungCongViec,
  Employee,
  KhoiLuongCongViec,
  MucDoHuongDan,
  SelfEvaluation,
  SupUser,
  Tuan,
} from "./types";

export function getSupById(id: string) {
  return readDB().sup_users.find((s) => s.id === id) ?? null;
}

/** Team của 1 Sup = toàn bộ NV thuộc các Ca mà Sup đó phụ trách — mọi Sup cùng
 * phụ trách 1 Ca đều quản lý chung NV của ca đó (không còn cơ chế 1 Sup nhận
 * riêng 1 NV). */
export function getTeamForSup(supId: string): Employee[] {
  const db = readDB();
  const sup = db.sup_users.find((s) => s.id === supId);
  if (!sup) return [];
  return db.employees.filter((e) => sup.ca_phu_trach.includes(e.ca));
}

/** Danh sách các Sup cùng phụ trách 1 Ca — dùng để hiển thị "Sup phụ trách"
 * cho HRBP/Admin/NV thay vì 1 Sup duy nhất. */
export function getSupsForCa(ca: string): SupUser[] {
  return readDB().sup_users.filter((s) => s.ca_phu_trach.includes(ca));
}

export function getAssignmentsForEmployee(employeeId: string) {
  return readDB().assignments.filter((a) => a.employee_id === employeeId);
}

export function getSupEvalWeeksSubmitted(employeeId: string): Tuan[] {
  return readDB()
    .sup_evaluations.filter((e) => e.employee_id === employeeId)
    .map((e) => e.tuan);
}

export function getSelfEvalWeeksSubmitted(employeeId: string): Tuan[] {
  return readDB()
    .self_evaluations.filter((e) => e.employee_id === employeeId)
    .map((e) => e.tuan);
}

export function getSupEvaluations(employeeId: string) {
  return readDB()
    .sup_evaluations.filter((e) => e.employee_id === employeeId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getSelfEvaluations(employeeId: string) {
  return readDB()
    .self_evaluations.filter((e) => e.employee_id === employeeId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function employeeProgress(employee: Employee) {
  const days = daysSinceStart(employee.ngay_nhan_viec);
  const dueWeek = weekByDate(days);
  const supWeeks = getSupEvalWeeksSubmitted(employee.id);
  const selfWeeks = getSelfEvalWeeksSubmitted(employee.id);
  return {
    days,
    dueWeek,
    supAllowedWeek: allowedWeek(employee.ngay_nhan_viec, supWeeks),
    selfAllowedWeek: allowedWeek(employee.ngay_nhan_viec, selfWeeks),
    supWeeksDone: supWeeks,
    selfWeeksDone: selfWeeks,
  };
}

export function getAllEmployees(): Employee[] {
  return readDB().employees;
}

export function getEmployeeById(id: string): Employee | null {
  return readDB().employees.find((e) => e.id === id) ?? null;
}

export function getAllSupUsers() {
  return readDB().sup_users;
}

export function getAllSupEvaluations() {
  return readDB().sup_evaluations.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getAllSelfEvaluations() {
  return readDB().self_evaluations.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getAllHrbpUsers() {
  return readDB().hrbp_users;
}

export function getAllAdminUsers() {
  return readDB().admin_users;
}

// ---------- Báo cáo tổng cho HRBP ----------

/** Tuần hiện tại của NV tính theo lịch (0 = chưa tới ngày nhận việc). */
export function currentWeekOf(employee: Employee): Tuan | 0 {
  return weekByDate(daysSinceStart(employee.ngay_nhan_viec));
}

export interface SelfEvalSummary {
  total: number;
  avgStars: number;
  starCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  dungCongViecCounts: Record<DungCongViec, number>;
  mucDoHuongDanCounts: Record<MucDoHuongDan, number>;
  khoiLuongCongViecCounts: Record<KhoiLuongCongViec, number>;
}

/** Tổng hợp toàn bộ tự đánh giá của NV đang ở mức độ nào. */
export function getSelfEvalSummary(): SelfEvalSummary {
  const evals = readDB().self_evaluations;
  const total = evals.length;
  const starCounts: SelfEvalSummary["starCounts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const dungCongViecCounts: SelfEvalSummary["dungCongViecCounts"] = {
    dung_100: 0,
    doi_viec_khac: 0,
    khong_ro: 0,
  };
  const mucDoHuongDanCounts: SelfEvalSummary["mucDoHuongDanCounts"] = {
    tan_tinh: 0,
    it: 0,
    khong_duoc: 0,
  };
  const khoiLuongCongViecCounts: SelfEvalSummary["khoiLuongCongViecCounts"] = {
    qua_tai: 0,
    vua_suc: 0,
    nhe_nhang: 0,
  };

  let starSum = 0;
  for (const e of evals) {
    starSum += e.danh_gia_sao;
    if (e.danh_gia_sao >= 1 && e.danh_gia_sao <= 5) {
      starCounts[e.danh_gia_sao as 1 | 2 | 3 | 4 | 5] += 1;
    }
    dungCongViecCounts[e.dung_cong_viec] += 1;
    mucDoHuongDanCounts[e.muc_do_huong_dan] += 1;
    khoiLuongCongViecCounts[e.khoi_luong_cong_viec] += 1;
  }

  return {
    total,
    avgStars: total ? starSum / total : 0,
    starCounts,
    dungCongViecCounts,
    mucDoHuongDanCounts,
    khoiLuongCongViecCounts,
  };
}

/** Công việc Sup đã gán cho NV ở tuần hiện tại (rơi về công việc gán gần nhất
 * nếu tuần hiện tại chưa có phân công) — để HRBP theo dõi NV đang làm gì. */
export function getAssignedJobByEmployeeId(): Record<string, string> {
  const db = readDB();
  const result: Record<string, string> = {};
  for (const e of db.employees) {
    const tuan = currentWeekOf(e);
    const forCurrent = db.assignments.find((a) => a.employee_id === e.id && a.tuan === tuan);
    const latest = db.assignments
      .filter((a) => a.employee_id === e.id)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    result[e.id] = (forCurrent ?? latest)?.cong_viec ?? "";
  }
  return result;
}

export interface RiskFlag {
  employee: Employee;
  evaluation: SelfEvaluation;
  reasons: string[];
}

/**
 * Cảnh báo nguy cơ nghỉ việc: NV tick "Không được ai hướng dẫn", "Quá nặng /
 * Quá tải", hoặc đánh giá quản lý & người hướng dẫn dưới 3 sao.
 */
export function getRiskFlags(): RiskFlag[] {
  const db = readDB();
  const empById = new Map(db.employees.map((e) => [e.id, e]));
  const flags: RiskFlag[] = [];

  for (const ev of db.self_evaluations) {
    const reasons: string[] = [];
    if (ev.muc_do_huong_dan === "khong_duoc") reasons.push("Không được ai hướng dẫn");
    if (ev.khoi_luong_cong_viec === "qua_tai") reasons.push("Quá nặng / Quá tải");
    if (ev.danh_gia_sao < 3) reasons.push(`Đánh giá quản lý/HD chỉ ${ev.danh_gia_sao}★`);
    if (reasons.length === 0) continue;

    const employee = empById.get(ev.employee_id);
    if (!employee) continue;
    flags.push({ employee, evaluation: ev, reasons });
  }

  return flags.sort((a, b) => b.evaluation.created_at.localeCompare(a.evaluation.created_at));
}
