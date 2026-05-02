# English Typing Game - Cấu Trúc Dự Án

## 📁 Cấu Trúc Thư Mục

```
game2_1/
├── index.html              # File HTML chính - điểm nhập vào
├── css/
│   └── styles.css         # Tất cả CSS cho giao diện
├── js/
│   ├── words.js           # Danh sách từ và các cấp độ khó
│   └── game.js            # Logic trò chơi
├── static/
│   └── images/
│       └── play-button.png # Hình nền/nút bắt đầu
└── README.md              # File hướng dẫn này
```

## 📄 Mô Tả Các File

### `index.html`
- **Mục đích**: File HTML chính chứa cấu trúc giao diện
- **Nội dung**:
  - 3 màn hình (Start, Game, End)
  - Import CSS từ `css/styles.css`
  - Import JS từ `js/words.js` và `js/game.js`
- **Sửa đổi**: Thêm/bớt HTML element, thay đổi id hoặc class

### `css/styles.css`
- **Mục đích**: Quản lý toàn bộ kiểu CSS của game
- **Nội dung**:
  - Styling cho 3 màn hình (start-screen, game-screen, end-screen)
  - Kiểu cho input, nút, stats
  - Responsive design
- **Sửa đổi**: Thay đổi màu sắc, font size, layout, animation

### `js/words.js`
- **Mục đích**: Quản lý danh sách từ tiếng Anh
- **Nội dung**:
  - `words[]` - Mảng tất cả các từ
  - `hardWords` (Set) - Từ khó (2 điểm)
  - `superHardWords` (Set) - Từ siêu khó (3 điểm)
  - `extremeHardWords` (Set) - Từ super khó (5 điểm)
- **Sửa đổi**: Thêm/bớt từ, tạo cấp độ mới

### `js/game.js`
- **Mục đích**: Chứa toàn bộ logic trò chơi
- **Hàm chính**:
  - `startGame()` - Bắt đầu trò chơi
  - `nextWord()` - Lấy từ tiếp theo (ưu tiên từ khó nếu chưa gặp)
  - `checkInput()` - Kiểm tra đáp án và cộng điểm
  - `updateTimer()` - Cập nhật bộ đếm thời gian
  - `returnToStart()` - Quay lại màn hình bắt đầu
- **Sửa đổi**: Thay đổi logic game, thời gian, cách tính điểm

## 🎮 Hệ Thống Điểm

- **Từ thường**: 1 điểm
- **Từ khó**: 2 điểm
- **Từ siêu khó**: 3 điểm
- **Từ super khó**: 5 điểm

## ⚙️ Cách Chỉnh Sửa

### Thêm từ mới
1. Mở `js/words.js`
2. Thêm từ vào mảng `words[]`
3. Nếu là từ khó, thêm vào `Set` tương ứng

### Thay đổi thời gian chơi
1. Mở `js/game.js`
2. Tìm dòng `timeLeft = 90`
3. Thay đổi số 90 thành thời gian mong muốn

### Tùy chỉnh giao diện
1. Mở `css/styles.css`
2. Tùy chỉnh CSS của các class như `.start-screen`, `.game-screen`, etc.

### Sửa đổi logic game
1. Mở `js/game.js`
2. Tìm hàm cần sửa
3. Chỉnh sửa logic bên trong hàm

## 🚀 Chạy Game

1. Mở `index.html` trong trình duyệt
2. Click vào hình để bắt đầu
3. Gõ từ hiển thị trên màn hình
4. Chờ hết 90 giây để xem kết quả

## 📝 Ghi Chú

- Tất cả từ được chuyển về chữ thường trước khi kiểm tra (`toLowerCase()`)
- Game sẽ ưu tiên gặp ít nhất 1 từ `superHardWords` và 1 từ `extremeHardWords`
- Điểm cộng được hiển thị tạm thời cạnh điểm trong 1.5 giây
