import type {
  AdminUser,
  DungCongViec,
  HrbpUser,
  KhaNangTiepThu,
  KhoiLuongCongViec,
  MucDoHuongDan,
  SupUser,
} from "./types";

type RawSup = SupUser;
type RawHrbp = HrbpUser;
type RawAdmin = AdminUser;

// Mục 4 — Danh sách Ca làm việc
export const CA_GAY = "Ca gãy 19h – 24h";
export const CA_LIST = [
  "Ca 1 Inout",
  "Ca 2 Inout",
  "Ca 3 Inout",
  CA_GAY,
  "Ca 5 Inout",
  "Ca 1 Sort",
  "Ca 2 Sort",
  "Ca 3 Sort",
] as const;

// Ca thuộc nhóm KPI giữ người 14 ngày (mục 4, ghi chú cuối)
export const KPI_CA_LIST = ["Ca 3 Inout", "Ca 4 Inout", "Ca 3 Sort"];

export function isKpiCa(ca: string): boolean {
  return KPI_CA_LIST.includes(ca);
}

export function isSortCa(ca: string): boolean {
  return ca.includes("Sort");
}

export function isInoutCa(ca: string): boolean {
  return ca.includes("Inout") || ca === CA_GAY;
}

// Mục 5.1 — Nhóm INOUT
export const INOUT_JOBS = [
  {
    value: "Nhập hàng",
    mota:
      "Bốc dỡ hàng hóa từ xe tải xuống băng chuyền và bắn mã đơn hàng (thực hiện xoay vòng theo nhóm).",
  },
  {
    value: "Xuất hàng",
    mota:
      "Bốc dỡ hàng từ băng chuyền lên xe và bắn mã hàng. Kéo bao hàng từ máng tải về đúng vị trí xe xuất dựa theo mã/màu tem dán hoặc màu seal bao (thực hiện xoay vòng theo nhóm).",
  },
  {
    value: "Phân hàng cồng kềnh",
    mota: "Kiểm tra mã vận đơn và di chuyển hàng về đúng ô pallet theo số thứ tự tương ứng.",
  },
  {
    value: "Line 3/5",
    mota: "Nhặt hàng từ máng tải xuống và sắp xếp gọn gàng tại khu vực (layout) chờ xuất.",
  },
  {
    value: "Wheel - Sorter",
    mota:
      "Thu gom hàng từ băng tải đổ xuống máng, phân loại vào lồng theo đúng mã và kéo về layout chờ xuất.",
  },
  {
    value: "Vận hành xe nâng tay",
    mota:
      "Kéo hàng cồng kềnh chưa phân loại về khu vực xử lý; di chuyển hàng đã phân loại hoàn tất về layout chờ xuất.",
  },
] as const;

// Mục 5.2 — Nhóm SORT
export const SORT_JOBS = [
  {
    value: "Feeder (Rã kiện tự động)",
    mota: "Đưa hàng đúng quy chuẩn qua bàn cấp đơn.",
  },
  {
    value: "Chute (Đóng kiện tự động)",
    mota:
      "Hàng tự động rơi xuống đúng ô theo mã vận đơn. Lấy phiếu in dán vào bao, dùng máy PDA scan mã bao và bắn mã ô (máy báo đèn xanh là gắn thành công). Khi bao đầy (đèn báo hiệu): Ấn nút đèn để khóa ô → dùng seal cột bao → dán phiếu lên seal → đẩy bao ra băng tải và gắn bao mới.",
  },
  {
    value: "Đóng kiện manual",
    mota: "Sử dụng máy PDA scan/bắn mã để thực hiện đóng kiện thủ công.",
  },
  {
    value: "Rã kiện manual",
    mota:
      "Sử dụng máy PDA scan mã hàng (thường dùng để xử lý hàng dạng tròn, lăn... không đưa lên bàn cấp đơn được).",
  },
  {
    value: "Đổ bao",
    mota:
      "Dùng kìm cắt seal bao, đổ toàn bộ hàng xuống máng chứa; lộn ngược bao kiểm tra không để sót đơn, sau đó xếp gọn bao bỏ vào túi thu gom.",
  },
] as const;

