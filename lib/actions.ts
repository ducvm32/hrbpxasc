"use server";

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import { readDB, mutateDB, todayISO } from "./db";
import { getSession, setSessionCookie, clearSessionCookie } from "./auth";
import {
  CA_LIST,
  isKpiCa,
  DUNG_CONG_VIEC_LABEL,
  DUNG_CONG_VIEC_OPTIONS,
  KHOI_LUONG_CONG_VIEC_LABEL,
  KHOI_LUONG_CONG_VIEC_OPTIONS,
  MUC_DO_HUONG_DAN_LABEL,
  MUC_DO_HUONG_DAN_OPTIONS,
} from "./constants";
import { getAreaReportByWeek, getRiskFlags, getSelfEvalSummary } from "./queries";
import { allowedWeek } from "./week";
import type {
  DungCongViec,
  Employee,
  KhoiLuongCongViec,
  MucDoHuongDan,
  Role,
  SessionData,
  Tuan,
} from "./types";

function requireRole(roles: Role[]): SessionData {
  const session = getSession();
  if (!session) {
    // Phiên đăng nhập hết hạn hoặc chưa có — đưa về màn đăng nhập thay vì
    // hiện lỗi server khó hiểu.
    redirect("/login");
  }
  if (!roles.includes(session.role)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }
  return session;
}

export type ActionResult = { success?: true; error?: string; [k: string]: unknown };

// ---------- Auth ----------

export async function loginEmployeeAction(formData: FormData): Promise<ActionResult | void> {
  const ma_nv = String(formData.get("ma_nv") || "").trim();
  if (!ma_nv) return { error: "Vui lòng nhập mã nhân viên" };
  const db = readDB();
  const emp = db.employees.find((e) => e.ma_nv === ma_nv);
  if (!emp) return { error: "Không tìm thấy mã nhân viên. Vui lòng liên hệ HRBP." };
  setSessionCookie({ role: "nhanvien", id: emp.id, ho_ten: emp.ho_ten, ma_nv: emp.ma_nv });
  redirect("/employee");
}

export async function loginAdminAction(formData: FormData): Promise<ActionResult | void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email.endsWith("@ghn.vn")) {
    return { error: "Email phải có đuôi @ghn.vn" };
  }
  const db = readDB();
  const admin = db.admin_users.find((u) => u.email.toLowerCase() === email);
  if (admin) {
    if (!bcrypt.compareSync(password, admin.password_hash)) return { error: "Sai mật khẩu" };
    setSessionCookie({ role: "admin", id: admin.id, ho_ten: admin.ho_ten, ma_nv: admin.id });
    redirect("/admin");
  }
  const hrbp = db.hrbp_users.find((u) => u.email.toLowerCase() === email);
  if (hrbp) {
    if (!bcrypt.compareSync(password, hrbp.password_hash)) return { error: "Sai mật khẩu" };
    setSessionCookie({ role: "hrbp", id: hrbp.id, ho_ten: hrbp.ho_ten, ma_nv: hrbp.ma_nv });
    redirect("/hrbp");
  }
  const sup = db.sup_users.find((u) => u.email.toLowerCase() === email);
  if (sup) {
    if (!bcrypt.compareSync(password, sup.password_hash)) return { error: "Sai mật khẩu" };
    setSessionCookie({ role: "sup", id: sup.id, ho_ten: sup.ho_ten, ma_nv: sup.ma_nv });
    redirect("/sup");
  }
  return { error: "Không tìm thấy tài khoản Quản trị với email này" };
}

export async function logoutAction() {
  clearSessionCookie();
  redirect("/login");
}

// ---------- HRBP ----------

