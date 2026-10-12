export type Role = "admin" | "hrbp" | "sup" | "nhanvien";

export type Tuan = 1 | 2 | 3;

export interface SupUser {
  id: string; // ma_nv
  ho_ten: string;
  ma_nv: string;
  email: string; // đăng nhập qua Google OAuth, đối chiếu theo email này
  ca_phu_trach: string[];
}

export interface HrbpUser {
  id: string;
  ho_ten: string;
  ma_nv: string;
  email: string; // đăng nhập qua Google OAuth, đối chiếu theo email này
}

export interface AdminUser {
  id: string;
  ho_ten: string;
  email: string; // đăng nhập qua Google OAuth, đối chiếu theo email này
}

export interface Employee {
  id: string;
  ho_ten: string;
  ma_nv: string;
  sdt: string; // số điện thoại — 4 số cuối dùng làm yếu tố thứ 2 khi đăng nhập
  ca: string;
  ngay_nhan_viec: string; // ISO date (yyyy-MM-dd)
  nguoi_huong_dan: string | null;
  khu_vuc_line: string | null;
  tuan_hien_tai: Tuan;
  la_kpi_14ngay: boolean;
  created_at: string;
  created_by: string; // hrbp id who added
}

export interface Assignment {
  id: string;
  employee_id: string;
  tuan: Tuan;
  cong_viec: string;
  khu_vuc_line: string;
  thoi_gian_huong_dan: string;
  sup_note: string;
  created_at: string;
  updated_at: string;
}

export type DungCongViec = "dung_100" | "doi_viec_khac" | "khong_ro";
export type MucDoHuongDan = "tan_tinh" | "it" | "khong_duoc";
export type KhoiLuongCongViec = "qua_tai" | "vua_suc" | "nhe_nhang";
export type KhaNangTiepThu = "nhanh" | "can_nhac_lai" | "kho_tiep_thu";

export interface SupEvaluation {
  id: string;
  employee_id: string;
  sup_id: string;
  tuan: Tuan;
  ngay: string; // ISO date, evaluation is saved per-day
  dung_cong_viec: DungCongViec;
  kha_nang_tiep_thu: KhaNangTiepThu;
  khoi_luong_cong_viec: KhoiLuongCongViec; // theo quan sát của Sup, độc lập với tự đánh giá của NV
  danh_gia_sao: number; // 1-5, Sup đánh giá thái độ & hiệu suất của NV
  // Giữ lại để tương thích cột NOT NULL cũ trong SQLite — luôn suy ra từ
  // dung_cong_viec (= true khi "dung_100"), không còn nhập trực tiếp qua UI.
  lam_dung_cong_viec: boolean;
  noi_dung: string;
  van_de_phat_sinh: string;
  anh_urls: string[];
  created_at: string;
}

export interface SelfEvaluation {
  id: string;
  employee_id: string;
  tuan: Tuan;
  ngay: string; // ISO date
  dung_cong_viec: DungCongViec;
  muc_do_huong_dan: MucDoHuongDan;
  khoi_luong_cong_viec: KhoiLuongCongViec;
  danh_gia_sao: number; // 1-5
  chia_se_cai_thien: string;
  anh_urls: string[];
  created_at: string;
}

export interface DB {
  admin_users: AdminUser[];
  sup_users: SupUser[];
  hrbp_users: HrbpUser[];
  employees: Employee[];
  assignments: Assignment[];
  sup_evaluations: SupEvaluation[];
  self_evaluations: SelfEvaluation[];
}

export interface SessionData {
  role: Role;
  id: string;
  ho_ten: string;
  ma_nv: string;
}
