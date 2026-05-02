import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { initDb, getDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const SCORE_GAME_IDS = new Set(['game1_1', 'game2_1', 'game2_2']);

initDb();
const db = getDb();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '64kb' }));

function signToken(userId, jti) {
  return jwt.sign({ sub: userId, jti }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    res.status(401).json({ error: 'Thiếu token' });
    return;
  }
  let payload;
  try {
    payload = jwt.verify(m[1], JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Token không hợp lệ' });
    return;
  }
  const row = db
    .prepare(
      `SELECT user_id FROM sessions WHERE token_jti = ? AND expires_at > datetime('now')`
    )
    .get(payload.jti);
  if (!row) {
    res.status(401).json({ error: 'Phiên đã hết hạn hoặc đã đăng xuất' });
    return;
  }
  req.userId = row.user_id;
  req.jti = payload.jti;
  next();
}

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (username.length < 3 || username.length > 32 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    res.status(400).json({ error: 'Tên đăng nhập 3–32 ký tự, chỉ chữ, số và _' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Mật khẩu ít nhất 6 ký tự' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  let userId;
  try {
    const info = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    userId = Number(info.lastInsertRowid);
  } catch {
    res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    return;
  }
  const jti = randomUUID();
  const exp = db.prepare(`SELECT datetime('now', '+7 days') as e`).get().e;
  db.prepare('INSERT INTO sessions (user_id, token_jti, expires_at) VALUES (?, ?, ?)').run(userId, jti, exp);
  const token = signToken(userId, jti);
  res.json({ token, user: { id: userId, username } });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    return;
  }
  const jti = randomUUID();
  const exp = db.prepare(`SELECT datetime('now', '+7 days') as e`).get().e;
  db.prepare('INSERT INTO sessions (user_id, token_jti, expires_at) VALUES (?, ?, ?)').run(user.id, jti, exp);
  const token = signToken(user.id, jti);
  res.json({ token, user: { id: user.id, username: user.username } });
});

/** Phiên khách: có JWT giống user đăng nhập, điểm ghi bảng xếp hạng theo tên hiển thị */
app.post('/api/auth/guest', (req, res) => {
  const displayName = String(req.body.displayName || '').trim();
  if (displayName.length < 1 || displayName.length > 40) {
    res.status(400).json({ error: 'Tên hiển thị 1–40 ký tự' });
    return;
  }
  const username = `guest_${randomUUID().replace(/-/g, '')}`;
  const hash = bcrypt.hashSync(randomUUID(), 10);
  let userId;
  try {
    const info = db
      .prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)')
      .run(username, hash, displayName);
    userId = Number(info.lastInsertRowid);
  } catch {
    res.status(500).json({ error: 'Không tạo được phiên khách' });
    return;
  }
  const jti = randomUUID();
  const exp = db.prepare(`SELECT datetime('now', '+7 days') as e`).get().e;
  db.prepare('INSERT INTO sessions (user_id, token_jti, expires_at) VALUES (?, ?, ?)').run(userId, jti, exp);
  const token = signToken(userId, jti);
  res.json({ token, user: { id: userId, username, displayName } });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token_jti = ?').run(req.jti);
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.userId);
  if (!user) {
    res.status(404).json({ error: 'Không tìm thấy user' });
    return;
  }
  res.json({ user });
});

app.post('/api/scores', authMiddleware, (req, res) => {
  const gameId = String(req.body.gameId || '');
  const score = Number(req.body.score);
  if (!SCORE_GAME_IDS.has(gameId)) {
    res.status(400).json({ error: 'gameId không hợp lệ' });
    return;
  }
  if (!Number.isFinite(score) || score < 0 || score > 1e9) {
    res.status(400).json({ error: 'Điểm không hợp lệ' });
    return;
  }
  const meta = req.body.meta != null ? JSON.stringify(req.body.meta) : null;
  const info = db
    .prepare('INSERT INTO scores (user_id, game_id, score, meta_json) VALUES (?, ?, ?, ?)')
    .run(req.userId, gameId, Math.floor(score), meta);
  res.status(201).json({ id: info.lastInsertRowid, gameId, score: Math.floor(score) });
});

app.get('/api/leaderboards/:gameId', (req, res) => {
  const gameId = String(req.params.gameId || '');
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '15'), 10) || 15));

  if (gameId === 'combined') {
    const rows = db
      .prepare(
        `WITH per_user AS (
           SELECT user_id,
             MAX(CASE WHEN game_id = 'game1_1' THEN score END) AS g1,
             MAX(CASE WHEN game_id = 'game2_1' THEN score END) AS g2
           FROM scores
           WHERE game_id IN ('game1_1', 'game2_1')
           GROUP BY user_id
         )
         SELECT COALESCE(NULLIF(TRIM(u.display_name), ''), u.username) AS label,
           (COALESCE(p.g1, 0) + COALESCE(p.g2, 0)) AS best
         FROM per_user p
         JOIN users u ON u.id = p.user_id
         ORDER BY best DESC
         LIMIT ?`
      )
      .all(limit);
    res.json({
      gameId: 'combined',
      entries: rows.map((r) => ({ username: r.label, score: r.best })),
    });
    return;
  }

  if (!SCORE_GAME_IDS.has(gameId)) {
    res.status(400).json({ error: 'gameId không hợp lệ' });
    return;
  }
  const rows = db
    .prepare(
      `SELECT COALESCE(NULLIF(TRIM(u.display_name), ''), u.username) AS label, MAX(s.score) AS best
       FROM scores s
       JOIN users u ON u.id = s.user_id
       WHERE s.game_id = ?
       GROUP BY s.user_id
       ORDER BY best DESC
       LIMIT ?`
    )
    .all(gameId, limit);
  res.json({ gameId, entries: rows.map((r) => ({ username: r.label, score: r.best })) });
});

app.get('/api/players/me/best', authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT game_id, MAX(score) AS best FROM scores WHERE user_id = ? GROUP BY game_id`
    )
    .all(req.userId);
  const out = {};
  for (const r of rows) out[r.game_id] = r.best;
  res.json({ bestByGame: out });
});

app.use(express.static(projectRoot, { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`GPA Destroyer server http://localhost:${PORT}`);
  console.log(`Static root: ${projectRoot}`);
});