export async function addEmployeeAction(formData: FormData): Promise<ActionResult> {
  const session = requireRole(["hrbp"]);
  const ho_ten = String(formData.get("ho_ten") || "").trim();
  const ma_nv = String(formData.get("ma_nv") || "").trim();
  const ca = String(formData.get("ca") || "");
  const ngay_nhan_viec = String(formData.get("ngay_nhan_viec") || "") || todayISO();

  if (!ho_ten || !ma_nv || !ca) return { error: "Vui lòng nhập đầy đủ Họ tên, Mã NV và Ca làm việc" };
  if (!(CA_LIST as readonly string[]).includes(ca)) return { error: "Ca làm việc không hợp lệ" };

  return mutateDB((db) => {
    if (db.employees.some((e) => e.ma_nv === ma_nv)) {
      return { error: `Mã NV ${ma_nv} đã tồn tại trong hệ thống` };
    }
    const emp: Employee = {
      id: uuidv4(),
      ho_ten,
      ma_nv,
      ca,
      ngay_nhan_viec,
      sup_id: null,
      nguoi_huong_dan: null,
      khu_vuc_line: null,
      tuan_hien_tai: 1,
      la_kpi_14ngay: isKpiCa(ca),
      created_at: new Date().toISOString(),
      created_by: session.id,
    };
    db.employees.push(emp);
    return { success: true as const };
  });
}

export async function assignEmployeeToSupAction(
  employeeId: string,
  targetSupId: string
): Promise<ActionResult> {
  requireRole(["hrbp"]);
  return mutateDB((db) => {
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return { error: "Không tìm thấy nhân viên" };
    const sup = db.sup_users.find((s) => s.id === targetSupId);
    if (!sup) return { error: "Không tìm thấy Sup" };
    emp.sup_id = sup.id;
    return { success: true as const };
  });
}

