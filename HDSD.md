# HDSD — Hướng Dẫn Sử Dụng App "Gắn Nhân Viên & Đánh Giá Onboarding 3 Tuần"

App dùng để: HRBP thêm nhân viên mới → Sup nhận nhân viên đúng ca của mình → Sup
phân công người kèm cặp/khu vực/công việc → theo dõi & đánh giá nhân viên trong
3 tuần đầu (phục vụ KPI giữ người 14 ngày).

Truy cập app tại: **http://localhost:3000** (hoặc địa chỉ do IT cung cấp nếu đã
deploy lên server/domain riêng).

---

## 1. Màn đăng nhập

Khi mở app, bạn sẽ thấy màn đăng nhập với 2 chế độ (toggle ở giữa):

| Chế độ | Dành cho | Cách đăng nhập |
|---|---|---|
| **Nhân Viên** | Nhân viên mới | Chỉ gõ **Mã NV**, không cần mật khẩu |
| **Quản Trị (Sup / HRBP)** | Sup, HRBP | Gõ **email @ghn.vn** + **mật khẩu** |

> Mật khẩu demo hiện tại cho toàn bộ tài khoản Sup/HRBP là `ghn@2026` (đây là
> bước xác thực tạm thời thay cho SSO thật của công ty).

Sau khi đăng nhập, app tự đưa bạn vào đúng màn hình theo vai trò — không cần
chọn thêm.

---

## 2. Dành cho HRBP

Đăng nhập bằng email HRBP (VD: `hrbp@ghn.vn`). Màn hình có 2 tab:

### Tab "Nhân viên & Gắn Sup"

- **Thêm nhân viên mới**: điền Họ tên, Mã NV, chọn Ca làm việc, Ngày nhận việc
  (mặc định là hôm nay). Nhấn **"Thêm nhân viên"**.
  - Nhân viên vừa thêm sẽ ở trạng thái **POOL** (chưa có Sup phụ trách) cho đến
    khi có Sup cùng ca vào nhận.
- **Danh sách toàn bộ nhân viên**: xem Ca, Ngày nhận việc, Sup phụ trách, Người
  hướng dẫn, có thuộc nhóm **KPI 14 ngày** hay không (cột "KPI 14N").
- **Gắn Sup thay**: nếu một nhân viên đứng mãi ở POOL mà Sup chưa vào nhận, HRBP
  có thể chọn Sup phù hợp (đúng ca) trong ô dropdown ở cuối dòng và nhấn **"Gắn"**.

### Tab "Đánh giá"

- Xem toàn bộ **đánh giá của Sup** và **tự đánh giá của nhân viên** cho tất cả
  nhân viên trong hệ thống (HRBP là vai trò duy nhất xem được cả hai loại).
- Nhấn **"Xuất Excel"** (góc trên bên phải) để tải file `.xlsx` gồm 3 sheet:
  danh sách nhân viên, đánh giá của Sup, tự đánh giá của nhân viên.

---

## 3. Dành cho Sup (Quản lý)

Đăng nhập bằng email Sup được cấp (VD: `thiennm@ghn.vn`). Màn hình chính gồm:

- 3 thẻ thống kê: số NV trong team, số NV mới chờ nhận (POOL), số NV đã đánh
  giá cuối ca/tuần.
- **Banner cam** hiện ra khi có NV mới đúng ca của bạn vừa được HRBP thêm vào —
  chỉ cần nhấn nút **"Nhận {Tên} ({Mã NV} – {Ca})"** để đưa NV vào team của
  mình. Ngoài ra bạn cũng có thể **kéo thả** thẻ NV từ cột POOL bên phải thả
  vào bảng team bên trái.

### Tab "Danh sách & Phân công 14 ngày"

- Bảng liệt kê NV đang thuộc team bạn.
- Nhấn **"Phân công"** ở dòng NV để mở form thiết lập:
  - **Người trực tiếp hướng dẫn**
  - **Khu vực / Line**
  - **Công việc** (dropdown tự lọc: NV ca Inout chỉ thấy công việc nhóm Inout,
    NV ca Sort chỉ thấy công việc nhóm Sort)
  - **Thời gian hướng dẫn**
  - Ghi chú thêm
  - Chọn tab **Tuần 1 / Tuần 2 / Tuần 3** ở trên form để phân công riêng cho
    từng tuần (có thể chuẩn bị trước công việc của tuần sau).

### Tab "Form đánh giá cuối ca"

