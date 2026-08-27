# GHN Onboarding — Gắn Nhân Viên & Đánh Giá 3 Tuần

Web app quản lý gắn nhân viên mới vào Sup, phân công người kèm cặp/khu vực/công việc,
và đánh giá onboarding trong 3 tuần đầu (gắn KPI giữ người 14 ngày), theo đặc tả trong
`require.md`.

## Chạy bằng Docker (môi trường tách biệt hoàn toàn)

```bash
docker compose up -d --build
```

Ứng dụng chạy tại http://localhost:3000

Dữ liệu (SQLite, `data/app.db`) và ảnh upload được lưu trong 2 Docker volume
riêng (`ghn_data`, `ghn_uploads`) nên vẫn còn nguyên khi container được
build/khởi động lại. Muốn xoá sạch để làm lại từ đầu:

```bash
docker compose down -v
```

Có thể đổi khóa ký session bằng biến môi trường trong file `.env`:

```
SESSION_SECRET=mot-chuoi-bi-mat-cua-ban
```

## Tài khoản demo

**Nhân viên mới:** đăng nhập chỉ bằng **Mã NV** — do HRBP tạo ở màn HRBP (tab
"Nhân viên & Gắn Sup").

**Sup / HRBP:** đăng nhập bằng email `@ghn.vn` + mật khẩu demo:

```
Mật khẩu: ghn@2026
```

- HRBP: `hrbp@ghn.vn`
- Sup: bất kỳ email nào trong bảng seed ở mục 7 của `require.md`, ví dụ
  `thiennm@ghn.vn` (Nguyễn Minh Thiện — Ca 3 Inout).

> Đây là bước xác thực demo thay cho SSO thật của GHN. Khi tích hợp SSO thực tế
> (Azure AD / Google Workspace...), chỉ cần thay `loginAdminAction` trong
> `lib/actions.ts` bằng luồng OAuth tương ứng — phần còn lại của hệ thống (session,
> phân quyền theo vai trò) giữ nguyên.

## Luồng sử dụng nhanh để test

1. Đăng nhập HRBP (`hrbp@ghn.vn`) → tab "Nhân viên & Gắn Sup" → thêm 1 nhân viên
   mới với Ca ví dụ `Ca 3 Inout`.
2. Đăng xuất, đăng nhập Sup phụ trách đúng ca đó (`thiennm@ghn.vn` hoặc
   `nhanpt@ghn.vn`) → nhân viên xuất hiện ở banner/POOL → bấm "Nhận" (hoặc kéo thả
   vào bảng team) để gắn vào team.
3. Ở tab "Danh sách & Phân công 14 ngày", bấm "Phân công" để chọn người hướng dẫn,
   khu vực/line, công việc (dropdown lọc theo Inout/Sort) và thời gian hướng dẫn
   cho từng tuần.
4. Ở tab "Form đánh giá cuối ca", Sup đánh giá nhân viên — form chỉ mở đúng theo
   tuần hiện tại tính từ ngày nhận việc (không cho đánh giá trước hạn).
5. Đăng nhập bằng Mã NV vừa tạo để xem lịch/phân công và tự đánh giá (form tương
   tự, độc lập tiến trình với đánh giá của Sup).
6. Đăng nhập lại HRBP → tab "Đánh giá" xem toàn bộ đánh giá của Sup và tự đánh giá
   của NV; bấm "Xuất Excel" ở góc phải để tải báo cáo `.xlsx`.

## Ghi chú kỹ thuật & giả định

- **Lưu trữ:** dùng SQLite (`better-sqlite3`, file `data/app.db`, chế độ WAL)
  thay cho Supabase/Postgres để chạy độc lập, không cần tài khoản cloud hay
  service DB riêng. Toàn bộ record đánh giá đều có trường `ngay` (ISO date) nên
  đã thỏa yêu cầu "lưu dữ liệu theo từng ngày". `lib/db.ts` vẫn giữ nguyên
  interface `readDB()`/`mutateDB()` mà `lib/queries.ts`/`lib/actions.ts` dùng —
  mỗi `mutateDB()` đọc toàn bộ bảng vào object JS, cho callback chỉnh sửa như
  cũ, rồi ghi đè lại toàn bộ vào SQLite trong 1 transaction (atomic, không còn
  rủi ro file bị hỏng giữa chừng như file JSON trước đây). Lần chạy đầu sau khi
  nâng cấp sẽ tự động import `data/db.json` cũ (nếu có) sang SQLite rồi đổi tên
  file cũ thành `db.json.migrated`. Muốn chuyển sang Postgres/Supabase thật, chỉ
  cần viết lại `lib/db.ts` (đổi driver + schema), phần còn lại của app không
  đổi. Muốn xem trực tiếp dữ liệu: `sqlite3 data/app.db` hoặc bất kỳ tool DB
  GUI nào hỗ trợ SQLite.
- **Phân quyền:** enforce ở server actions (`lib/actions.ts`) — Sup không đọc
  được `self_evaluations`, NV không đọc được `sup_evaluations` hay dữ liệu NV
  khác (mỗi trang chỉ truy vấn đúng phạm vi theo `session.role`/`session.id`).
- **KPI giữ người 14 ngày:** áp dụng cho `Ca 3 Inout`, `Ca 4 Inout`, `Ca 3 Sort`
  (mục 4 của spec ghi "Sort Ca 3 Inout" — hiểu là Ca 3 Sort; `Ca 4 Inout` không
  có trong danh sách dropdown ca ở mục 4, nếu đây là ca thực tế còn thiếu, thêm
  vào `CA_LIST` trong `lib/constants.ts`).
- **Mở tuần đánh giá:** Tuần 1 = ngày 1–7, Tuần 2 = ngày 8–14, Tuần 3 = ngày
  15–21 tính từ `ngay_nhan_viec`; đồng thời chỉ cho mở tuần kế tiếp sau khi tuần
  trước đã có đánh giá (Tuần 1 → 2 → 3), không nhảy cóc. Sup và NV có tiến trình
  đánh giá độc lập nhau (`lib/week.ts`).
- **Kéo thả:** dùng `@dnd-kit/core` để kéo NV từ POOL vào bảng team của Sup; có
  kèm nút "Nhận" để thao tác nhanh/không cần chuột kéo thả.
- **Upload ảnh:** lưu vào `public/uploads` (volume riêng khi chạy Docker).

## Chạy dev không qua Docker (tuỳ chọn)

```bash
npm install
npm run dev
```
