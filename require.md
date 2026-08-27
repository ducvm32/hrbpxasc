# require.md — Web App "Gắn Nhân Viên & Đánh Giá Onboarding 3 Tuần" (GHN)

> File này là bản đặc tả (spec) để Claude Code xây dựng ứng dụng. Đọc kỹ toàn bộ trước khi code. Mọi thuật ngữ tiếng Việt giữ nguyên (Ca, Sup, HRBP, Inout, Sort...).

---

## 0. Tóm tắt 1 dòng
Xây web app cho **HR (HRBP) – Quản lý (Sup) – Nhân viên mới** dùng để: gắn nhân viên mới vào từng Sup, phân công người kèm cặp / khu vực / công việc, và **đánh giá khối lượng công việc trong 3 tuần đầu**, gắn với **KPI giữ người 14 ngày**.

---

## 1. Mục tiêu nghiệp vụ
- Đánh giá khối lượng công việc của NV mới trong **3 tuần đầu**, phục vụ **KPI giữ người 14 ngày** (áp dụng riêng cho **Ca 3 Inout, Ca 4 Inout, Sort Ca 3 Inout**).
- Cho phép **Sup tự nhận (kéo/gắn) nhân viên mới đúng ca của mình** để đánh giá từng người.
- Sup chọn **người trực tiếp hướng dẫn** cho từng NV.
- Đánh giá kéo dài **3 tuần**. **Mỗi tuần chỉ mở đúng 1 đợt đánh giá mới** (Tuần 1 → Tuần 2 → Tuần 3), không cho đánh giá trước hạn.
- Cuối ca / cuối tuần **tự động mở form đánh giá** cho từng ứng viên.
- Hệ thống **lưu dữ liệu theo từng ngày**.

---

## 2. Vai trò & phân quyền

### 2.1 HRBP (Admin chính)
- Xem **toàn bộ** hệ thống & báo cáo, **xuất file Excel**.
- **Thêm nhân viên mới** (xem mục 6.1).
- **Gắn NV cho Sup thay** trong trường hợp Sup chưa gắn (hỗ trợ).
- Xem được đánh giá của nhân viên.

### 2.2 Sup (Quản lý)
**Trước khi NV bắt đầu làm việc:**
- Xác nhận NV thuộc team/ca của mình (nhận NV từ pool → gắn vào team).
- Chọn **người trực tiếp hướng dẫn**.
- Phân công **khu vực / line** làm việc.
- Chọn **công việc** NV thực hiện (dropdown theo Inout/Sort — mục 5).
- Thiết lập **thời gian hướng dẫn** theo Tuần 1/2/3.
- Xác nhận **rule chung** áp dụng cho NV mới.
- **KHÔNG xem được đánh giá của nhân viên.**

**Trong quá trình làm việc:**
- Xem danh sách NV mới được phân công.
- **Đánh giá NV cuối mỗi ca / cuối tuần** (form riêng của Sup).
- Ghi nhận NV có thực hiện đúng công việc được phân công hay không.
- Ghi nhận vấn đề phát sinh.
- **Upload hình ảnh** khi cần xác nhận thực tế.

### 2.3 Nhân viên mới
- Xem **lịch làm việc**.
- Xem **Sup / người hướng dẫn**.
- Xem **khu vực / line** được phân công.
- Xem **công việc** được hướng dẫn.
- **Tự đánh giá cuối ca / cuối tuần** (mình có được làm đúng việc Sup gắn không, có được hướng dẫn cụ thể không).
- Ghi nhận vấn đề trong quá trình làm việc.
- Xác nhận **thực tế** mình có làm đúng công việc/khu vực được phân công hay không.
- **Upload hình ảnh / bằng chứng** nếu cần.
- **KHÔNG xem** đánh giá của Sup và thông tin của NV khác.

### 2.4 Ma trận phân quyền (nguồn chuẩn — implement đúng bảng này)

| Tính năng / Màn hình | HRBP (Admin) | Sup (Quản lý) | Nhân viên mới |
|---|---|---|---|
| Xem toàn bộ dữ liệu & Báo cáo (xuất Excel) | Toàn quyền | Chỉ xem team mình | Không |
| Gắn Sup / Nhân viên | Có (hỗ trợ) | Có (tự nhận NV) | Không |
| Phân công việc / Người HD / Line | Không | Có | Không |
| Đánh giá cuối ca (Form riêng) | Không | Có | Có (tự đánh giá) |
| Xem đánh giá của NV | Có | **Không** | Không |
| Xem lịch / Nhiệm vụ trong ngày | Có | Có | Có |

---

## 3. Quy trình tổng thể (flow)