export async function exportExcelBase64Action(): Promise<{ base64: string; filename: string }> {
  requireRole(["hrbp"]);
  const db = readDB();
  const supById = new Map(db.sup_users.map((s) => [s.id, s]));

  const employeesSheet = db.employees.map((e) => {
    const days =
      Math.floor(
        (new Date(todayISO()).getTime() - new Date(e.ngay_nhan_viec).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;
    return {
      "Họ tên": e.ho_ten,
      "Mã NV": e.ma_nv,
      Ca: e.ca,
      "Ngày nhận việc": e.ngay_nhan_viec,
      "Số ngày đã làm": days,
      "Sup phụ trách": e.sup_id ? supById.get(e.sup_id)?.ho_ten ?? "" : "(Chưa nhận - POOL)",
      "Người hướng dẫn": e.nguoi_huong_dan ?? "",
      "Khu vực / Line": e.khu_vuc_line ?? "",
      "KPI giữ người 14 ngày": e.la_kpi_14ngay ? "Có" : "",
    };
  });

  const supEvalSheet = db.sup_evaluations.map((ev) => {
    const emp = db.employees.find((e) => e.id === ev.employee_id);
    return {
      "Mã NV": emp?.ma_nv ?? "",
      "Họ tên": emp?.ho_ten ?? "",
      "Sup đánh giá": supById.get(ev.sup_id)?.ho_ten ?? "",
      Tuần: ev.tuan,
      Ngày: ev.ngay,
      "Làm đúng công việc": ev.lam_dung_cong_viec ? "Có" : "Không",
      "Nội dung": ev.noi_dung,
      "Vấn đề phát sinh": ev.van_de_phat_sinh,
      "Số ảnh đính kèm": ev.anh_urls.length,
    };
  });

  const selfEvalSheet = db.self_evaluations.map((ev) => {
    const emp = db.employees.find((e) => e.id === ev.employee_id);
    return {
      "Mã NV": emp?.ma_nv ?? "",
      "Họ tên": emp?.ho_ten ?? "",
      Tuần: ev.tuan,
      Ngày: ev.ngay,
      "Đúng công việc/line": DUNG_CONG_VIEC_LABEL[ev.dung_cong_viec] ?? ev.dung_cong_viec,
      "Mức độ hướng dẫn": MUC_DO_HUONG_DAN_LABEL[ev.muc_do_huong_dan] ?? ev.muc_do_huong_dan,
      "Khối lượng công việc": KHOI_LUONG_CONG_VIEC_LABEL[ev.khoi_luong_cong_viec] ?? ev.khoi_luong_cong_viec,
      "Đánh giá quản lý/HD (sao)": ev.danh_gia_sao,
      "Chia sẻ để cải thiện": ev.chia_se_cai_thien,
      "Số ảnh đính kèm": ev.anh_urls.length,
    };
  });

  const areaReportSheet = getAreaReportByWeek().map((row) => ({
    Ca: row.ca,
    Tuần: row.tuan,
    "Tổng NV": row.total,
    "Khu vực chính": row.topArea ?? "",
    "Số NV ở khu vực chính": row.topCount,
    "Chi tiết khu vực": row.areas.map((a) => `${a.khu_vuc}: ${a.count}`).join(" | "),
  }));

  const summary = getSelfEvalSummary();
  const selfEvalSummarySheet = [
    { "Chỉ số": "Tổng số lượt tự đánh giá", "Giá trị": summary.total },
    { "Chỉ số": "Điểm trung bình quản lý & HD (sao)", "Giá trị": summary.total ? Number(summary.avgStars.toFixed(2)) : "" },
    ...([5, 4, 3, 2, 1] as const).map((sao) => ({
      "Chỉ số": `Số lượt ${sao} sao`,
      "Giá trị": summary.starCounts[sao],
    })),
    ...MUC_DO_HUONG_DAN_OPTIONS.map((o) => ({
      "Chỉ số": `Mức độ hướng dẫn — ${o.label}`,
      "Giá trị": summary.mucDoHuongDanCounts[o.value],
    })),
    ...KHOI_LUONG_CONG_VIEC_OPTIONS.map((o) => ({
      "Chỉ số": `Khối lượng công việc — ${o.label}`,
      "Giá trị": summary.khoiLuongCongViecCounts[o.value],
    })),
    ...DUNG_CONG_VIEC_OPTIONS.map((o) => ({
      "Chỉ số": `Đúng công việc/line — ${o.label}`,
      "Giá trị": summary.dungCongViecCounts[o.value],
    })),
  ];

  const riskSheet = getRiskFlags().map((f) => ({
    "Mã NV": f.employee.ma_nv,
    "Họ tên": f.employee.ho_ten,
    Ca: f.employee.ca,
    "Sup phụ trách": f.employee.sup_id ? supById.get(f.employee.sup_id)?.ho_ten ?? "" : "(Chưa nhận - POOL)",
    Tuần: f.evaluation.tuan,
    Ngày: f.evaluation.ngay,
    "Lý do cảnh báo": f.reasons.join(" | "),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employeesSheet), "Nhan vien");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(supEvalSheet), "Danh gia Sup");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(selfEvalSheet), "Tu danh gia NV");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(areaReportSheet), "Bao cao khu vuc theo tuan");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(selfEvalSummarySheet), "Tong hop tu danh gia");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riskSheet), "Canh bao nghi viec");

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" }) as string;
  return { base64, filename: `GHN_Onboarding_${todayISO()}.xlsx` };
}

// ---------- Sup ----------

export async function claimEmployeeAction(employeeId: string): Promise<ActionResult> {
  const session = requireRole(["sup"]);
  return mutateDB((db) => {
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) return { error: "Không tìm thấy nhân viên" };
    if (emp.sup_id) return { error: "Nhân viên này đã có Sup phụ trách" };
    const sup = db.sup_users.find((s) => s.id === session.id)!;
    if (!sup.ca_phu_trach.includes(emp.ca)) {
      return { error: "Ca của bạn không khớp với ca của nhân viên này" };
    }
    emp.sup_id = sup.id;
    return { success: true as const };
  });
}

async function saveUploadedImages(formData: FormData, field: string): Promise<string[]> {
  const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  const urls: string[] = [];
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    const filename = `${uuidv4()}${safeExt}`;
    fs.writeFileSync(path.join(uploadDir, filename), buf);
    urls.push(`/uploads/${filename}`);
  }
  return urls;
}

