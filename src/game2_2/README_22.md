# 🎮 Game 3D Phòng và Embedded Game

## Tổng Quan

`game2_2` là một game 3D tương tác đặt trong một phòng ngủ/ phòng học. Người chơi điều khiển nhân vật di chuyển, tương tác với bàn và giường, bật/tắt đèn đầu giường, rồi mở một game con nhúng trên màn hình máy tính trong phòng.

Game này được xây dựng bằng **Three.js** và sử dụng các mô hình GLB, CSS3D iframe để ghép `game2_1` trực tiếp lên màn hình 3D.

---

## Tính Năng Chính

- **Đi bộ tự do** trong phòng 3D bằng cách click chuột vào sàn
- **Tương tác với bàn**: nhấn `E` để ngồi vào bàn
- **Tương tác với giường**: nhấn `E` để nằm trên giường
- **Bật/tắt đèn**: nhấn `P` khi gần đèn đầu giường
- **Embedded game**: sau khi ngồi vào bàn, game `game2_1` được tải trong iframe trên màn hình máy tính
- **Hiệu ứng camera**: camera chuyển góc khi ngồi vào bàn
- **Cảnh báo và hint**: hiển thị hướng dẫn tương tác trên giao diện
- **Cơ chế câu chuyện**: game có kịch bản pha từ bước vào phòng → ngồi bàn → chơi game con → hoàn thành

---

## Controls

- **Click chuột**: di chuyển nhân vật đến vị trí click trên sàn
- **Phím `E`**: tương tác với bàn/giường khi ở gần
- **Phím `P`**: bật/tắt đèn đầu giường khi ở trong phạm vi hoạt động
- **Phím `Space`**: đứng dậy khi đang ngồi hoặc nằm
- **Phím `Home`**: quay về menu chính (khi game embedded không active)
- **Phím `Enter`**: bắt đầu game con khi embedded active

---

## Flow / Kịch Bản

### Các phase chính
- `INTRO_WALK`: vào phòng, di chuyển khám phá
- `AT_DESK_HINT`: đến gần bàn, hiển thị hint ngồi
- `MODAL_G1`: mở modal hướng dẫn trước game con
- `PLAYING_G1`: game `game2_1` chạy trong iframe khi ngồi bàn
- `MODAL_G2`: sau khi thắng game1, hiển thị modal chuyển sang giai đoạn tiếp theo
- `READY_EMBED`: sẵn sàng chơi game embedded thứ hai (Jerry)
- `DONE`: kết thúc và chuyển về launcher/menu

### Luồng trải nghiệm
1. Game khởi tạo và tải các mô hình 3D
2. Nhân vật đứng yên tại vị trí bắt đầu
3. Người chơi click để di chuyển và khám phá phòng
4. Khi đến gần bàn, nhấn `E` để ngồi
5. Game con `game2_1` khởi chạy trên màn hình máy tính trong phòng
6. Khi game con hoàn thành, nhân vật tự đứng dậy và tiếp tục hành trình
7. Hoàn tất game và về lại launcher kèm hiệu ứng end journey

---

## Thư Mục và File Chính

```
game2_2/
├── index.html             # HTML chính của phần game phòng 3D
├── README_22.md           # Tài liệu này
├── assets/
│   ├── audio/             # Âm thanh chuột, nhạc nền
│   ├── models/            # Mô hình GLB: phòng, nhân vật, chuột
│   └── video/             # Video intro mở cửa
├── css/
│   └── styles.css         # CSS giao diện overlay, modal, hint
└── js/
    ├── camera.js         # Quản lý camera và góc nhìn
    ├── collision.js      # Va chạm với tường, bàn, giường, ranh giới phòng
    ├── embeddedGame.js   # Nhúng game2_1 bằng CSS3D iframe
    ├── input.js          # Xử lý chuột, phím E/P/Space/Home
    ├── mouse.js          # Điều khiển con chuột Jerry trong phòng
    ├── player.js         # Di chuyển nhân vật và pose ngồi/nằm
    ├── scene.js          # Khởi tạo Scene, ánh sáng, load GLB
    ├── storyFlow.js      # Kịch bản game, modal và postMessage
    ├── ui.js             # Giao diện hint, message, loading
    └── utils.js          # Cấu hình zones và helper nhỏ
```

---

## Giải Thích Các Module

