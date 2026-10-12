# HDSD — Hướng Dẫn Sử Dụng App "Gắn Nhân Viên & Đánh Giá Onboarding 3 Tuần"

App dùng để: HRBP thêm nhân viên mới → toàn bộ Sup phụ trách đúng ca của nhân
viên đều thấy và cùng quản lý (phân công người kèm cặp/công việc) →
theo dõi & đánh giá nhân viên trong 3 tuần đầu (phục vụ KPI giữ người 14 ngày).

Truy cập app tại: **http://localhost:3000** (hoặc địa chỉ do IT cung cấp nếu đã
deploy lên server/domain riêng).

---

## 1. Màn đăng nhập

Khi mở app, bạn sẽ thấy màn đăng nhập với 2 chế độ (toggle ở giữa):

| Chế độ | Dành cho | Cách đăng nhập |
|---|---|---|
| **Nhân Viên** | Nhân viên mới | Gõ **Mã NV** + **4 số cuối SĐT** (không cần mật khẩu, nhân viên không có email công ty) |
| **Quản Trị (Sup / HRBP / Admin)** | Sup, HRBP, Admin | Bấm **Đăng Nhập bằng Google** — dùng tài khoản Google Workspace `@ghn.vn` |

> Sup/HRBP/Admin đăng nhập bằng tài khoản Google công ty (`@ghn.vn`), không
> cần nhớ mật khẩu riêng cho app. Muốn được cấp quyền, email Google của bạn
> phải được Admin thêm vào danh sách Sup/HRBP ở trang Admin trước. Nếu đăng
> nhập Google thành công nhưng báo "chưa được cấp quyền", hãy liên hệ Admin.

Sau khi đăng nhập, app tự đưa bạn vào đúng màn hình theo vai trò — không cần
chọn thêm.

> Mã NV một mình không còn đủ để đăng nhập (trước đây ai biết mã NV của người
> khác cũng đăng nhập được thay họ) — giờ cần đúng cả **4 số cuối SĐT** đã
> khai khi HRBP thêm nhân viên. Nhân viên có sẵn từ trước khi có bản cập nhật
> này chưa có SĐT trong hệ thống sẽ không đăng nhập được cho đến khi HRBP/Admin
> bổ sung SĐT qua màn Sửa nhân viên.

---

## 2. Dành cho HRBP

Đăng nhập bằng email HRBP (VD: `hrbp@ghn.vn`). Màn hình có 2 tab:

### Tab "Nhân viên"

- **Thêm nhân viên mới**: điền Họ tên, Mã NV, Số điện thoại (bắt buộc — dùng
  làm yếu tố thứ 2 khi nhân viên đăng nhập), chọn Ca làm việc, Ngày nhận việc
  (mặc định là hôm nay). Nhấn **"Thêm nhân viên"**.
  - Nhân viên vừa thêm sẽ **tự động xuất hiện trong team của mọi Sup phụ trách
    đúng ca đó** — không cần ai "nhận" thủ công.
- **Danh sách toàn bộ nhân viên**: xem Ca (kèm nhãn **KPI 14N** nếu thuộc nhóm
  KPI giữ người 14 ngày), Ngày nhận việc + tuần hiện tại, (các) Sup phụ trách,
  Người hướng dẫn, Công việc Sup đã gán, tiến độ đánh giá. Ô **tìm kiếm** phía
  trên bảng lọc nhanh theo họ tên / mã NV (gõ không dấu cũng được). NV thiếu
  SĐT có nhãn **"Thiếu SĐT"** — cần bổ sung qua nút **Sửa** thì NV mới đăng
  nhập được. Trên điện thoại, danh sách hiển thị dạng thẻ thay vì bảng.
  - Nếu chưa có Sup nào được cấu hình phụ trách ca đó, cột này hiện badge
    **"Chưa có Sup"** — Admin cần vào trang Admin để gán Ca phụ trách cho ít
    nhất 1 Sup.

### Tab "Đánh giá"

- Xem toàn bộ **đánh giá của Sup** và **tự đánh giá của nhân viên** cho tất cả
  nhân viên trong hệ thống (HRBP là vai trò duy nhất xem được cả hai loại).
- Nhấn **"Xuất Excel"** (góc trên bên phải) để tải file `.xlsx` gồm các sheet:
  danh sách nhân viên, đánh giá của Sup, tự đánh giá của nhân viên, tổng hợp
  tự đánh giá, cảnh báo nguy cơ nghỉ việc.

---

## 3. Dành cho Sup (Quản lý)

Đăng nhập bằng email Sup được cấp (VD: `thiennm@ghn.vn`). Màn hình chính gồm:

- 2 thẻ thống kê: số NV thuộc (các) ca bạn phụ trách, số NV đã đánh giá cuối
  ca/tuần.