export async function saveAssignmentAction(formData: FormData): Promise<ActionResult> {
  const session = requireRole(["sup"]);
  const employee_id = String(formData.get("employee_id") || "");
  const tuan = Number(formData.get("tuan") || 1) as Tuan;
  const nguoi_huong_dan = String(formData.get("nguoi_huong_dan") || "").trim();
  const khu_vuc_line = String(formData.get("khu_vuc_line") || "").trim();
  const cong_viec = String(formData.get("cong_viec") || "").trim();
  const thoi_gian_huong_dan = String(formData.get("thoi_gian_huong_dan") || "").trim();
  const sup_note = String(formData.get("sup_note") || "").trim();

  return mutateDB((db) => {
    const emp = db.employees.find((e) => e.id === employee_id);
    if (!emp) return { error: "Không tìm thấy nhân viên" };
    if (emp.sup_id !== session.id) return { error: "Bạn không phụ trách nhân viên này" };

    if (nguoi_huong_dan) emp.nguoi_huong_dan = nguoi_huong_dan;
    if (khu_vuc_line) emp.khu_vuc_line = khu_vuc_line;

    const now = new Date().toISOString();
    let a = db.assignments.find((x) => x.employee_id === employee_id && x.tuan === tuan);
    if (a) {
      a.cong_viec = cong_viec || a.cong_viec;
      a.khu_vuc_line = khu_vuc_line || a.khu_vuc_line;
      a.thoi_gian_huong_dan = thoi_gian_huong_dan || a.thoi_gian_huong_dan;
      a.sup_note = sup_note;
      a.updated_at = now;
    } else {
      db.assignments.push({
        id: uuidv4(),
        employee_id,
        tuan,
        cong_viec,
        khu_vuc_line,
        thoi_gian_huong_dan,
        sup_note,
        created_at: now,
        updated_at: now,
      });
    }
    return { success: true as const };
  });
}

export async function submitSupEvaluationAction(formData: FormData): Promise<ActionResult> {
  const session = requireRole(["sup"]);
  const employee_id = String(formData.get("employee_id") || "");
  const tuan = Number(formData.get("tuan") || 0) as Tuan;
  const lam_dung_cong_viec = formData.get("lam_dung_cong_viec") === "on";
  const noi_dung = String(formData.get("noi_dung") || "").trim();
  const van_de_phat_sinh = String(formData.get("van_de_phat_sinh") || "").trim();
  const anh_urls = await saveUploadedImages(formData, "anh");

  const db = readDB();
  const emp = db.employees.find((e) => e.id === employee_id);
  if (!emp) return { error: "Không tìm thấy nhân viên" };
  if (emp.sup_id !== session.id) return { error: "Bạn không phụ trách nhân viên này" };

  const submittedWeeks = db.sup_evaluations
    .filter((ev) => ev.employee_id === employee_id)
    .map((ev) => ev.tuan);
  const allowed = allowedWeek(emp.ngay_nhan_viec, submittedWeeks);
  if (allowed === 0) return { error: "Chưa đến hạn hoặc đã hoàn tất đánh giá 3 tuần cho nhân viên này" };
  if (tuan !== allowed) return { error: `Hiện chỉ được mở đánh giá Tuần ${allowed}` };

  return mutateDB((db2) => {
    db2.sup_evaluations.push({
      id: uuidv4(),
      employee_id,
      sup_id: session.id,
      tuan,
      ngay: todayISO(),
      lam_dung_cong_viec,
      noi_dung,
      van_de_phat_sinh,
      anh_urls,
      created_at: new Date().toISOString(),
    });
    return { success: true as const };
  });
}

// ---------- Nhân viên ----------

