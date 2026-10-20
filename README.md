# BIT246755_FoodManager 🍽️

**Bài kiểm tra giữa kỳ | Phát triển ứng dụng di động | Quản lý món ăn**

- **MSSV:** `BIT246755`
- **Tên project:** `BIT246755_FoodManager`
- **Công nghệ:** React Native (Expo), JavaScript, `expo-sqlite`, Ionicons
- **Nền tảng demo:** iPhone thật qua Expo Go
- **Mã nguồn:** [PTUDDD_GK](https://github.com/Minhhanh-zit/PTUDDD_GK)
- **Video demo (YouTube):** [Xem video](https://youtu.be/j7YK3xQk-vM?si=wVQ0n46lM4q8uI-9)

> **Đồng bộ nâng cao:** code hiện có cơ chế tự gửi thay đổi SQLite lên MockAPI khi app đang mở và kết nối được khôi phục (thử lại 12 giây/lần), đồng thời đọc cập nhật online về local. Cần **kiểm thử thực tế trên iPhone** trước khi xác nhận đủ 1,5 điểm. Không chạy đồng bộ nền khi ứng dụng đã bị tắt hoàn toàn.\n
## 1. Tính năng

- Danh sách, chi tiết, thêm, sửa, xóa món ăn (có hộp thoại xác nhận xóa).
- Quản lý danh mục món ăn; không cho xóa danh mục khi đang có món tham chiếu.
- Tìm theo một phần tên, lọc đồng thời theo danh mục, trạng thái đang bán, khoảng giá.
- Sắp xếp theo giá tăng, giá giảm hoặc thời gian chế biến tăng; giữ bộ lọc khi chuyển màn hình.
- Lưu nhiều URL ảnh cho mỗi món; chọn một ảnh đại diện.
- Phân loại **Quick** (≤ 15 phút) và **Regular** (> 15 phút).
- Validation: tên không rỗng, giá và thời gian > 0, danh mục hợp lệ, tên không trùng trong cùng danh mục.
- Chuyển giao diện **English / Tiếng Việt**; ngôn ngữ được giữ khi điều hướng.
- SQLite lưu trên điện thoại, không cần Internet để đọc/sửa dữ liệu văn bản; ảnh URL có thể cần Internet.
- Biểu tượng đám mây hiển thị **trạng thái đồng bộ tự động**, không cần bấm nút; dữ liệu thay đổi khi offline được lưu SQLite và thử lại khi có Internet.

## 2. Dữ liệu & tiền tố MSSV

Đối tượng nghiệp vụ chính:

- `DishCategory`: Id, Name, Description.
- `Dish`: Id, Name, Price, PreparationTime, IsAvailable, Description, DishCategoryId, DishImage.

SQLite: `BIT246755_FoodManager.db`; các bảng:

| Tên bảng | Công dụng |
|---|---|
| `BIT246755_DishCategory` | Danh mục món ăn |
| `BIT246755_Dish` | Thông tin món ăn |
| `BIT246755_DishImage` | Danh sách ảnh/ảnh đại diện theo món |
| `BIT246755_AppSetting` | Cờ khởi tạo dữ liệu mẫu |\n| `BIT246755_SyncState` | Liên kết local/remote ID, phiên bản và thay đổi đang chờ |

Tên trường lưu trữ SQLite cũng dùng tiền tố `BIT246755_`, ví dụ `BIT246755_Name`, `BIT246755_Price`, `BIT246755_DishCategoryId`.

**Dữ liệu mẫu:** 3 danh mục (Main Course, Drinks, Desserts), 5 món (Chicken Rice, Beef Noodles, Orange Juice, Iced Tea, Chocolate Cake).

## 3. Cài đặt và chạy

Yêu cầu Node.js, npm và Expo Go tương thích phiên bản Expo SDK được khai báo trong `package.json`.

```bash
git clone https://github.com/Minhhanh-zit/PTUDDD_GK.git
cd PTUDDD_GK
npm install
npx expo start -c
```

Quét QR trong Expo Go trên iPhone. Khi chạy lần đầu, app sẽ khởi tạo SQLite và dữ liệu mẫu nếu chưa có danh mục.

## 4. Cấu trúc mã nguồn

```text
App.js                         Điều hướng màn hình, trạng thái bộ lọc/ngôn ngữ
src/database/database.js       Khởi tạo SQLite, CRUD, kiểm tra ràng buộc
src/screens/DishListScreen.js  Danh sách, bộ lọc và trạng thái auto-sync
src/screens/DishDetailScreen.js Chi tiết, nhiều ảnh, xác nhận xóa
src/screens/DishFormScreen.js  Form thêm/sửa, validation, thay ảnh đại diện
src/screens/CategoryScreen.js  Quản lý loại món ăn
src/services/mockApi.js        Hàm HTTP kết nối MockAPI\nsrc/services/autoSync.js       Đồng bộ hai chiều khi app đang mở, retry tự động
src/components/DishCard.js     Thẻ món ăn, tách riêng khỏi màn hình danh sách
src/components/Widgets.js      Thành phần UI dùng lại
src/utils/dishFilters.js       Logic lọc nhiều điều kiện và sắp xếp
src/constants/theme.js         Màu pastel xanh/tím, hiển thị tiền và icon danh mục
src/locales/translations.js    Bản dịch English/Tiếng Việt

```

> Các hàm POST/PUT/DELETE trong `mockApi.js` là lớp dịch vụ đã khai báo, **chưa tự động được gọi trong quy trình CRUD local**.

## 5. Test nhanh trên iPhone

1. Danh sách hiển thị ít nhất 3 danh mục và 5 món mẫu.
2. Tìm `Chicken`; lọc `Drinks`, `Available only`; thử khoảng giá và sắp xếp.
3. Mở chi tiết rồi trở về; các bộ lọc vẫn giữ.
4. Thêm món mới, sửa, xóa, thử nhập sai và tên trùng cùng danh mục.
5. Thêm 2 URL ảnh rồi đổi ảnh đại diện.
6. Thử xóa danh mục đang có món để kiểm tra ràng buộc.
7. Đổi EN ↔ VI trên các màn hình.
8. Tắt Internet, sửa dữ liệu local rồi mở lại để kiểm tra SQLite.
9. Bật Internet, bấm nút đám mây để kiểm tra **kết nối** MockAPI, không phải đồng bộ.

## 6. Video và nộp bài

🎬 **[Xem video demo trên YouTube](https://youtu.be/j7YK3xQk-vM?si=wVQ0n46lM4q8uI-9)**

Theo đề giữa kỳ, cần **hai video khác nhau**:
- **Video 1:** quay màn hình chạy ứng dụng, demo MSSV, danh sách, CRUD, lọc, ảnh và ngôn ngữ; nộp trong ca kiểm tra.
- **Video 2:** **thuyết minh bằng lời** về cấu trúc mã nguồn, model/quan hệ, SQLite, chức năng chính, validation, đa ngôn ngữ, và các đoạn code có tiền tố MSSV; hạn **23/10/2026**.

Đường dẫn YouTube ở trên là video demo được cung cấp cho dự án. Cần đối chiếu nội dung video với yêu cầu Video 1/Video 2 và **nộp lên LMS theo đúng quy định**. Việc có link YouTube hoặc GitHub không đồng nghĩa đã nộp video lên LMS.

## 7. MockAPI (đang phát triển)

- `https://6ad61022f71f154ac4866450.mockapi.io/BIT246755_DishCategory`
- `https://6ad61022f71f154ac4866450.mockapi.io/BIT246755_Dish`

Có cơ chế `autoSync`: ứng dụng tự đọc MockAPI và xử lý các thay đổi lưu ở bảng `BIT246755_SyncState`. Trường `BIT246755_Revision` tránh đánh dấu đã đồng bộ nếu bản ghi được sửa tiếp trong lúc gửi. Mapping `BIT246755_RemoteId` hạn chế tạo trùng khi thử lại.

**Phạm vi demo:** tự đồng bộ khi ứng dụng ở foreground; không có background sync khi người dùng đóng hẳn app. Lần đầu, các món có sẵn được ghép theo tên hoặc ID mẫu nhằm tránh tạo trùng. Chính sách xung đột: nếu local còn thay đổi chưa đẩy, ưu tiên local; nếu local sạch, nhận bản online. Các xung đột phức tạp nhiều thiết bị hoặc MockAPI lưu sai kiểu `DishImage` chưa có bảo đảm nhất quán hoàn toàn, cần thử trên thiết bị thật.

## 8. Tổ chức mã nguồn

- `src/screens/`: các màn hình và tương tác của người dùng.
- `src/components/`: thành phần UI dùng lại, gồm `DishCard` và `Widgets`.
- `src/database/`: SQLite, CRUD và ràng buộc dữ liệu.
- `src/services/`: các hàm HTTP kết nối MockAPI.
- `src/utils/`: logic lọc và sắp xếp tách khỏi giao diện.
- `src/constants/`: giao diện màu sắc và các hàm hiển thị.
- `src/locales/`: từ điển English/Tiếng Việt.

Đã gộp tài liệu cũ `README_BAI_CO_BAN.md` vào README chính để không gây nhầm lẫn. Đây chỉ là lần sắp xếp mã nguồn, chưa bổ sung chức năng tự đồng bộ.
