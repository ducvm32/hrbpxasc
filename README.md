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

Copy `.env.example` thành `.env` rồi điền các biến môi trường (khóa session,
cấu hình Google OAuth — xem mục "Đăng nhập Admin/Sup/HRBP qua Google" bên dưới).

## Đăng nhập Admin/Sup/HRBP qua Google

Admin, Sup và HRBP đăng nhập bằng **Google OAuth 2.0 / OpenID Connect**, giới
hạn tài khoản Google Workspace domain `@ghn.vn` (nhân viên không có email công
ty nên vẫn giữ đăng nhập riêng bằng Mã NV, không đổi). Code tích hợp nằm ở:

- `lib/google-oauth.ts` — build authorization URL (kèm `hd=ghn.vn`), đổi code
  lấy token, verify `id_token` (JWKS, RS256) bằng `crypto` sẵn có của Node —
  kiểm tra `iss`/`aud`/`exp`/`nonce`, và bắt buộc `email_verified=true` +
  `hd=ghn.vn` (param `hd` khi redirect chỉ là gợi ý UI, không có giá trị bảo
  mật nên vẫn phải verify lại claim `hd` từ id_token đã ký).
- `app/api/auth/google/login/route.ts` — khởi tạo `state`/`nonce`, redirect
  sang Google.
- `app/api/auth/google/callback/route.ts` — nhận `code`, verify token, đối
  chiếu **email** trả về với `email` trong `admin_users`/`hrbp_users`/
  `sup_users` để suy ra vai trò và tạo session nội bộ (thứ tự ưu tiên: admin
  → hrbp → sup).

Cần tạo OAuth client trên [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
(loại "Web application"), rồi đặt các biến môi trường sau (xem `.env.example`):

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<domain-app-cua-ban>/api/auth/google/callback
GOOGLE_HD_DOMAIN=ghn.vn
```

`GOOGLE_REDIRECT_URI` phải khớp **chính xác** với Authorized redirect URI đã
khai báo trên Google Cloud (Google cho phép `http://localhost:PORT/...` khi
test cục bộ, không cần HTTPS).

Một tài khoản Google chỉ đăng nhập được nếu email đã tồn tại trong bảng
`admin_users`, `hrbp_users` hoặc `sup_users` — Admin thêm/xoá Sup/HRBP qua
trang Admin (tab quản lý tài khoản). Mật khẩu lưu cho các tài khoản này không
còn dùng để đăng nhập, chỉ còn là cột bắt buộc cũ trong schema.

## Tài khoản demo

**Nhân viên mới:** đăng nhập chỉ bằng **Mã NV** — do HRBP tạo ở màn HRBP (tab
"Nhân viên").

**Admin / Sup / HRBP:** đăng nhập qua Google (mục trên), dùng đúng email
`@ghn.vn` đã được thêm vào `admin_users`/`hrbp_users`/`sup_users` (xem bảng
seed ở mục 7 của `require.md` cho danh sách Sup mẫu, ví dụ `thiennm@ghn.vn` —
Nguyễn Minh Thiện, Ca 3 Inout). Không còn mật khẩu demo cho 3 vai trò này.

## Luồng sử dụng nhanh để test

1. Đăng nhập HRBP (qua Google) → tab "Nhân viên" → thêm 1 nhân viên
   mới với Ca ví dụ `Ca 3 Inout`.
2. Đăng xuất, đăng nhập 1 Sup phụ trách đúng ca đó qua Google → nhân viên đã
   tự động xuất hiện trong bảng team (mọi Sup phụ trách `Ca 3 Inout` đều thấy
   chung, không cần "Nhận" riêng).
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
- **Team của Sup = theo Ca, không theo claim riêng:** NV thuộc Ca nào thì mọi
  Sup có `ca_phu_trach` chứa Ca đó đều thấy và có quyền phân công/đánh giá
  chung — không còn khái niệm 1 Sup "nhận" (claim) riêng 1 NV như trước
  (`getTeamForSup`/`getSupsForCa` trong `lib/queries.ts`).
- **Upload ảnh:** lưu vào `public/uploads` (volume riêng khi chạy Docker).

## Chạy dev không qua Docker (tuỳ chọn)

```bash
npm install
npm run dev
```