export async function submitSelfEvaluationAction(formData: FormData): Promise<ActionResult> {
  const session = requireRole(["nhanvien"]);
  const tuan = Number(formData.get("tuan") || 0) as Tuan;
  const dung_cong_viec = String(formData.get("dung_cong_viec") || "") as DungCongViec;
  const muc_do_huong_dan = String(formData.get("muc_do_huong_dan") || "") as MucDoHuongDan;
  const khoi_luong_cong_viec = String(formData.get("khoi_luong_cong_viec") || "") as KhoiLuongCongViec;
  const danh_gia_sao = Number(formData.get("danh_gia_sao") || 0);
  const chia_se_cai_thien = String(formData.get("chia_se_cai_thien") || "").trim();
  const anh_urls = await saveUploadedImages(formData, "anh");

  if (!DUNG_CONG_VIEC_OPTIONS.some((o) => o.value === dung_cong_viec)) {
    return { error: "Vui lòng trả lời câu 1: Bạn có làm đúng công việc/line được gắn không" };
  }
  if (!MUC_DO_HUONG_DAN_OPTIONS.some((o) => o.value === muc_do_huong_dan)) {
    return { error: "Vui lòng trả lời câu 2: Người hướng dẫn có kèm cặp bạn không" };
  }
  if (!KHOI_LUONG_CONG_VIEC_OPTIONS.some((o) => o.value === khoi_luong_cong_viec)) {
    return { error: "Vui lòng trả lời câu 3: Khối lượng công việc tuần này thế nào" };
  }
  if (!Number.isInteger(danh_gia_sao) || danh_gia_sao < 1 || danh_gia_sao > 5) {
    return { error: "Vui lòng chọn câu 4: Đánh giá quản lý & người hướng dẫn từ 1 đến 5 sao" };
  }

  const db = readDB();
  const emp = db.employees.find((e) => e.id === session.id);
  if (!emp) return { error: "Không tìm thấy hồ sơ nhân viên" };

  const submittedWeeks = db.self_evaluations
    .filter((ev) => ev.employee_id === emp.id)
    .map((ev) => ev.tuan);
  const allowed = allowedWeek(emp.ngay_nhan_viec, submittedWeeks);
  if (allowed === 0) return { error: "Chưa đến hạn hoặc đã hoàn tất tự đánh giá 3 tuần" };
  if (tuan !== allowed) return { error: `Hiện chỉ được mở tự đánh giá Tuần ${allowed}` };

  return mutateDB((db2) => {
    db2.self_evaluations.push({
      id: uuidv4(),
      employee_id: emp.id,
      tuan,
      ngay: todayISO(),
      dung_cong_viec,
      muc_do_huong_dan,
      khoi_luong_cong_viec,
      danh_gia_sao,
      chia_se_cai_thien,
      anh_urls,
      created_at: new Date().toISOString(),
    });
    return { success: true as const };
  });
}

// ---------- Admin (phân quyền & mật khẩu Sup/HRBP) ----------

const MIN_PASSWORD_LEN = 6;

