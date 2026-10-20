# Food Manager - BIT246755 | Bản cơ bản

## Mục tiêu
Bài giữa kỳ môn Phát triển ứng dụng di động, **bản cơ bản 4,5 điểm** (phần video 4 điểm được chấm riêng). Phần offline/MockAPI **1,5 điểm chưa triển khai** theo đúng thứ tự ưu tiên.

## Công nghệ
React Native + Expo (JavaScript), SQLite (`expo-sqlite`), Ionicons (`@expo/vector-icons`). Không cần Xcode khi chạy trên iPhone thật bằng Expo Go tương thích.

## Cài đặt lên project cũ
Trong thư mục `BIT246755_FoodManager`, chạy file script `FoodManager_CoBan_DayDu.sh`. Script tự sao lưu `App.js` và các file trùng tên, sau đó thêm 9 file source/README. Không xóa database trong iPhone.

Khởi động:

```bash
npx expo start -c
```

## Các màn hình
- `App.js`: chọn màn hình (`list`, `detail`, `form`, `categories`), giữ bộ lọc và ngôn ngữ.
- `src/screens/DishListScreen.js`: danh sách, tìm kiếm một phần tên, lọc loại + đang bán + giá đồng thời, sắp xếp giá tăng/giảm và thời gian tăng.
- `src/screens/DishDetailScreen.js`: chi tiết, nhiều ảnh, đánh dấu ảnh đại diện, xác nhận trước khi xóa.
- `src/screens/DishFormScreen.js`: thêm/sửa món, chọn loại, validate, nhiều URL ảnh, đổi thumbnail, đang bán/ngừng bán.
- `src/screens/CategoryScreen.js`: thêm/sửa/xóa loại món; ngăn xóa nếu đã có món.
- `src/database/database.js`: mở SQLite, tạo 4 bảng (3 bảng nghiệp vụ + 1 bảng đánh dấu seed), CRUD và ràng buộc.
- `src/i18n.js`: từ điển English/Vietnamese.
- `src/theme.js`: bảng màu pastel xanh dương/tím.
- `src/components/Widgets.js`: nút bấm, chip, ảnh/icon, thanh tiêu đề.

## Dữ liệu mẫu
3 loại: Main Course, Drinks, Desserts; 5 món: Chicken Rice, Beef Noodles, Orange Juice, Iced Tea, Chocolate Cake. Khi cài lên app đang có 5 món, các bản ghi cũ được giữ lại. Ảnh mẫu được thêm **một lần** cho món tương ứng nếu chưa có ảnh. Ảnh URL cần Internet để tải; nếu link hỏng/không có mạng, app dùng icon thay thế.

## SQLite và tên MSSV
Tên database: `BIT246755_FoodManager.db`. Các bảng:
- `BIT246755_DishCategory`
- `BIT246755_Dish`
- `BIT246755_DishImage`
- `BIT246755_AppSetting` (chỉ lưu cờ khởi tạo ảnh mẫu)

Mọi **tên cột** đều bắt đầu bằng `BIT246755_`. Model nghiệp vụ vẫn chỉ gồm `DishCategory` và `Dish`; ảnh là dữ liệu con của món.

## Checklist thử trên iPhone
1. Mở app, thấy 5 món mẫu, MSSV, giao diện pastel.
2. Tìm "Chicken"; chỉ thấy Chicken Rice.
3. Lọc Drinks rồi bật "Available only"; Iced Tea biến mất. Bỏ lọc lại hiện.
4. Nhập giá 30000..70000, thử sắp xếp giá tăng/giảm, thời gian tăng.
5. Nhập giá min 100000 max 20000, app cảnh báo.
6. Chọn một món, xem ảnh, chi tiết; quay lại: **bộ lọc vẫn giữ nguyên**.
7. Thêm món, để trống tên / giá 0 / thời gian 0 xem báo lỗi.
8. Thêm món hợp lệ, thoát Expo rồi mở lại, món vẫn còn (SQLite).
9. Thêm trùng tên trong **cùng loại** => báo lỗi; thêm trùng ở **loại khác** => hợp lệ.
10. Thêm 2 ảnh bằng URL, chọn ảnh thứ hai làm đại diện, lưu rồi kiểm tra chi tiết. Đảm bảo chỉ một ảnh đại diện.
11. Sửa món thành ngừng bán, bật lọc "Available only" kiểm tra món biến mất khỏi kết quả, tắt lọc món vẫn có.
12. Xóa món, hộp thoại xác nhận xuất hiện, món mất khỏi danh sách sau khi xóa.
13. Mở quản lý loại, thử xóa loại còn món => bị từ chối. Thêm/sửa/xóa loại **không được sử dụng**.
14. Đổi EN ↔ VI ở mọi màn hình, vào lại danh sách: ngôn ngữ được giữ xuyên màn hình.
15. Tắt mạng trước khi xem ảnh: app vẫn đọc danh sách SQLite, ảnh có thể chuyển thành icon (chưa có sync nâng cao).

## Giải thích code khi thầy hỏi
- `useState`: lưu màn hình, bộ lọc, ngôn ngữ và dữ liệu đang nhập.
- `useEffect`: khi màn hình xuất hiện, đọc dữ liệu từ SQLite.
- `getDishes()`: JOIN món với loại món; dùng subquery lấy ảnh đại diện.
- `filter()` và `sort()`: lọc/sắp xếp nhiều điều kiện đồng thời.
- `getDishDetail(id)`: đọc một món theo ID và danh sách ảnh.
- `saveDish()`: ghi hoặc sửa món và danh sách ảnh **trong transaction**, lỗi thì rollback.
- `deleteDish()`: xóa món, ảnh của món tự bị xóa nhờ `ON DELETE CASCADE`.
- `deleteCategory()`: kiểm tra loại đã có món chưa trước khi xóa; khóa ngoại RESTRICT bảo vệ thêm.
- `t('key')`: lấy nhãn Anh/Việt từ `src/i18n.js`.
- `thumbnailIndex`: chỉ vị trí ảnh đại diện; database tạo unique partial index chống hai ảnh đại diện.
- Các tiền tố `BIT246755_` được đặt trong câu lệnh SQL tạo bảng/cột.

## Lưu ý
- Bản này **chưa bao gồm** offline edit + tự đồng bộ MockAPI 1,5 điểm. SQLite đã lưu local, nhưng chưa có đồng bộ cloud.
- Không xóa Expo Go hay xóa ứng dụng trên iPhone nếu muốn giữ dữ liệu SQLite đang có.
- Hai video chiếm 4 điểm, phải quay và nộp đúng hạn theo đề.