```
NV nhận việc
   ↓
Sup nhận (kéo) NV đúng ca mình phụ trách để gắn vào team
   (HRBP set NV mới theo ca; Sup đăng nhập kéo NV đúng ca của mình về)
   ↓
Sup phân công người trực tiếp hướng dẫn
   ↓
Sup thiết lập: khu vực / line / công việc / thời gian hướng dẫn theo Tuần 1/2/3
   (chọn công việc từ dropdown Inout hoặc Sort — mục 5)
   ↓
NV thực hiện công việc
   ↓
Cuối mỗi tuần: Sup đánh giá NV
   +  Cuối mỗi tuần/ngày: NV tự đánh giá (đã làm đúng việc Sup gắn chưa,
      có được hướng dẫn cụ thể không)
   ↓
Hệ thống lưu dữ liệu theo từng ngày
   (Sup có thể gắn công việc theo cả tuần cho NV)
```

**Cơ chế gắn NV (drag & drop):** Khi NV chọn ca, trong khu vực đánh giá của Sup **có ca trùng khớp** sẽ hiển thị tên NV để Sup **kéo về gắn vào mình**.
> VD: Trần Văn Tuấn là Sup **Ca 3 Inout** → dashboard của Tuấn hiển thị các NV mới **Ca 3 Inout** vừa nhận việc để kéo về gắn.

---

## 4. Danh sách Ca làm việc (dropdown khi HRBP thêm NV)
- Ca 1 Inout
- Ca 2 Inout
- Ca 3 Inout
- Ca gãy 19h – 24h
- Ca 5 Inout
- Ca 1 Sort
- Ca 2 Sort
- Ca 3 Sort

> Lưu ý: KPI giữ người 14 ngày áp dụng riêng cho **Ca 3 Inout, Ca 4 Inout, Sort Ca 3 Inout** (đánh dấu/flag các NV thuộc nhóm ca này trong báo cáo).

---

## 5. Danh mục công việc (dropdown khi Sup phân công)

### 5.1 Nhóm INOUT
- **Nhập hàng:** Bốc dỡ hàng hóa từ xe tải xuống băng chuyền và bắn mã đơn hàng (thực hiện xoay vòng theo nhóm).
- **Xuất hàng:** Bốc dỡ hàng từ băng chuyền lên xe và bắn mã hàng. Kéo bao hàng từ máng tải về đúng vị trí xe xuất dựa theo mã/màu tem dán hoặc màu seal bao (thực hiện xoay vòng theo nhóm).
- **Phân hàng cồng kềnh:** Kiểm tra mã vận đơn và di chuyển hàng về đúng ô pallet theo số thứ tự tương ứng.
- **Line 3/5:** Nhặt hàng từ máng tải xuống và sắp xếp gọn gàng tại khu vực (layout) chờ xuất.
- **Wheel - Sorter:** Thu gom hàng từ băng tải đổ xuống máng, phân loại vào lồng theo đúng mã và kéo về layout chờ xuất.
- **Vận hành xe nâng tay:** Kéo hàng cồng kềnh chưa phân loại về khu vực xử lý; di chuyển hàng đã phân loại hoàn tất về layout chờ xuất.
- **Sup note thêm nếu có:** (ô text tự do)

### 5.2 Nhóm SORT
- **Feeder (Rã kiện tự động):** Đưa hàng đúng quy chuẩn qua bàn cấp đơn.
- **Chute (Đóng kiện tự động):** Hàng tự động rơi xuống đúng ô theo mã vận đơn. Lấy phiếu in dán vào bao, dùng PDA scan mã bao và bắn mã ô (đèn xanh = gắn thành công). Khi bao đầy: ấn nút đèn khóa ô → seal cột bao → dán phiếu lên seal → đẩy bao ra băng tải, gắn bao mới.
- **Đóng kiện manual:** Dùng PDA scan/bắn mã để đóng kiện thủ công.
- **Rã kiện manual:** Dùng PDA scan mã hàng (xử lý hàng dạng tròn, lăn... không đưa lên bàn cấp đơn được).
- **Đổ bao:** Dùng kìm cắt seal, đổ toàn bộ hàng xuống máng; lộn ngược bao kiểm tra không sót đơn, xếp gọn bao bỏ vào túi thu gom.
- **Sup note thêm nếu có:** (ô text tự do)

> Rule hiển thị: NV thuộc ca **Inout** → dropdown công việc chỉ hiện nhóm 5.1; NV thuộc ca **Sort** → chỉ hiện nhóm 5.2.

---

## 6. Đăng nhập & tạo tài khoản