- NV mới thuộc đúng ca bạn phụ trách sẽ **tự động xuất hiện ngay** trong bảng
  bên dưới — không cần "nhận" hay claim riêng. Nếu ca đó có nhiều Sup, tất cả
  đều thấy chung danh sách này và ai cũng có thể phân công/đánh giá.

### Tab "Danh sách & Phân công"

- Bảng liệt kê toàn bộ NV thuộc (các) ca bạn phụ trách, lọc nhanh theo
  **Chưa phân công / Đã phân công tuần này / Hoàn tất 3 tuần**, và ô tìm kiếm
  theo tên / mã NV. NV đã qua 3 tuần được đánh dấu **"Hoàn tất 3 tuần"** và xếp
  xuống cuối danh sách.
- Nhấn **"Phân công"** ở dòng NV để mở form thiết lập:
  - **Người trực tiếp hướng dẫn**
  - **Công việc** — tick chọn 1 hoặc nhiều (danh sách tự lọc: NV ca Inout chỉ
    thấy công việc nhóm Inout, NV ca Sort chỉ thấy nhóm Sort), mỗi việc ghi
    giờ hướng dẫn riêng. **Bắt buộc chọn ít nhất 1 công việc.**
  - Ghi chú thêm
  - Chọn tab **Tuần 1 / Tuần 2 / Tuần 3** ở trên form để phân công riêng cho
    từng tuần (có thể chuẩn bị trước công việc của tuần sau).

- Nếu lưu bị lỗi (VD chưa chọn công việc), form **giữ nguyên và hiện thông
  báo lỗi** — chỉ tự đóng khi đã lưu thành công.

### Tab "Đánh giá cuối ca"

- Mỗi NV trong team có 1 form đánh giá riêng, **chỉ mở đúng tuần hiện tại**
  (tính từ ngày nhận việc của NV). Nếu chưa tới hạn hoặc đã đánh giá đủ 3 tuần,
  form sẽ hiện thông báo thay vì cho nhập liệu.
- Nội dung đánh giá: NV có làm đúng công việc được giao không, nhận xét, vấn đề
  phát sinh, và có thể **đính kèm ảnh** xác nhận thực tế.
- **Lưu ý:** Sup **không xem được** phần tự đánh giá của nhân viên (theo đúng
  quy định phân quyền).

---

## 4. Dành cho Nhân viên mới

Đăng nhập bằng **Mã NV** do HRBP cấp + **4 số cuối SĐT** đã khai với HRBP.
Màn hình hiển thị:

- Thông tin cá nhân: đang ở ngày thứ mấy / tuần mấy kể từ ngày nhận việc, (các)
  Sup phụ trách, Người hướng dẫn.
- **Phân công hiện tại**: công việc kèm giờ hướng dẫn của từng việc, ghi chú
  từ Sup (nếu chưa Sup nào phân công cụ thể, app sẽ báo "Chưa có Sup nào phân
  công công việc cụ thể cho bạn").
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
- Một nhân viên thuộc **tất cả Sup phụ trách đúng ca** của nhân viên đó cùng lúc
  — không có khái niệm "1 Sup nhận riêng" nữa, ai trong số các Sup đó cũng có
  thể phân công/đánh giá.
- Dữ liệu được lưu theo từng ngày (mỗi lượt đánh giá đều có ngày ghi nhận), nên
  HRBP có thể tra lại lịch sử theo thời gian trong file Excel xuất ra.

---

## 6. Xử lý sự cố thường gặp

| Tình huống | Cách xử lý |
|---|---|
| Nhân viên báo "Mã NV hoặc 4 số cuối SĐT không đúng" | HRBP chưa thêm nhân viên này vào hệ thống, gõ sai mã/SĐT, hoặc SĐT trong hệ thống chưa được cập nhật — kiểm tra/sửa ở tab "Nhân viên" (HRBP thêm mới) hoặc trang Admin (sửa SĐT nhân viên có sẵn) |
| NV mới không thấy hiện trong bảng của Sup | Kiểm tra Ca của NV có đúng (các) ca Sup đang phụ trách không (Admin cấu hình ở trang Admin) |
| Form đánh giá bị mờ/không cho nhập | Chưa tới hạn tuần đánh giá tiếp theo, hoặc đã hoàn tất đủ 3 tuần — chờ đúng mốc ngày hoặc không cần đánh giá thêm |
| Sup không xuất được Excel / không thấy nút Xuất Excel | Chức năng này chỉ dành cho HRBP, Sup không có quyền này |
| Quên đăng xuất trên máy dùng chung | Luôn bấm nút **"Đăng xuất"** ở góc phải màn hình sau khi dùng xong |

---

Cần thêm hướng dẫn kỹ thuật (cài đặt, deploy, cấu trúc code) xem file `README.md`.