export function jobsForCa(ca: string) {
  return isSortCa(ca) ? SORT_JOBS : INOUT_JOBS;
}

/** Mô tả chi tiết của 1 công việc cụ thể, tra theo đúng nhóm Inout/Sort của ca. */
export function jobMota(ca: string, congViec: string): string | null {
  return jobsForCa(ca).find((j) => j.value === congViec)?.mota ?? null;
}

// Mục 7 — Danh sách Sup & Ca phụ trách (seed data).
export const SEED_SUP_USERS: RawSup[] = [
  { id: "3153864", ho_ten: "Nguyễn Hà Kiên", ma_nv: "3153864", email: "kiennh@ghn.vn", ca_phu_trach: ["Ca 2 Inout", CA_GAY] },
  { id: "3128923", ho_ten: "Lâm Nguyễn Thành Long", ma_nv: "3128923", email: "longlnt@ghn.vn", ca_phu_trach: ["Ca 1 Sort"] },
  { id: "3111663", ho_ten: "Bùi Hữu Đức", ma_nv: "3111663", email: "ducbh@ghn.vn", ca_phu_trach: ["Ca 3 Sort"] },
  { id: "3096064", ho_ten: "Nguyễn Thúy Ngọc", ma_nv: "3096064", email: "ngocnt@ghn.vn", ca_phu_trach: ["Ca 5 Inout"] },
  { id: "3088412", ho_ten: "Trương Ngọc Sơn", ma_nv: "3088412", email: "sontn1@ghn.vn", ca_phu_trach: ["Ca 3 Sort"] },
  { id: "3076487", ho_ten: "Trần Văn Kiểu", ma_nv: "3076487", email: "kieutv@ghn.vn", ca_phu_trach: ["Ca 2 Sort"] },
  { id: "3072857", ho_ten: "Nguyễn Minh Thiện", ma_nv: "3072857", email: "thiennm@ghn.vn", ca_phu_trach: ["Ca 3 Inout"] },
  { id: "3060896", ho_ten: "Nguyễn Chí Thanh", ma_nv: "3060896", email: "thanhnc@ghn.vn", ca_phu_trach: ["Ca 2 Inout"] },
  { id: "3048962", ho_ten: "Trần Thị Hồng Phượng", ma_nv: "3048962", email: "phuongtth@ghn.vn", ca_phu_trach: ["Ca 1 Inout"] },
  { id: "3048823", ho_ten: "Bùi Thanh Ngân", ma_nv: "3048823", email: "nganbt@ghn.vn", ca_phu_trach: ["Ca 5 Inout"] },
  { id: "3048450", ho_ten: "Lâm Quốc Hùng", ma_nv: "3048450", email: "hunglq1@ghn.vn", ca_phu_trach: ["Ca 1 Inout"] },
  { id: "3039543", ho_ten: "Trương Anh Tuấn", ma_nv: "3039543", email: "tuanta@ghn.vn", ca_phu_trach: ["Ca 1 Inout"] },
  { id: "3022905", ho_ten: "Trần Thị Thu Sương", ma_nv: "3022905", email: "suongttt@ghn.vn", ca_phu_trach: ["Ca 2 Sort"] },
  { id: "3018838", ho_ten: "Nguyễn Huỳnh Minh Thư", ma_nv: "3018838", email: "thunhm@ghn.vn", ca_phu_trach: ["Ca 3 Sort"] },
  { id: "2203122", ho_ten: "Nguyễn Trương Thanh Tiến", ma_nv: "2203122", email: "tienntt@ghn.vn", ca_phu_trach: ["Ca 1 Sort"] },
  { id: "2033453", ho_ten: "Phan Trọng Nhân", ma_nv: "2033453", email: "nhanpt@ghn.vn", ca_phu_trach: ["Ca 3 Inout"] },
  { id: "1873783", ho_ten: "Nguyễn Tấn Khanh", ma_nv: "1873783", email: "khanhnt1@ghn.vn", ca_phu_trach: ["Ca 1 Inout"] },
  { id: "1871558", ho_ten: "Trịnh Hữu Nghị", ma_nv: "1871558", email: "nghith@ghn.vn", ca_phu_trach: ["Ca 2 Inout", CA_GAY] },
  { id: "1710577", ho_ten: "Trần Thị Bích Đông", ma_nv: "1710577", email: "dongttb@ghn.vn", ca_phu_trach: ["Ca 1 Sort"] },
];