### 6.1 HRBP thêm NV mới (form)
Trường nhập:
- **Họ tên**
- **Mã NV**
- **Ca làm việc** (dropdown — mục 4)
- **Ngày nhận việc** (set theo lịch ngày hôm đó, mặc định = hôm nay)
- **Giai đoạn đánh giá theo tuần** (mặc định = **Tuần 1**)

### 6.2 Màn đăng nhập
- Có **toggle 2 chế độ**: **Nhân Viên** / **Quản Trị (Sup / HRBP)** — theo mockup.
- **Nhân viên:** chỉ cần gõ đúng **mã nhân viên** là vào được. Chỉ xem các trường cơ bản: họ tên, kiểm tra mã NV đúng chưa, và phần đánh giá công việc của chính mình.
- **Quản lý (Sup/HRBP):** đăng nhập bằng **email được cấp có đuôi `@ghn.vn` + liên kết SSO**. Có đầy đủ quyền theo ma trận mục 2.4.

---

## 7. Danh sách Sup & Ca phụ trách (seed data)

| Mã NV Sup | Tên Sup | Ca phụ trách | Email GHN |
|---|---|---|---|
| 3153864 | Nguyễn Hà Kiên | Ca 2 Inout / Ca gãy 19h–24h | kiennh@ghn.vn |
| 3128923 | Lâm Nguyễn Thành Long | Ca 1 Sort | longlnt@ghn.vn |
| 3111663 | Bùi Hữu Đức | Ca 3 Sort | ducbh@ghn.vn |
| 3096064 | Nguyễn Thúy Ngọc | Ca 5 Inout | ngocnt@ghn.vn |
| 3088412 | Trương Ngọc Sơn | Ca 3 Sort | sontn1@ghn.vn |
| 3076487 | Trần Văn Kiểu | Ca 2 Sort | kieutv@ghn.vn |
| 3072857 | Nguyễn Minh Thiện | Ca 3 Inout | thiennm@ghn.vn |
| 3060896 | Nguyễn Chí Thanh | Ca 2 Inout | thanhnc@ghn.vn |
| 3048962 | Trần Thị Hồng Phượng | Ca 1 Inout | phuongtth@ghn.vn |
| 3048823 | Bùi Thanh Ngân | Ca 5 Inout | nganbt@ghn.vn |
| 3048450 | Lâm Quốc Hùng | Ca 1 Inout | hunglq1@ghn.vn |
| 3039543 | Trương Anh Tuấn | Ca 1 Inout | tuanta@ghn.vn |
| 3022905 | Trần Thị Thu Sương | Ca 2 Sort | suongttt@ghn.vn |
| 3018838 | Nguyễn Huỳnh Minh Thư | Ca 3 Sort | thunhm@ghn.vn |
| 2203122 | Nguyễn Trương Thanh Tiến | Ca 1 Sort | tienntt@ghn.vn |
| 2033453 | Phan Trọng Nhân | Ca 3 Inout | nhanpt@ghn.vn |
| 1873783 | Nguyễn Tấn Khanh | Ca 1 Inout | khanhnt1@ghn.vn |
| 1871558 | Trịnh Hữu Nghị | Ca 2 Inout / Ca gãy 19h–24h | nghith@ghn.vn |
| 1710577 | Trần Thị Bích Đông | Ca 1 Sort | dongttb@ghn.vn |

---

## 8. Yêu cầu màn hình (theo mockup)