export async function createAccountAction(formData: FormData): Promise<ActionResult> {
  requireRole(["admin"]);
  const role = String(formData.get("role") || "");
  const ho_ten = String(formData.get("ho_ten") || "").trim();
  const id = String(formData.get("id") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const ca_phu_trach = formData.getAll("ca_phu_trach").map(String);

  if (role !== "sup" && role !== "hrbp") return { error: "Vai trò không hợp lệ" };
  if (!ho_ten || !id || !email || !password) return { error: "Vui lòng nhập đầy đủ thông tin" };
  if (!email.endsWith("@ghn.vn")) return { error: "Email phải có đuôi @ghn.vn" };
  if (password.length < MIN_PASSWORD_LEN) return { error: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LEN} ký tự` };
  if (role === "sup" && ca_phu_trach.length === 0) {
    return { error: "Vui lòng chọn ít nhất 1 Ca phụ trách cho Sup" };
  }

  const password_hash = bcrypt.hashSync(password, 10);

  return mutateDB((db) => {
    const idTaken =
      db.sup_users.some((u) => u.id === id) ||
      db.hrbp_users.some((u) => u.id === id) ||
      db.admin_users.some((u) => u.id === id);
    if (idTaken) return { error: `Mã/ID đăng nhập "${id}" đã tồn tại` };

    const emailTaken =
      db.sup_users.some((u) => u.email.toLowerCase() === email) ||
      db.hrbp_users.some((u) => u.email.toLowerCase() === email) ||
      db.admin_users.some((u) => u.email.toLowerCase() === email);
    if (emailTaken) return { error: "Email đã được dùng bởi tài khoản khác" };

    if (role === "sup") {
      db.sup_users.push({ id, ho_ten, ma_nv: id, email, ca_phu_trach, password_hash });
    } else {
      db.hrbp_users.push({ id, ho_ten, ma_nv: id, email, password_hash });
    }
    return { success: true as const };
  });
}

export async function setPasswordAction(formData: FormData): Promise<ActionResult> {
  const session = requireRole(["admin"]);
  const accountType = String(formData.get("account_type") || "");
  const accountId = String(formData.get("account_id") || "");
  const newPassword = String(formData.get("new_password") || "");

  if (newPassword.length < MIN_PASSWORD_LEN) {
    return { error: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LEN} ký tự` };
  }
  if (accountType === "admin" && accountId !== session.id) {
    return { error: "Chỉ có thể tự đổi mật khẩu của chính tài khoản Admin đang đăng nhập" };
  }
  if (!["admin", "sup", "hrbp"].includes(accountType)) return { error: "Loại tài khoản không hợp lệ" };

  const password_hash = bcrypt.hashSync(newPassword, 10);

  return mutateDB((db) => {
    const list = accountType === "admin" ? db.admin_users : accountType === "sup" ? db.sup_users : db.hrbp_users;
    const account = list.find((u) => u.id === accountId);
    if (!account) return { error: "Không tìm thấy tài khoản" };
    account.password_hash = password_hash;
    return { success: true as const };
  });
}

export async function changeRoleAction(formData: FormData): Promise<ActionResult> {
  requireRole(["admin"]);
  const accountId = String(formData.get("account_id") || "");
  const fromRole = String(formData.get("from_role") || "");
  const toRole = String(formData.get("to_role") || "");
  const ca_phu_trach = formData.getAll("ca_phu_trach").map(String);

  if (!["sup", "hrbp"].includes(fromRole) || !["sup", "hrbp"].includes(toRole)) {
    return { error: "Vai trò không hợp lệ" };
  }
  if (fromRole === toRole) return { error: "Vai trò mới phải khác vai trò hiện tại" };
  if (toRole === "sup" && ca_phu_trach.length === 0) {
    return { error: "Vui lòng chọn ít nhất 1 Ca phụ trách cho vai trò Sup" };
  }

  return mutateDB((db) => {
    if (fromRole === "sup") {
      const idx = db.sup_users.findIndex((u) => u.id === accountId);
      if (idx === -1) return { error: "Không tìm thấy tài khoản" };
      if (db.employees.some((e) => e.sup_id === accountId)) {
        return { error: "Không thể đổi vai trò: Sup này đang phụ trách nhân viên. Hãy gắn lại NV cho Sup khác trước." };
      }
      const [u] = db.sup_users.splice(idx, 1);
      db.hrbp_users.push({ id: u.id, ho_ten: u.ho_ten, ma_nv: u.ma_nv, email: u.email, password_hash: u.password_hash });
    } else {
      const idx = db.hrbp_users.findIndex((u) => u.id === accountId);
      if (idx === -1) return { error: "Không tìm thấy tài khoản" };
      const [u] = db.hrbp_users.splice(idx, 1);
      db.sup_users.push({
        id: u.id,
        ho_ten: u.ho_ten,
        ma_nv: u.ma_nv,
        email: u.email,
        ca_phu_trach,
        password_hash: u.password_hash,
      });
    }
    return { success: true as const };
  });
}

