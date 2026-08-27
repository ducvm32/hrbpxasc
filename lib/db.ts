import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import type {
  AdminUser,
  Assignment,
  DB,
  Employee,
  HrbpUser,
  SelfEvaluation,
  SupEvaluation,
  SupUser,
} from "./types";
import {
  SEED_SUP_USERS,
  SEED_HRBP_USERS,
  SEED_ADMIN_USERS,
  DEMO_ADMIN_PASSWORD,
  ADMIN_DEFAULT_PASSWORD,
} from "./constants";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app.db");
const LEGACY_JSON_FILE = path.join(DATA_DIR, "db.json");

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sup_users (
    id TEXT PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    ma_nv TEXT NOT NULL,
    email TEXT NOT NULL,
    ca_phu_trach TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hrbp_users (
    id TEXT PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    ma_nv TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    ho_ten TEXT NOT NULL,
    ma_nv TEXT NOT NULL,
    ca TEXT NOT NULL,
    ngay_nhan_viec TEXT NOT NULL,
    sup_id TEXT,
    nguoi_huong_dan TEXT,
    khu_vuc_line TEXT,
    tuan_hien_tai INTEGER NOT NULL,
    la_kpi_14ngay INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    tuan INTEGER NOT NULL,
    cong_viec TEXT NOT NULL,
    khu_vuc_line TEXT NOT NULL,
    thoi_gian_huong_dan TEXT NOT NULL,
    sup_note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sup_evaluations (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    sup_id TEXT NOT NULL,
    tuan INTEGER NOT NULL,
    ngay TEXT NOT NULL,
    lam_dung_cong_viec INTEGER NOT NULL,
    noi_dung TEXT NOT NULL,
    van_de_phat_sinh TEXT NOT NULL,
    anh_urls TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS self_evaluations (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    tuan INTEGER NOT NULL,
    ngay TEXT NOT NULL,
    dung_cong_viec TEXT NOT NULL,
    muc_do_huong_dan TEXT NOT NULL,
    khoi_luong_cong_viec TEXT NOT NULL,
    danh_gia_sao INTEGER NOT NULL,
    chia_se_cai_thien TEXT NOT NULL,
    anh_urls TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_employees_sup_id ON employees(sup_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_employee_id ON assignments(employee_id);
  CREATE INDEX IF NOT EXISTS idx_sup_evaluations_employee_id ON sup_evaluations(employee_id);
  CREATE INDEX IF NOT EXISTS idx_self_evaluations_employee_id ON self_evaluations(employee_id);
`;

let conn: Database.Database | null = null;

function rowToSupUser(r: any): SupUser {
  return { ...r, ca_phu_trach: JSON.parse(r.ca_phu_trach) };
}

function rowToEmployee(r: any): Employee {
  return { ...r, la_kpi_14ngay: !!r.la_kpi_14ngay };
}

function rowToSupEvaluation(r: any): SupEvaluation {
  return { ...r, lam_dung_cong_viec: !!r.lam_dung_cong_viec, anh_urls: JSON.parse(r.anh_urls) };
}

function rowToSelfEvaluation(r: any): SelfEvaluation {
  return { ...r, anh_urls: JSON.parse(r.anh_urls) };
}

/** Ghi đè toàn bộ dữ liệu vào các bảng SQLite, gói trong 1 transaction (atomic). */
function persistAll(db: Database.Database, data: DB) {
  const tx = db.transaction((data: DB) => {
    db.exec(
      "DELETE FROM admin_users; DELETE FROM sup_users; DELETE FROM hrbp_users; " +
        "DELETE FROM employees; DELETE FROM assignments; DELETE FROM sup_evaluations; DELETE FROM self_evaluations;"
    );

    const insertAdmin = db.prepare(
      "INSERT INTO admin_users (id, ho_ten, email, password_hash) VALUES (?,?,?,?)"
    );
    for (const a of data.admin_users) insertAdmin.run(a.id, a.ho_ten, a.email, a.password_hash);

    const insertSup = db.prepare(
      "INSERT INTO sup_users (id, ho_ten, ma_nv, email, ca_phu_trach, password_hash) VALUES (?,?,?,?,?,?)"
    );
    for (const s of data.sup_users) {
      insertSup.run(s.id, s.ho_ten, s.ma_nv, s.email, JSON.stringify(s.ca_phu_trach), s.password_hash);
    }

    const insertHrbp = db.prepare(
      "INSERT INTO hrbp_users (id, ho_ten, ma_nv, email, password_hash) VALUES (?,?,?,?,?)"
    );
    for (const h of data.hrbp_users) insertHrbp.run(h.id, h.ho_ten, h.ma_nv, h.email, h.password_hash);

    const insertEmp = db.prepare(
      `INSERT INTO employees
        (id, ho_ten, ma_nv, ca, ngay_nhan_viec, sup_id, nguoi_huong_dan, khu_vuc_line, tuan_hien_tai, la_kpi_14ngay, created_at, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    for (const e of data.employees) {
      insertEmp.run(
        e.id,
        e.ho_ten,
        e.ma_nv,
        e.ca,
        e.ngay_nhan_viec,
        e.sup_id,
        e.nguoi_huong_dan,
        e.khu_vuc_line,
        e.tuan_hien_tai,
        e.la_kpi_14ngay ? 1 : 0,
        e.created_at,
        e.created_by
      );
    }

    const insertAssign = db.prepare(
      `INSERT INTO assignments
        (id, employee_id, tuan, cong_viec, khu_vuc_line, thoi_gian_huong_dan, sup_note, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    );
    for (const a of data.assignments) {
      insertAssign.run(
        a.id,
        a.employee_id,
        a.tuan,
        a.cong_viec,
        a.khu_vuc_line,
        a.thoi_gian_huong_dan,
        a.sup_note,
        a.created_at,
        a.updated_at
      );
    }

    const insertSupEval = db.prepare(
      `INSERT INTO sup_evaluations
        (id, employee_id, sup_id, tuan, ngay, lam_dung_cong_viec, noi_dung, van_de_phat_sinh, anh_urls, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    );
    for (const ev of data.sup_evaluations) {
      insertSupEval.run(
        ev.id,
        ev.employee_id,
        ev.sup_id,
        ev.tuan,
        ev.ngay,
        ev.lam_dung_cong_viec ? 1 : 0,
        ev.noi_dung,
        ev.van_de_phat_sinh,
        JSON.stringify(ev.anh_urls),
        ev.created_at
      );
    }

    const insertSelfEval = db.prepare(
      `INSERT INTO self_evaluations
        (id, employee_id, tuan, ngay, dung_cong_viec, muc_do_huong_dan, khoi_luong_cong_viec, danh_gia_sao, chia_se_cai_thien, anh_urls, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    );
    for (const ev of data.self_evaluations) {
      insertSelfEval.run(
        ev.id,
        ev.employee_id,
        ev.tuan,
        ev.ngay,
        ev.dung_cong_viec,
        ev.muc_do_huong_dan,
        ev.khoi_luong_cong_viec,
        ev.danh_gia_sao,
        ev.chia_se_cai_thien,
        JSON.stringify(ev.anh_urls),
        ev.created_at
      );
    }
  });
  tx(data);
}

function loadAll(db: Database.Database): DB {
  return {
    admin_users: db.prepare("SELECT * FROM admin_users").all() as AdminUser[],
    sup_users: (db.prepare("SELECT * FROM sup_users").all() as any[]).map(rowToSupUser),
    hrbp_users: db.prepare("SELECT * FROM hrbp_users").all() as HrbpUser[],
    employees: (db.prepare("SELECT * FROM employees ORDER BY created_at").all() as any[]).map(rowToEmployee),
    assignments: db.prepare("SELECT * FROM assignments").all() as Assignment[],
    sup_evaluations: (db.prepare("SELECT * FROM sup_evaluations ORDER BY created_at").all() as any[]).map(
      rowToSupEvaluation
    ),
    self_evaluations: (db.prepare("SELECT * FROM self_evaluations ORDER BY created_at").all() as any[]).map(
      rowToSelfEvaluation
    ),
  };
}

/**
 * Nếu DB SQLite còn trống (lần chạy đầu sau khi nâng cấp từ bản JSON cũ) mà
 * còn file data/db.json cũ trong volume — import nguyên dữ liệu đó sang, giữ
 * đúng password_hash hiện có (không seed lại mật khẩu). Sau khi import xong,
 * đổi tên file cũ thành .migrated để không import lặp lại.
 */
function migrateFromLegacyJson(db: Database.Database) {
  const hasAnyData =
    (db.prepare("SELECT COUNT(*) c FROM employees").get() as any).c > 0 ||
    (db.prepare("SELECT COUNT(*) c FROM sup_users").get() as any).c > 0 ||
    (db.prepare("SELECT COUNT(*) c FROM admin_users").get() as any).c > 0;
  if (hasAnyData) return;
  if (!fs.existsSync(LEGACY_JSON_FILE)) return;

  const legacy = JSON.parse(fs.readFileSync(LEGACY_JSON_FILE, "utf-8")) as Partial<DB>;

  // db.json cũ có thể còn sót vài bản ghi tự đánh giá từ 1 phiên bản schema
  // trước đó (thiếu dung_cong_viec/muc_do_huong_dan/khoi_luong_cong_viec) —
  // bỏ qua các bản ghi hỏng đó thay vì để cả lượt import bị rollback.
  const selfEvals = legacy.self_evaluations ?? [];
  const validSelfEvals = selfEvals.filter(
    (ev: any) =>
      typeof ev.dung_cong_viec === "string" &&
      typeof ev.muc_do_huong_dan === "string" &&
      typeof ev.khoi_luong_cong_viec === "string" &&
      typeof ev.danh_gia_sao === "number"
  );
  const droppedCount = selfEvals.length - validSelfEvals.length;
  if (droppedCount > 0) {
    console.warn(
      `[migrateFromLegacyJson] Bỏ qua ${droppedCount} bản ghi self_evaluations không hợp lệ (schema cũ) khi import sang SQLite.`
    );
  }

  persistAll(db, {
    admin_users: legacy.admin_users ?? [],
    sup_users: legacy.sup_users ?? [],
    hrbp_users: legacy.hrbp_users ?? [],
    employees: legacy.employees ?? [],
    assignments: legacy.assignments ?? [],
    sup_evaluations: legacy.sup_evaluations ?? [],
    self_evaluations: validSelfEvals,
  });
  fs.renameSync(LEGACY_JSON_FILE, `${LEGACY_JSON_FILE}.migrated`);
}

function seedIfEmpty(db: Database.Database) {
  const adminCount = (db.prepare("SELECT COUNT(*) c FROM admin_users").get() as any).c;
  if (adminCount === 0) {
    const hash = bcrypt.hashSync(ADMIN_DEFAULT_PASSWORD, 10);
    const insert = db.prepare("INSERT INTO admin_users (id, ho_ten, email, password_hash) VALUES (?,?,?,?)");
    for (const a of SEED_ADMIN_USERS) insert.run(a.id, a.ho_ten, a.email, hash);
  }

  const supCount = (db.prepare("SELECT COUNT(*) c FROM sup_users").get() as any).c;
  const hrbpCount = (db.prepare("SELECT COUNT(*) c FROM hrbp_users").get() as any).c;
  if (supCount === 0 && hrbpCount === 0) {
    const hash = bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 10);
    const insertSup = db.prepare(
      "INSERT INTO sup_users (id, ho_ten, ma_nv, email, ca_phu_trach, password_hash) VALUES (?,?,?,?,?,?)"
    );
    for (const s of SEED_SUP_USERS) {
      insertSup.run(s.id, s.ho_ten, s.ma_nv, s.email, JSON.stringify(s.ca_phu_trach), hash);
    }
    const insertHrbp = db.prepare(
      "INSERT INTO hrbp_users (id, ho_ten, ma_nv, email, password_hash) VALUES (?,?,?,?,?)"
    );
    for (const h of SEED_HRBP_USERS) insertHrbp.run(h.id, h.ho_ten, h.ma_nv, h.email, hash);
  }
}

function getConnection(): Database.Database {
  if (conn) return conn;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA_SQL);
  migrateFromLegacyJson(db);
  seedIfEmpty(db);

  conn = db;
  return db;
}

export function readDB(): DB {
  return loadAll(getConnection());
}

// Hàng đợi ghi trong process để tránh 2 mutateDB() chồng lên nhau — mỗi lượt
// đọc toàn bộ DB, cho callback chỉnh sửa trực tiếp trên object JS, rồi ghi đè
// lại toàn bộ vào SQLite trong 1 transaction (atomic — không bao giờ để DB ở
// trạng thái ghi dở/hỏng như file JSON trước đây).
let writeChain: Promise<void> = Promise.resolve();

export async function mutateDB<T>(fn: (db: DB) => T): Promise<T> {
  let result!: T;
  writeChain = writeChain.then(() => {
    const db = getConnection();
    const data = loadAll(db);
    result = fn(data);
    persistAll(db, data);
  });
  await writeChain;
  return result;
}

export function todayISO(): string {
  const d = new Date();
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}
