# GPA-Destroyer
Hành trình sinh tồn ở UET( Nhân vật làm nhiệm vụ qua các chặng để tích lũy điểm)

## Chạy launcher + API (đăng nhập, điểm, bảng xếp hạng)

```bash
cd server
npm install
npm start
```

Mở trình duyệt tại `http://localhost:3333` (cổng mặc định; đổi bằng biến môi trường `PORT`). Cơ sở dữ liệu SQLite nằm tại `server/data/gpa.db`. Tùy chọn: tạo `server/.env` với `JWT_SECRET=...` cho môi trường thật.

**Kiểm tra API nhanh:** bật server (`npm start`), terminal khác trong `server` chạy `npm run smoke` (gọi register / me / scores / leaderboard / logout).

---

## Mô tả chung dự án

`GPA-DESTROYER` là một bộ game giáo dục mô phỏng hành trình sinh tồn tại trường đại học UET. Người chơi điều khiển nhân vật khám phá phòng, tương tác với môi trường và hoàn thành các game nhỏ để thu thập điểm tín chỉ, tránh rắc rối và đạt được thành tích tốt.

Project bao gồm nhiều phần game riêng biệt:

- `src/game1_1`: Credit Catching Game — game bắt bóng tín chỉ.
- `src/game2_1`: English Typing Game — game luyện gõ tiếng Anh.
- `src/game2_2`: Game phòng 3D có embedded game và kịch bản story flow.

Các phần game trên đã có README riêng trong mỗi thư mục. Vui lòng xem các file đó để biết chi tiết từng game, cách chơi và luồng dữ liệu.

---

## Cấu trúc dự án

```
GPA-DESTROYER/
├── index.html                    # Trang launcher chính - menu đăng nhập và chọn game
├── README.md                     # Tài liệu dự án này
├── start-server.bat              # Script batch để khởi động server nhanh
├── assets/                       # Tài nguyên chung
│   ├── 2D/                       # Hình ảnh 2D: icon, background, etc.
│   ├── models/                   # Mô hình 3D chung (nếu có)
│   └── sounds/                   # Âm thanh chung: nhạc nền, hiệu ứng
├── css/
│   └── launcher.css              # CSS cho trang launcher
├── js/
│   ├── launcher.js               # Logic JavaScript cho launcher
│   └── scoreClient.js            # Client-side API cho điểm số và bảng xếp hạng
├── server/                       # Backend API server
│   ├── db.js                     # Cấu hình database SQLite
│   ├── index.js                  # Server chính (Express.js)
│   ├── package.json              # Dependencies và scripts Node.js
│   ├── smoke.mjs                 # Script test API nhanh
│   └── data/                     # Thư mục chứa database SQLite
└── src/                          # Source code các game
    ├── game1_1/                  # Game 1: Credit Catching Game
    │   └── credit catching game/ # Thư mục game Phaser.js
    │       ├── index.html        # HTML game
    │       ├── phaser.js         # Framework Phaser
    │       ├── project.config    # Cấu hình dự án
    │       ├── README_1.md       # Tài liệu game (xem chi tiết ở đây)
    │       ├── assets/           # Tài nguyên game: audio, images, spritesheets
    │       └── src/              # Source code: main.js và scenes/
    ├── game2_1/                  # Game 2.1: English Typing Game
    │   ├── index.html            # HTML game
    │   ├── README_21.md          # Tài liệu game (xem chi tiết ở đây)
    │   ├── update.js             # Script update (chức năng bổ sung)
    │   ├── asset/                # Tài nguyên: audio, images
    │   ├── css/                  # CSS game
    │   └── js/                   # Logic: game.js, words.js
    └── game2_2/                  # Game 2.2: 3D Room với embedded games
        ├── index.html            # HTML game 3D
        ├── README_22.md          # Tài liệu game (xem chi tiết ở đây)
        ├── assets/               # Tài nguyên: audio, models GLB, video
        ├── css/                  # CSS giao diện
        └── js/                   # Modules: camera, collision, embeddedGame, etc.
```

### Mô tả chi tiết các file/thư mục

#### Root Files
- **`index.html`**: Trang launcher chính với giao diện đăng nhập, chọn game và bảng xếp hạng
- **`README.md`**: Tài liệu dự án này
- **`start-server.bat`**: Script Windows để khởi động server nhanh (chạy `npm start` trong thư mục server)

#### `assets/` - Tài nguyên chung
- **`2D/`**: Hình ảnh 2D như icon nhà, nhân vật, trường học, background
- **`models/`**: Mô hình 3D chung (nếu có, chưa sử dụng nhiều)
- **`sounds/`**: Âm thanh chung như nhạc nền phòng (`backmusicatroom.mp3`)

#### `css/`
- **`launcher.css`**: Styling cho trang launcher: form đăng nhập, menu, bảng xếp hạng

#### `js/`
- **`launcher.js`**: Logic frontend cho launcher: xử lý đăng nhập, chuyển trang, hiển thị điểm
- **`scoreClient.js`**: Client-side utilities cho API điểm số: postScore, fetch leaderboard

#### `server/` - Backend
- **`db.js`**: Cấu hình SQLite database với các bảng users, scores, leaderboards
- **`index.js`**: Server Express.js với routes: /register, /login, /scores, /leaderboards, /me
- **`package.json`**: Dependencies (express, sqlite3, bcrypt, jwt, cors) và scripts
- **`smoke.mjs`**: Script test tự động gọi các API để kiểm tra server hoạt động
- **`data/`**: Chứa file `gpa.db` SQLite database

#### `src/` - Games
- **`game1_1/`**: Game đầu tiên - bắt bóng tín chỉ bằng Phaser.js
- **`game2_1/`**: Game thứ hai - luyện gõ tiếng Anh
- **`game2_2/`**: Game chính - phòng 3D với embedded games và story flow

---

## Cách phát triển

1. **Chạy server**: `cd server && npm install && npm start`
2. **Mở launcher**: Truy cập `http://localhost:3333`
3. **Chơi game**: Đăng nhập và chọn game từ menu
4. **Xem README riêng**: Mỗi game có tài liệu chi tiết trong thư mục của nó

---

## Công nghệ sử dụng

- **Frontend**: HTML, CSS, JavaScript (ES6+)
- **Games**: Phaser.js (game1_1), Three.js (game2_2), Vanilla JS (game2_1)
- **Backend**: Node.js, Express.js, SQLite
- **Authentication**: JWT tokens
- **3D Models**: GLB files với Three.js
- **Audio/Video**: MP3, MKV files

---

**Tác giả**: GPA-DESTROYER Team  
**Trạng Thái**: Hoàn Thiện ✓  
