# BIT246755 Food Manager 🍽️

**Bài kiểm tra giữa kỳ | Học phần Phát triển ứng dụng di động**

| Thông tin | Nội dung |
|---|---|
| Mã sinh viên | **BIT246755** |
| Tên ứng dụng | **Food Manager** |
| Repository | [Minhhanh-zit/PTUDDD_GK](https://github.com/Minhhanh-zit/PTUDDD_GK) |
| Công nghệ | React Native, Expo SDK 57, JavaScript, SQLite, MockAPI |
| Thiết bị đã chạy | iPhone với Expo Go |
| Video demo hiện có | [Xem trên YouTube](https://youtu.be/j7YK3xQk-vM?si=wVQ0n46lM4q8uI-9) |

> **Trạng thái chốt code ngày 20/10/2026:** Người làm đã kiểm thử thành công **một tình huống** sửa dữ liệu khi offline, lưu thay đổi vào SQLite, bật mạng trở lại và xác nhận dữ liệu mới đã xuất hiện trên MockAPI. Ứng dụng hiển thị `MockAPI connected` và không còn thay đổi chờ gửi. Các tình huống phức tạp hơn vẫn có giới hạn, trình bày cuối tài liệu.

## 1. Chức năng

### Quản lý món ăn và danh mục

- Xem danh sách món, mở chi tiết, thêm, sửa, xóa món; có xác nhận khi xóa.
- Quản lý loại món ăn, không cho xóa loại đang có món sử dụng.
- Lưu tên, giá tiền (VND), thời gian chế biến, trạng thái còn bán, mô tả, loại món.
- Mỗi món hỗ trợ nhiều URL hình ảnh và lựa chọn một ảnh đại diện.
- Phân nhóm theo thời gian: **Quick** (≤ 15 phút), **Regular** (> 15 phút).
- Kiểm tra dữ liệu đầu vào: tên bắt buộc; giá và thời gian dương; thời gian là số nguyên; tên món không được trùng trong cùng loại.

### Tìm kiếm và trải nghiệm

- Tìm kiếm gần đúng theo tên.
- Lọc kết hợp: loại món, trạng thái còn bán, khoảng giá.
- Sắp xếp: giá tăng, giá giảm, thời gian chế biến tăng.
- Giữ điều kiện tìm kiếm/lọc khi chuyển qua màn hình chi tiết rồi quay lại.
- Đổi giao diện **English / Tiếng Việt**.
- Giao diện xanh tím pastel, có biểu tượng và bố cục tương thích vùng an toàn iPhone.

### Lưu trữ và đồng bộ

- **SQLite:** nguồn dữ liệu local, vẫn đọc và chỉnh sửa được khi mất mạng.
- **MockAPI:** nơi lưu dữ liệu online để đồng bộ.
- **Tự đồng bộ khi app đang mở:** sau thao tác CRUD, lúc app trở lại trạng thái active và mỗi khoảng **12 giây**, chương trình thử gửi dữ liệu đang chờ khi có Internet.
- Thao tác local được ghi nhận bằng bảng `BIT246755_SyncState`, gồm ID local, ID online, trạng thái chờ, đánh dấu đã xóa và revision.
- Biểu tượng đám mây chỉ **hiển thị trạng thái tự đồng bộ**, không cần bấm nút để gửi dữ liệu.

## 2. Cấu trúc dự án

```text
PTUDDD_GK/
├── App.js                            Điều hướng và khởi tạo
├── index.js                          Điểm vào ứng dụng
├── app.json                          Cấu hình Expo
├── package.json                      Thư viện và lệnh chạy
├── assets/                           Icon và tài nguyên mặc định
├── src/
│   ├── components/
│   │   ├── DishCard.js               Thẻ hiển thị một món ăn
│   │   └── Widgets.js                UI dùng lại
│   ├── constants/
│   │   └── theme.js                  Bảng màu, format tiền, icon
│   ├── database/
│   │   └── database.js               SQLite, dữ liệu mẫu, CRUD, outbox
│   ├── locales/
│   │   └── translations.js           Từ điển EN/VI
│   ├── screens/
│   │   ├── DishListScreen.js         Danh sách, tìm/lọc/sắp xếp
│   │   ├── DishDetailScreen.js       Thông tin món ăn
│   │   ├── DishFormScreen.js         Form thêm và sửa món
│   │   └── CategoryScreen.js         Quản lý danh mục
│   ├── services/
│   │   ├── mockApi.js                HTTP GET/POST/PUT/DELETE
│   │   └── autoSync.js               Đồng bộ local ↔ online
│   └── utils/
│       └── dishFilters.js            Xử lý lọc và sắp xếp
├── video/
│   └── demo_foodmanager.mp4          Bản demo được lưu trong repo
└── README.md
```

## 3. Cơ sở dữ liệu SQLite

Tên database: `BIT246755_FoodManager.db`.

| Bảng | Công dụng |
|---|---|
| `BIT246755_DishCategory` | Danh mục món |
| `BIT246755_Dish` | Thông tin món; khóa ngoại đến danh mục |
| `BIT246755_DishImage` | Danh sách hình, lựa chọn thumbnail |
| `BIT246755_AppSetting` | Cờ khởi tạo ảnh mẫu một lần |
| `BIT246755_SyncState` | Theo dõi mapping ID local/online và thay đổi chờ gửi |

Tên bảng và các cột SQLite đều có tiền tố **`BIT246755_`**, ví dụ `BIT246755_Name`, `BIT246755_Price`, `BIT246755_DishCategoryId`.

Dữ liệu ban đầu: **3 danh mục** (`Main Course`, `Drinks`, `Desserts`) và **5 món mẫu** (`Chicken Rice`, `Beef Noodles`, `Orange Juice`, `Iced Tea`, `Chocolate Cake`). Dữ liệu được tạo khi khởi tạo DB mới, không xóa dữ liệu SQLite đã lưu ở những lần khởi động sau.

## 4. Cài đặt và chạy bằng Expo Go

Cần Node.js, npm và Expo Go phiên bản tương thích SDK 57.

```bash
git clone https://github.com/Minhhanh-zit/PTUDDD_GK.git
cd PTUDDD_GK
npm install
npx expo start -c
```

Mở Expo Go trên iPhone và quét QR của Metro Bundler. Nếu kết nối LAN không dùng được, có thể thử `npx expo start --tunnel`. Không cần Xcode để kiểm thử trên iPhone thật qua Expo Go.

## 5. MockAPI và cơ chế đồng bộ

**Endpoint:**

- [`BIT246755_DishCategory`](https://6ad61022f71f154ac4866450.mockapi.io/BIT246755_DishCategory)
- [`BIT246755_Dish`](https://6ad61022f71f154ac4866450.mockapi.io/BIT246755_Dish)

MockAPI của bài sử dụng khóa chính **`BIT246755_Id` (Object ID)**. Giá trị ID ở API phải được lưu ở dạng chuỗi, ví dụ `"1"`, để thao tác `GET /resource/1` hoạt động. Trước khi đồng bộ, chương trình kiểm tra endpoint truy cập từng bản ghi để tránh ghi nhầm hoặc tạo trùng khi cấu hình API không đúng.

**Luồng đồng bộ khi ứng dụng đang mở:**

1. Người dùng thao tác CRUD; dữ liệu được ghi vào SQLite.
2. Nếu offline, thông tin thay đổi vẫn nằm trong `BIT246755_SyncState` với trạng thái pending.
3. Khi có mạng trở lại, `autoSync.js` đọc dữ liệu online, ghép ID phù hợp và gửi các bản ghi đang chờ.
4. Khi API xác nhận và revision không đổi, chương trình đánh dấu đã đồng bộ.
5. Ứng dụng có thể đọc dữ liệu online về local đối với những bản ghi không có thay đổi local đang chờ.

**Phạm vi:** Đồng bộ khi app hoạt động ở foreground; **không** bảo đảm đồng bộ nền sau khi app bị đóng hẳn. Quy tắc xử lý xung đột đơn giản: ưu tiên thay đổi local đang chờ. Hệ thống chưa được kiểm chứng đầy đủ với sửa/xóa đồng thời từ nhiều thiết bị hoặc các tình huống mất phản hồi ngay sau POST.

## 6. Kết quả kiểm thử đã xác nhận

| Trường hợp | Kết quả |
|---|---|
| Giao diện trên iPhone hiển thị 5 món | Đã quan sát |
| GET theo ID của 3 danh mục và 5 món trên MockAPI | **8/8 HTTP 200** |
| Khi offline, dữ liệu local vẫn hiển thị | Đã quan sát |
| Khi offline, có 1 thay đổi đang chờ đồng bộ | Đã quan sát |
| Bật mạng lại, trạng thái chuyển thành `MockAPI connected` và không còn pending | Đã quan sát |
| Người làm đối chiếu và xác nhận thay đổi đã lên MockAPI | **Đã xác nhận** |

Bảng trên ghi lại **những tình huống đã được thực hiện và xác nhận**, không phải kết quả của một bộ kiểm thử tự động toàn diện.

### Các bước kiểm tra lại trước khi nộp

1. Thêm, sửa, xóa một món và kiểm tra dữ liệu sau khi khởi động lại ứng dụng.
2. Kiểm tra lọc đồng thời, sắp xếp, validation, đổi ngôn ngữ, nhiều ảnh và thumbnail.
3. Tắt mạng rồi sửa một món mẫu; xác nhận local thay đổi và pending tăng.
4. Bật mạng, giữ app đang mở; xác nhận pending giảm về 0 và đối chiếu dữ liệu thực trên MockAPI.
5. Kiểm tra số danh mục và số món không phát sinh bản ghi trùng.

## 7. Video và nộp bài

🎬 **[Video demo Food Manager trên YouTube](https://youtu.be/j7YK3xQk-vM?si=wVQ0n46lM4q8uI-9)**

- **Video 1:** Demo giao diện và thao tác ứng dụng. Có video được liên kết ở trên; cần đối chiếu nội dung với yêu cầu của giảng viên.
- **Video 2:** Thuyết minh cấu trúc và code (SQLite, CRUD, validation, đa ngôn ngữ, đồng bộ). **Chưa thực hiện trong bước chốt code này.** Hạn của Video 2 theo đề: **23/10/2026**.

Lưu ý: Có video trên GitHub/YouTube **không đồng nghĩa đã nộp lên LMS**. Thực hiện nộp file hoặc đường dẫn đúng yêu cầu của giảng viên.

## 8. Tình trạng bản chốt

Bản code được giữ nguyên theo commit đã có kết quả chạy thành công trên iPhone; phần cập nhật README này chỉ sửa tài liệu. Trước khi chạy code mới nhất trên Mac, kiểm tra `git status` và `git pull`.

Không đưa `node_modules/`, `.expo/`, dữ liệu SQLite cá nhân hay file backup lên repository.