export const SEED_HRBP_USERS: RawHrbp[] = [
  { id: "HRBP001", ho_ten: "HR Business Partner", ma_nv: "HRBP001", email: "hrbp@ghn.vn" },
];

export const SEED_ADMIN_USERS: RawAdmin[] = [
  { id: "ADMIN001", ho_ten: "System Admin", email: "ducvm@ghn.vn" },
];

// Form tự đánh giá của nhân viên (câu 1-3, mỗi câu chọn 1 trong 3)
export const DUNG_CONG_VIEC_OPTIONS: { value: DungCongViec; label: string }[] = [
  { value: "dung_100", label: "Có, làm đúng 100% việc giao" },
  { value: "doi_viec_khac", label: "Bị đổi sang làm việc khác" },
  { value: "khong_ro", label: "Không rõ phải làm gì" },
];

export const MUC_DO_HUONG_DAN_OPTIONS: { value: MucDoHuongDan; label: string }[] = [
  { value: "tan_tinh", label: "Rất tận tình & sát sao" },
  { value: "it", label: "Có hướng dẫn nhưng ít" },
  { value: "khong_duoc", label: "Không được ai hướng dẫn" },
];

export const KHOI_LUONG_CONG_VIEC_OPTIONS: { value: KhoiLuongCongViec; label: string }[] = [
  { value: "qua_tai", label: "Quá nặng / Quá tải" },
  { value: "vua_suc", label: "Vừa sức" },
  { value: "nhe_nhang", label: "Nhẹ nhàng" },
];

export const DUNG_CONG_VIEC_LABEL: Record<DungCongViec, string> = Object.fromEntries(
  DUNG_CONG_VIEC_OPTIONS.map((o) => [o.value, o.label])
) as Record<DungCongViec, string>;

export const MUC_DO_HUONG_DAN_LABEL: Record<MucDoHuongDan, string> = Object.fromEntries(
  MUC_DO_HUONG_DAN_OPTIONS.map((o) => [o.value, o.label])
) as Record<MucDoHuongDan, string>;

export const KHOI_LUONG_CONG_VIEC_LABEL: Record<KhoiLuongCongViec, string> = Object.fromEntries(
  KHOI_LUONG_CONG_VIEC_OPTIONS.map((o) => [o.value, o.label])
) as Record<KhoiLuongCongViec, string>;

// Form đánh giá cuối ca của Sup (đánh giá về NV) — dùng chung enum DungCongViec
// với form tự đánh giá của NV để tiện đối chiếu chéo, nhưng đổi nhãn sang góc
// nhìn của Sup (ngôi thứ 3) thay vì ngôi thứ nhất.
export const DUNG_CONG_VIEC_SUP_OPTIONS: { value: DungCongViec; label: string }[] = [
  { value: "dung_100", label: "NV làm đúng 100% công việc/line được giao" },
  { value: "doi_viec_khac", label: "NV bị/tự đổi sang làm việc khác" },
  { value: "khong_ro", label: "NV chưa rõ/chưa nắm được việc phải làm" },
];

export const KHA_NANG_TIEP_THU_OPTIONS: { value: KhaNangTiepThu; label: string }[] = [
  { value: "nhanh", label: "Tiếp thu nhanh, thao tác tốt ngay" },
  { value: "can_nhac_lai", label: "Cần hướng dẫn/nhắc lại nhiều lần" },
  { value: "kho_tiep_thu", label: "Khó tiếp thu, chưa tự làm được" },
];

export const DUNG_CONG_VIEC_SUP_LABEL: Record<DungCongViec, string> = Object.fromEntries(
  DUNG_CONG_VIEC_SUP_OPTIONS.map((o) => [o.value, o.label])
) as Record<DungCongViec, string>;

export const KHA_NANG_TIEP_THU_LABEL: Record<KhaNangTiepThu, string> = Object.fromEntries(
  KHA_NANG_TIEP_THU_OPTIONS.map((o) => [o.value, o.label])
) as Record<KhaNangTiepThu, string>;
