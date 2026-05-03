# 📝 English Typing Game - Hướng Dẫn Chi Tiết

## 🎮 Mô Tả Game

**English Typing Game** là một trò chơi gõ phím tiếng Anh, nơi người chơi phải gõ đúng các từ được hiển thị trên màn hình trong vòng **90 giây**. Mỗi từ được gõ đúng sẽ cộng điểm, và các từ khó hơn sẽ được cộng nhiều điểm hơn.

---

## 🎯 Cách Chơi

### Điều Khiển
- **Nhấn Enter**: Bắt đầu game
- **Gõ từ hiển thị** vào ô input
- **Space** (khi trong iframe ở game 3D): Thoát game
- Tránh **Copy-Paste** (chức năng này bị khóa)

### Ba Màn Hình Chính

#### 1️⃣ Start Screen (Màn Hình Bắt Đầu)
- Hiển thị nút **Play** 
- Nhấn **Enter** để bắt đầu
- Hiển thị hướng dẫn "Nhấn Enter để bắt đầu chơi" cho game 3D

#### 2️⃣ Game Screen (Màn Hình Chơi)
- Hiển thị từ hiện tại cần gõ
- Ô input để người chơi nhập từ
- **Stats Panel** ở trên (điểm và thời gian còn lại)

#### 3️⃣ End Screen (Màn Hình Kết Thúc)
- Hiển thị điểm cuối cùng

---

## 🏆 Hệ Thống Điểm

| Loại Từ | Điểm | Ví Dụ |
|---------|------|-------|
| 📗 Từ Thường | 1 điểm | apple, cat, dog |
| 📙 Từ Khó | 2 điểm | typography, vector, bezier |
| 📕 Từ Siêu Khó | 3 điểm | quintessential, vicissitude, synchronicity |
| 🔴 Từ Super Khó | 5 điểm | pneumonoultramicroscopicsilicovolcanoconiosis, hippopotomonstrosesquippedaliophobia |

### Chi Tiết Hệ Thống Điểm
- **Điểm cộng** được hiển thị tạm thời bên cạnh Score: `(+2)`, `(+3)`, `(+5)`
- Hiển thị trong **1.5 giây** rồi biến mất
- Tổng Score được cập nhật liên tục

---

## 📊 Đặc Tính Game

### ⏱️ Thời Gian
- **Thời gian chơi**: 90 giây
- **Bộ đếm thời gian** hiển thị ở Stats Panel
- Game kết thúc ngay khi hết 90 giây

### 🔤 Danh Sách Từ
- **Tổng số từ**: 200+ từ
- **Ngôn ngữ**: Tiếng Anh (chủ yếu là từ vựng về Đồ Họa, Thiết Kế, Công Nghệ)
- Các từ được **chuyển thành chữ thường** trước khi so sánh

### 🎁 Từ Extreme (Super Khó)
- **Mỗi game**: Được chọn **1 từ extreme ngẫu nhiên**
- **Xuất hiện lúc**: **Lần thứ 2 gõ từ** (wordCount = 2)
- **Nhận dạng**: Có kiểu CSS đặc biệt (extreme-word class)
- **Giá trị**: 5 điểm
- Ví dụ:
  - `pneumonoultramicroscopicsilicovolcanoconiosis` 
  - `hippopotomonstrosesquippedaliophobia` 
  - `supercalifragilisticexpialidocious` 

### 🔊 Âm Thanh
- **Success Sound**: Âm thanh `pop` phát khi gõ đúng từ
- Tệp: `asset/audio/success.mp3`
- Volume: 70%
- Nếu phát không được sẽ im lặng (không gây lỗi)

### 🚫 Tính Năng Bảo Mật
- **Chặn Copy-Paste** vào input field
- **Auto-focus** input khi click vào game-screen ở game 3D
- **Refocus** tự động nếu focus bị mất ở game 3D
- **Blackout layer**: Có thể tối nền (nhận message từ parent)

---

## 📁 Cấu Trúc Thư Mục

```
game2_1/
├── index.html              # File HTML chính (3 màn hình)
├── css/
│   └── styles.css         # Toàn bộ CSS (start, game, end screens + animations)
├── js/
│   ├── words.js           # Danh sách 200+ từ + 3 cấp độ khó
│   └── game.js            # Logic chính trò chơi
├── asset/
│   ├── images/
│   │   └── custom-play-button.webp  # Nút bắt đầu
│   └── audio/
│       └── success.mp3     # Âm thanh khi gõ đúng
└── README_21.md          # File tài liệu này
```

---

## ⚙️ Cấu Hình Kỹ Thuật

### HTML Elements
```html
<!-- Start Screen -->
<section class="start-screen">
  <img src="..." alt="Start Game" id="startImg">
</section>

<!-- Game Screen -->
<section class="game-screen">
  <div id="currentWord">apple</div>
  <input type="text" id="answer" placeholder="Type here">
</section>

<!-- Stats (Score & Timer) -->
<div class="stats">
  <p>Score: <span id="score">0</span><span id="pointsAdded"></span></p>
  <p>Time: <span id="time">90</span>s</p>
</div>

<!-- End Screen -->
<section class="end-screen">
  <div class="final-score" id="finalScore">0</div>
</section>

<!-- Blackout & Audio -->
<div id="blackout"></div>
<audio id="successSound" src="asset/audio/success.mp3"></audio>
```

