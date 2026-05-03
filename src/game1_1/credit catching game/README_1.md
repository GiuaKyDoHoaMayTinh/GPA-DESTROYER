# 📚 Credit Catching Game (Bắt Tín Chỉ Đại Học)

## Mô Tả Game

**Credit Catching Game** là một game hành động dựa trên Phaser Launcher, nơi người chơi phải hứng các bóng tín chỉ (credits) rơi xuống từ các vị trí khác nhau bằng một cái thanh hứng.

### Mục Tiêu
- Hứng được nhiều bóng tín chỉ từ các môn học khác nhau
- Thu thập điểm thưởng từ các bóng đặc biệt

---

## 🎮 Cách Chơi

### Điều Khiển
- **Nhấp Chuột**: Bắt đầu game từ menu
- **Phím Mũi Tên Trái/Phải**: Di chuyển thanh sang trái/phải

### Các Môn Học (Subjects)
Có 5 môn học trong game, mỗi môn có số lượng tín chỉ khác nhau:

| Môn Học | Tín Chỉ | Màu | 
|---------|---------|-----|
| 🎨 Đồ Họa | 5 | Xanh da trời (#72C4C1) |
| 🤖 Học Máy | 4 | Hồng (#C27C7E) |
| 💰 Kinh Tế | 2 | Tím (#9897CC) |
| 📐 Hình Học | 3 | Hồng sâu (#D14E9F) |
| 🎭 Thẩm Mỹ | 4 | Xanh lá (#AFC289) |

**Tổng Cộng: 18 tín chỉ**

### Loại Bóng

#### Bóng Tín Chỉ
- Bóng tương ứng với từng môn học
- Bắt được 2 quả = +1 tín chỉ cho môn đó

#### Bóng Thưởng (Bonus Balls)
- **⏱️ Bóng Thời Gian (Time Ball)**: Tăng thời gian chơi thêm 5s
- **📶 Bóng WiFi (WiFi Ball)**: Hiệu ứng đặc biệt, đứng màn hình

---

## 🏆 Hệ Thống Điểm

- **Điểm Cơ Bản**: 80 điểm (được tặng khi hoàn thành)
- **Điểm Cộng Thêm**: Từ các bóng thưởng
  - Bóng +5 = +5 điểm
  - Bóng +3 = +3 điểm
  - Bóng +2 = +2 điểm

---

## 📊 Các Scene (Màn Hình)

### 1️⃣ TitleScene (Màn Hình Tiêu Đề)
- Hiển thị nút "Đăng Nhập"
- Nền game khởi động
- Phát nhạc nền

### 2️⃣ CountdownScene (Màn Hình Đếm Ngược)
- Đếm ngược 5 → 1 trước khi bắt đầu
- Để người chơi chuẩn bị sẵn sàng

### 3️⃣ GameScene (Màn Hình Chơi Chính)
- Hiển thị các bóng rơi
- Hiển thị danh sách tín chỉ theo môn học
- Điều khiển thanh bắt bóng
- Phát âm thanh khi bắt bóng (pop sound)

### 4️⃣ GameOverScene (Màn Hình Kết Thúc)
- Nếu thua thì sẽ chuyển sang màn hình thua, và hiển thị nút 'Chơi lại'
- Nếu thắng, hiển thị kết quả cuối cùng
- Nút "Tiếp Tục" (Next Game)

---

## 📁 Cấu Trúc Thư Mục

```
credit catching game/
├── index.html              # File HTML chính
├── phaser.js              # Framework Phaser
├── project.config         # Cấu hình dự án
├── README_1.md           # Tài liệu này
├── src/
│   ├── main.js           # File khởi động game
│   └── scenes/
│       ├── TitleScene.js       # Màn hình tiêu đề
│       ├── CountdownScene.js   # Màn hình đếm ngược
│       ├── GameScene.js        # Màn hình chơi chính
│       └── GameOverScene.js    # Màn hình kết thúc
└── assets/
    ├── images/
    │   ├── background.png      # Nền chính
    │   ├── startbackground.png # Nền màn hình bắt đầu
    │   ├── basket.png          # Hình rổ
    │   ├── error.png           # Hình lỗi
    │   ├── overscene.png       # Nền game over
    │   ├── nextgame.png        # Nút tiếp tục
    │   └── next.png            # Nút next
    ├── audio/
    │   ├── pop.mp3             # Âm thanh bắt bóng
    │   └── xtremefreddy-game-music-loop-5-144569.mp3  # Nhạc nền
    └── spritesheets/
        ├── Subjects.png        # Atlas hình các bóng
        └── subject_spritesheet.json  # Cấu hình atlas
```

---

## ⚙️ Cấu Hình Kỹ Thuật

### Phaser Config
- **Kích Thước**: 1920 x 1080 (Full HD)
- **Physics**: Arcade Physics (với gravity)
- **Scale Mode**: Fit & Center
- **Background Color**: Đen (#000000)

### Physics Settings
- Gravity: Y = 200 (rơi xuống)
- Collide World Bounds: Enabled (rổ không vượt ra ngoài màn hình)

---

## 🔊 Âm Thanh

- **Nhạc Nền**: Phát lặp lại suốt game (volume: 0.5)
- **Sound Effect**: Âm thanh "pop" khi bắt bóng,
                    Âm thanh 'lose.mp3' khi thua,
                    Âm thanh 'win.mp3' khi thắng.

---

## 🎯 Trạng Thái Game

- **Điểm Ban Đầu**: 80
- **Điểm Cộng**: Tính từ các bóng thưởng
- **Trạng Thái ô tín chỉ**: Theo dõi tín chỉ đã bắt được cho mỗi môn học

---

## 💡 Tính Năng Đặc Biệt

✨ **Thanh Sáng** (Glow Effect) - thanh hứng có hiệu ứng sáng lấp lánh để dễ nhìn thấy

---

## 🚀 Cách Chạy Game

1. Mở `index.html` bằng Live Server trong trình duyệt web
2. Đợi các asset tải xong
3. Nhấp chuột bắt đầu
4. Đếm ngược 5 → 1
5. Bắt đầu bắt bóng!

---

## 📝 Ghi Chú

- Game sử dụng framework: **Phaser 3**
- Hỗ trợ **Arcade Physics** cho vật lý và va chạm
- Âm thanh và hình ảnh được tối ưu hóa cho hiệu suất

---

**Tác Giả**: GPA-DESTROYER Team  
**Ngôn Ngữ**: JavaScript (ES6+)  
**Framework**: Phaser 3  
**Trạng Thái**: Đã hoàn thành ✅

