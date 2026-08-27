import { readDB } from "./db";
import { allowedWeek, daysSinceStart, weekByDate } from "./week";
import type {
  DungCongViec,
  Employee,
  KhoiLuongCongViec,
  MucDoHuongDan,
  SelfEvaluation,
  Tuan,
} from "./types";

export function getSupById(id: string) {
  return readDB().sup_users.find((s) => s.id === id) ?? null;
}

export function getPoolForCaList(caList: string[]): Employee[] {
  const db = readDB();
  return db.employees.filter((e) => !e.sup_id && caList.includes(e.ca));
}

export function getTeamForSup(supId: string): Employee[] {
  const db = readDB();
  return db.employees.filter((e) => e.sup_id === supId);
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

export interface AreaReportRow {
  ca: string;
  tuan: Tuan;
  total: number;
  areas: { khu_vuc: string; count: number }[]; // sắp xếp giảm dần theo số lượng
  topArea: string | null;
  topCount: number;
}

/**
 * Với mỗi Ca × Tuần hiện tại (1/2/3), NV đang tập trung nhận việc chủ yếu ở
 * khu vực/line nào — dùng khu_vực_line hiện tại của NV (Sup gán khi phân công).
 */
export function getAreaReportByWeek(): AreaReportRow[] {
  const employees = readDB().employees;
  const groups = new Map<string, Employee[]>();
  for (const e of employees) {
    const tuan = currentWeekOf(e);
    if (tuan === 0) continue;
    const key = `${e.ca}|${tuan}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  const rows: AreaReportRow[] = [];
  for (const [key, emps] of groups) {
    const [ca, tuanStr] = key.split("|");
    const tuan = Number(tuanStr) as Tuan;
    const areaCounts = new Map<string, number>();
    for (const e of emps) {
      const area = e.khu_vuc_line || "Chưa gán khu vực";
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
    }
    const areas = [...areaCounts.entries()]
      .map(([khu_vuc, count]) => ({ khu_vuc, count }))
      .sort((a, b) => b.count - a.count);
    rows.push({
      ca,
      tuan,
      total: emps.length,
      areas,
      topArea: areas[0]?.khu_vuc ?? null,
      topCount: areas[0]?.count ?? 0,
    });
  }

  return rows.sort((a, b) => a.ca.localeCompare(b.ca) || a.tuan - b.tuan);
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