### `scene.js`
- Tạo **Three.js scene** và renderer
- Thiết lập ánh sáng, floor, shadow
- Tải mô hình 3D:
  - `room3d.glb` (phòng và màn hình)
  - `CharKL.glb` (nhân vật)
  - `Mice.glb` (chuột)
- Tìm `Cube018_1` làm màn hình để gắn `game2_1`
- Quản lý bật/tắt đèn và video intro nếu cần

### `camera.js`
- Camera mặc định cố định nhìn phòng
- Khi `sit` và embedded active, đổi góc camera nhìn vào màn hình
- Hỗ trợ resize

### `input.js`
- Click chuột để đặt target di chuyển nhân vật
- Phím `E` tương tác bàn/giường
- `P` bật/tắt đèn nếu gần đèn
- `Space` đứng dậy nếu đang ngồi/nằm
- `Home` về menu chính khi không ở trạng thái embedded
- `Enter` khởi động game con khi embedded active

### `player.js`
- Quản lý trạng thái: `walk`, `sit`, `lie`
- Di chuyển nhân vật tới `playerTarget`
- Kiểm tra va chạm bằng `collision.js`
- Đặt pose ngồi/ nằm, bật embedded khi ngồi bàn
- Tắt embedded khi đứng lên

### `collision.js`
- Giới hạn phòng theo bounding box
- Chặn di chuyển xuyên vật: tường, bàn, ghế, giường, thùng rác, tủ đầu giường
- So sánh dựa trên `THREE.Sphere` và `Box3`

### `embeddedGame.js`
- Tạo `iframe` game2_1 và ghép lên màn hình 3D bằng `CSS3DRenderer`
- Điều khiển hiển thị / focus / postMessage
- Khóa phím `Space` khi game 2D đang chạy
- Nhận message `gameStarted` / `gameOver` từ iframe

### `storyFlow.js`
- Quản lý trạng thái câu chuyện với `sessionStorage`
- Hiển thị modal hướng dẫn trước/sau game con
- Nhận message `gpaGame1Exit` và `gameOver` từ iframe
- Điều khiển flow chuyển từ game1 → game2 → kết thúc

### `ui.js`
- Hiển thị hint và action hint
- Cập nhật thông báo tiến trình load mô hình
- Quản lý nhạc nền và thông điệp trạng thái

### `utils.js`
- Định nghĩa các zone: bàn, giường, đèn
- Vị trí khởi tạo nhân vật và chuột
- Các helper đơn giản: `distance`, `createVector3`

---

## Embedded Game `game2_1`

- `game2_1` được nạp qua iframe trên màn hình máy tính trong phòng
- Khi `game2_1` gửi message `{ type: 'gameStarted' }`, `game2_2` khóa phím `Space` và chuyển camera phù hợp
- Khi `game2_1` gửi `{ type: 'gameOver', score }`, `game2_2` sẽ:
  - Tắt iframe sau delay
  - Đứng dậy nhân vật
  - Chạy celebration + bảng xếp hạng
  - Quay về launcher menu chính

---

## Chạy Game

### Từ thư mục `src/game2_2`
- Mở `index.html` trong trình duyệt hỗ trợ ES Modules
- Tốt nhất dùng local server vì import map và đường dẫn asset

### Gợi ý nhanh
- Nếu gặp lỗi load module, dùng `live-server` hoặc `python -m http.server`
- Nếu chạy qua file trực tiếp, cần kiểm tra đường dẫn `../../assets/...`

---

## Ghi Chú Quan Trọng

- Game yêu cầu **Three.js** qua CDN importmap
- Nếu không tìm thấy `Cube018_1`, embedded game sẽ không hoạt động
- `player.js` hiện đang debug với `PLAYER_DEBUG = true`
- `storyFlow.js` dùng `sessionStorage` để nhớ phase và tiếp tục chuỗi câu chuyện
- `ui.js` hiển thị loading progress khi mô hình GLB đang tải

---

## Mở Rộng

- Thêm `game2_1` thứ hai hoặc game khác bằng cách sửa `embeddedGame.js`
- Bổ sung thêm vùng tương tác mới như tủ sách hoặc cửa sổ
- Cải thiện camera chuyển động mềm mại hơn
- Tối ưu `collision.js` để cho phép đường đi cong hoặc đệm va chạm

---

**Tác giả:** GPA-DESTROYER Team