- Mỗi NV trong team có 1 form đánh giá riêng, **chỉ mở đúng tuần hiện tại**
  (tính từ ngày nhận việc của NV). Nếu chưa tới hạn hoặc đã đánh giá đủ 3 tuần,
  form sẽ hiện thông báo thay vì cho nhập liệu.
- Nội dung đánh giá: NV có làm đúng công việc được giao không, nhận xét, vấn đề
  phát sinh, và có thể **đính kèm ảnh** xác nhận thực tế.
- **Lưu ý:** Sup **không xem được** phần tự đánh giá của nhân viên (theo đúng
  quy định phân quyền).

---

## 4. Dành cho Nhân viên mới

Đăng nhập bằng **Mã NV** do HRBP cấp. Màn hình hiển thị:

- Thông tin cá nhân: đang ở ngày thứ mấy / tuần mấy kể từ ngày nhận việc, Sup
  phụ trách, Người hướng dẫn.
- **Phân công hiện tại**: khu vực/line, công việc, thời gian hướng dẫn, ghi chú
  từ Sup (nếu Sup chưa nhận việc, app sẽ báo "chưa được Sup phụ trách nhận").
- **Form tự đánh giá**: chỉ mở đúng tuần hiện tại (giống cơ chế của Sup nhưng
  độc lập tiến trình). Nhân viên xác nhận: có được làm đúng việc Sup gắn
  không, có được hướng dẫn cụ thể không, xác nhận thực tế đúng phân công, ghi
  vấn đề gặp phải, và có thể **đính kèm ảnh/bằng chứng**.
- Xem lại **lịch sử tự đánh giá** của chính mình ở cuối trang.
- **Lưu ý:** nhân viên **không xem được** đánh giá của Sup, và không thấy thông
  tin của nhân viên khác.

---

## 5. Những quy tắc quan trọng cần nhớ

- **Mỗi tuần chỉ mở đúng 1 đợt đánh giá**, theo thứ tự Tuần 1 → Tuần 2 → Tuần 3,
  không được nhảy cóc hay đánh giá trước hạn. Mốc tuần tính theo lịch:
  - Tuần 1: ngày 1–7 kể từ ngày nhận việc
  - Tuần 2: ngày 8–14
  - Tuần 3: ngày 15–21
- Đánh giá của **Sup** và tự đánh giá của **Nhân viên** là 2 tiến trình **độc
  lập nhau** — Sup có thể đang ở Tuần 2 trong khi NV mới nộp xong Tuần 1, và
  ngược lại.
- **KPI giữ người 14 ngày** áp dụng riêng cho nhân viên thuộc **Ca 3 Inout, Ca 4
  Inout, Ca 3 Sort** — các NV này được đánh dấu badge "KPI 14N"/"KPI14" trong
  bảng để HRBP và Sup dễ theo dõi.
- Một nhân viên **chỉ có thể được 1 Sup nhận** — Sup khác cùng ca sẽ không nhận
  được nữa một khi đã có người nhận.
- Dữ liệu được lưu theo từng ngày (mỗi lượt đánh giá đều có ngày ghi nhận), nên
  HRBP có thể tra lại lịch sử theo thời gian trong file Excel xuất ra.

---

## 6. Xử lý sự cố thường gặp

| Tình huống | Cách xử lý |
|---|---|
| Nhân viên gõ Mã NV nhưng báo "Không tìm thấy" | HRBP chưa thêm nhân viên này vào hệ thống, hoặc gõ sai mã — kiểm tra lại ở tab "Nhân viên & Gắn Sup" |
| NV mới không thấy hiện trong banner của Sup | Kiểm tra Ca của NV có đúng ca Sup phụ trách không; nếu đúng ca mà vẫn không thấy, có thể NV đã được Sup khác/HRBP nhận rồi |
| Form đánh giá bị mờ/không cho nhập | Chưa tới hạn tuần đánh giá tiếp theo, hoặc đã hoàn tất đủ 3 tuần — chờ đúng mốc ngày hoặc không cần đánh giá thêm |
| Sup không xuất được Excel / không thấy nút Xuất Excel | Chức năng này chỉ dành cho HRBP, Sup không có quyền này |
| Quên đăng xuất trên máy dùng chung | Luôn bấm nút **"Đăng xuất"** ở góc phải màn hình sau khi dùng xong |

---

Cần thêm hướng dẫn kỹ thuật (cài đặt, deploy, cấu trúc code) xem file `README.md`.