### JavaScript Variables & Flags
```javascript
let currentWord = '';        // Từ hiện tại cần gõ
let score = 0;              // Điểm hiện tại
let timeLeft = 90;          // Thời gian còn lại (giây)
let gameActive = false;     // Game đang chạy hay không
let gameStarted = false;    // Game đã bắt đầu hay không
let usedWords = new Set();  // Từ đã hiển thị
let metSuperHard = false;   // Đã gặp từ siêu khó chưa
let metExtremeHard = false; // Đã gặp từ extreme chưa
let wordCount = 0;          // Số lần gọi nextWord()
let selectedExtremeWord;    // Từ extreme được chọn cho game này
```

### Các Hàm Chính
```javascript
startGame()         // Khởi tạo game, hiện game-screen
nextWord()          // Lấy từ tiếp theo (ưu tiên từ khó)
checkInput()        // Kiểm tra đầu vào, cộng điểm
updateTimer()       // Giảm timeLeft, kiểm tra game over
playSuccessSound()  // Phát âm thanh thành công
returnToStart()     // Quay về màn hình bắt đầu
```

---

## 🔄 Luồng Game

1. **Start**: Hiện màn hình bắt đầu
2. **Enter**: Gọi `startGame()`
   - Reset score, time, flags
   - Chọn 1 từ extreme ngẫu nhiên
   - Hiện game-screen & stats panel
   - Gọi `nextWord()` lần đầu
   - Bắt đầu bộ đếm (interval)
3. **Gõ Từ**: Người chơi gõ từ vào input
4. **Kiểm Tra**: 
   - Nếu đúng: Cộng điểm, hiện `(+X)`, phát âm thanh, lấy từ mới
   - Nếu sai: Tiếp tục chỉ
5. **Game Over**: Hết 90 giây
   - Gọi `updateTimer()` → timeLeft = 0
   - Ẩn game-screen, hiện end-screen
   - Hiển thị final score
   - Post message đến parent (game2_2)
   - Gửi score đến server
6. **End**: Click end-screen để quay lại start

---

## 🌐 Tích Hợp Với Parent (game2_2)

Game này chạy trong **iframe** bên trong game2_2. Nó giao tiếp qua **window.postMessage**:

```javascript
// Gửi đi:
window.parent.postMessage({ type: 'gameStarted' }, '*');        // Khi bắt đầu
window.parent.postMessage({ type: 'gameOver', score: 150 }, '*'); // Khi kết thúc
window.parent.postMessage({ type: 'exitEmbeddedGame' }, '*');    // Khi nhấn Space

// Nhận từ:
window.addEventListener('message', (event) => {
  if (event.data?.type === 'embedStartGame') { ... }  // Bắt đầu game từ parent
  if (event.data?.type === 'MOUSE_BLACKOUT_ON') { ... }  // Tối nền (khi chuột được kiểm soát)
  if (event.data?.type === 'MOUSE_BLACKOUT_OFF') { ... } // Sáng nền
});
```

---

## 📝 Ghi Chú & Chi Tiết

### Từ Extreme 
- `pneumonoultramicroscopicsilicovolcanoconiosis` (45 chữ)
- `hippopotomonstrosesquippedaliophobia` (36 chữ)
- `supercalifragilisticexpialidocious` (34 chữ)
- Những từ này cực kỳ khó gõ nhưng chỉ xuất hiện lần thứ 2

### Ưu Tiên Lựa Chọn Từ
1. **Lần thứ 2** (wordCount = 2): Hiển thị từ extreme đã chọn
2. **Từ siêu khó chưa gặp**: Ưu tiên hiển thị superHardWords
3. **Từ ngẫu nhiên**: Chọn từ bất kỳ từ danh sách

### Làm Sạch Danh Sách
- Nếu tất cả từ đã được hiển thị, reset usedWords

### Điều Khiển Focus
- **Auto-focus** input khi game bắt đầu
- **Refocus** nếu focus bị mất (click ra ngoài)
- **Focus lại** nếu nhấn Enter ngoài input

---

## 🚀 Chạy Game

### Cách 1: Trực tiếp
```bash
# Mở index.html bằng Live Server trong trình duyệt
open index.html
```

### Cách 2: Trong game2_2 (iframe)
- Game2_2 sẽ load game2_1 trong một `<iframe>`
- Giao tiếp qua postMessage


---

**Tác Giả**: GPA-DESTROYER Team  
**Ngôn Ngữ**: JavaScript (ES6+) / HTML / CSS  
**Trạng Thái**: Hoàn Thiện ✓  
**Phiên Bản**: 2.1 (với extremeHardWords)