### 8.1 Màn đăng nhập
- Logo/brand **GiaoHangNhanh** (icon xe tải, tông cam #F26522).
- Tiêu đề: "Đăng nhập hệ thống quản lý lịch OFF" (giữ nguyên style mockup, có thể đổi thành tên app).
- Toggle **Nhân Viên | Quản Trị**.
- Ô **Tài khoản** + ô **Mật khẩu** (chế độ Quản Trị); chế độ Nhân Viên chỉ cần **Mã NV**.
- Nút **Đăng Nhập** (nền cam).

### 8.2 Dashboard Sup (màn chính sau đăng nhập)
- Header: lời chào **"Xin chào, {Tên Sup}"** + phụ đề "Quản lý nhận việc, phân công người hướng dẫn, giao việc theo ngày/tuần và đánh giá cuối ca."
- Góc phải: tên Sup + badge vai trò **"Supervisor (Team {ca})"** + nút đăng xuất; badge **"KPI Giữ Người"**.
- 3 **thẻ thống kê**:
  - **Nhân viên trong team** (vd: 3 Bạn)
  - **NV mới chờ nhận (POOL)** (vd: 1 Bạn) — highlight cam
  - **Đã đánh giá cuối ca** (vd: 0 / 3)
- **Banner cảnh báo** khi có NV mới cần nhận: "Có nhân viên mới vừa nhận việc cần Sup phụ trách — bấm nhận ngay để đưa vào team và phân công người kèm cặp 14 ngày." + nút **"Nhận {Tên} ({Mã NV} – {Ca})"**.
- **2 tab:**
  1. **Danh sách & Phân công 14 ngày** — bảng NV trong team, kéo/nhận NV từ pool, gán người HD/line/công việc/thời gian theo Tuần 1/2/3.
  2. **Form đánh giá cuối ca của Sup** — form đánh giá từng NV (chỉ mở đúng theo tuần hiện tại).

### 8.3 Màn Nhân viên
- Xem lịch, Sup/người HD, khu vực/line, công việc được giao.
- Form **tự đánh giá** (mở theo tuần), ô ghi vấn đề, xác nhận thực tế có làm đúng không, upload ảnh.

### 8.4 Màn HRBP
- Form thêm NV (mục 6.1), danh sách toàn bộ NV & Sup, gắn NV thay cho Sup, xem đánh giá, **xuất Excel**.

---

## 9. Mô hình dữ liệu (đề xuất)

- **users**: id, ho_ten, ma_nv, role (`hrbp` | `sup` | `nhanvien`), email (nullable, cho sup/hrbp), ca (nullable).
- **employees** (NV mới): id, ho_ten, ma_nv, ca, ngay_nhan_viec, sup_id (nullable = còn trong pool), nguoi_huong_dan, khu_vuc_line, tuan_hien_tai (1|2|3), la_kpi_14ngay (bool).
- **assignments**: id, employee_id, tuan (1|2|3), cong_viec (enum theo mục 5), khu_vuc_line, thoi_gian_huong_dan, sup_note.
- **sup_evaluations**: id, employee_id, sup_id, tuan, ngay, lam_dung_cong_viec (bool), noi_dung, van_de_phat_sinh, anh_url[], created_at.
- **self_evaluations** (NV tự đánh giá): id, employee_id, tuan, ngay, duoc_lam_dung_viec (bool), duoc_huong_dan_cu_the (bool), van_de, xac_nhan_thuc_te (bool), anh_url[], created_at.
- **audit/daily_logs**: lưu dữ liệu theo từng ngày.

> **Quy tắc mở tuần:** field đánh giá của Tuần N chỉ mở khi đã tới mốc tuần tương ứng tính từ `ngay_nhan_viec` (Tuần 1: ngày 1–7, Tuần 2: 8–14, Tuần 3: 15–21). Trước hạn thì disable form.

> **Quy tắc bảo mật quyền xem:** enforce ở backend (RLS/policy) — Sup không được đọc bảng `self_evaluations`; NV không đọc `sup_evaluations` và dữ liệu NV khác.

---

## 10. Gợi ý kỹ thuật (không bắt buộc, nhưng khuyến nghị)
- **Frontend:** Next.js (App Router) + TailwindCSS, tông màu cam GHN (#F26522).
- **Backend/DB/Auth:** Supabase (Postgres + Row Level Security + Storage cho ảnh upload). SSO email `@ghn.vn` cho Sup/HRBP; NV đăng nhập bằng mã (custom check).
- **Drag & drop** gắn NV: dùng thư viện dnd (vd @dnd-kit) — kéo NV từ POOL vào team của Sup.
- **Xuất Excel:** SheetJS (xlsx).
- **Deploy:** Vercel.

---

## 11. Tiêu chí hoàn thành (checklist)
- [ ] Đăng nhập 3 vai trò đúng cơ chế (NV = mã; Sup/HRBP = email @ghn.vn + SSO).
- [ ] HRBP thêm NV mới với đủ 5 trường (mục 6.1).
- [ ] NV mới xuất hiện trong **POOL** đúng ca; Sup cùng ca **kéo/nhận** được về team.
- [ ] Sup gán người HD + khu vực/line + công việc (dropdown lọc đúng Inout/Sort) + thời gian theo Tuần 1/2/3.
- [ ] Form đánh giá **mở đúng theo tuần**, không cho đánh giá trước hạn.
- [ ] Sup đánh giá + NV tự đánh giá, có upload ảnh.
- [ ] Enforce ma trận quyền (mục 2.4), đặc biệt Sup **không** xem được đánh giá của NV.
- [ ] Lưu dữ liệu theo ngày; HRBP xuất được Excel.
- [ ] Flag & báo cáo riêng nhóm KPI giữ người 14 ngày (Ca 3 Inout, Ca 4 Inout, Sort Ca 3 Inout).
- [ ] Giao diện bám theo 2 mockup (màn đăng nhập + dashboard Sup).