export async function updateSupCaAction(formData: FormData): Promise<ActionResult> {
  requireRole(["admin"]);
  const accountId = String(formData.get("account_id") || "");
  const ca_phu_trach = formData.getAll("ca_phu_trach").map(String);
  if (ca_phu_trach.length === 0) return { error: "Vui lòng chọn ít nhất 1 Ca phụ trách" };

  return mutateDB((db) => {
    const sup = db.sup_users.find((u) => u.id === accountId);
    if (!sup) return { error: "Không tìm thấy Sup" };
    sup.ca_phu_trach = ca_phu_trach;
    return { success: true as const };
  });
}

export async function deleteAccountAction(accountId: string, role: "sup" | "hrbp"): Promise<ActionResult> {
  requireRole(["admin"]);
  return mutateDB((db) => {
    if (role === "sup") {
      if (db.employees.some((e) => e.sup_id === accountId)) {
        return { error: "Không thể xoá: Sup này đang phụ trách nhân viên. Hãy gắn lại NV cho Sup khác trước." };
      }
      const before = db.sup_users.length;
      db.sup_users = db.sup_users.filter((u) => u.id !== accountId);
      if (db.sup_users.length === before) return { error: "Không tìm thấy tài khoản" };
    } else {
      if (db.hrbp_users.length <= 1) return { error: "Không thể xoá HRBP cuối cùng trong hệ thống" };
      const before = db.hrbp_users.length;
      db.hrbp_users = db.hrbp_users.filter((u) => u.id !== accountId);
      if (db.hrbp_users.length === before) return { error: "Không tìm thấy tài khoản" };
    }
    return { success: true as const };
  });
}

// ---------- Admin: quản lý nhân viên do HRBP tạo ----------

export async function updateEmployeeAction(formData: FormData): Promise<ActionResult> {
  requireRole(["admin"]);
  const employee_id = String(formData.get("employee_id") || "");
  const ho_ten = String(formData.get("ho_ten") || "").trim();
  const ma_nv = String(formData.get("ma_nv") || "").trim();
  const ca = String(formData.get("ca") || "");
  const ngay_nhan_viec = String(formData.get("ngay_nhan_viec") || "");

  if (!ho_ten || !ma_nv || !ca || !ngay_nhan_viec) {
    return { error: "Vui lòng nhập đầy đủ Họ tên, Mã NV, Ca làm việc và Ngày nhận việc" };
  }
  if (!(CA_LIST as readonly string[]).includes(ca)) return { error: "Ca làm việc không hợp lệ" };

  return mutateDB((db) => {
    const emp = db.employees.find((e) => e.id === employee_id);
    if (!emp) return { error: "Không tìm thấy nhân viên" };
    if (db.employees.some((e) => e.id !== employee_id && e.ma_nv === ma_nv)) {
      return { error: `Mã NV ${ma_nv} đã được dùng bởi nhân viên khác` };
    }
    emp.ho_ten = ho_ten;
    emp.ma_nv = ma_nv;
    emp.ca = ca;
    emp.ngay_nhan_viec = ngay_nhan_viec;
    emp.la_kpi_14ngay = isKpiCa(ca);
    return { success: true as const };
  });
}

export async function deleteEmployeeAction(employeeId: string): Promise<ActionResult> {
  requireRole(["admin"]);
  return mutateDB((db) => {
    const before = db.employees.length;
    db.employees = db.employees.filter((e) => e.id !== employeeId);
    if (db.employees.length === before) return { error: "Không tìm thấy nhân viên" };
    db.assignments = db.assignments.filter((a) => a.employee_id !== employeeId);
    db.sup_evaluations = db.sup_evaluations.filter((ev) => ev.employee_id !== employeeId);
    db.self_evaluations = db.self_evaluations.filter((ev) => ev.employee_id !== employeeId);
    return { success: true as const };
  });
}
