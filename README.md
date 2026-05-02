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
