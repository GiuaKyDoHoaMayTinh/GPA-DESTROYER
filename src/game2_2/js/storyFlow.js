/**
 * Kịch bản: vào phòng → ngồi bàn → game1 → game2_1; sau game xong thanh nhà→trường rồi về launcher (học bổng + rank trên menu).
 * API gọi qua window (đăng ký từ index) để tránh import vòng với player.js.
 * Debug: localStorage GPA_DEBUG_STORY=1 → log gameOver / phase.
 */
import { isEmbeddedGameActive, getEmbeddedGameWindow } from './embeddedGame.js';
const STORY_KEY = 'gpa_g2_story_phase';
const SESSION_PLAYER = 'gpa_current_player';

const PHASE = {
  INTRO_WALK: 'intro_walk',
  AT_DESK_HINT: 'at_desk_hint',
  MODAL_G1: 'modal_g1',
  PLAYING_G1: 'playing_g1',
  MODAL_G2: 'modal_g2',
  READY_EMBED: 'ready_embed',
  DONE: 'done',
};

let api = {
  setPlayerTarget: null,
  standUp: null,
  getPlayer: null,
  toggleEmbeddedGame: null,
  deskZone: null,
  bedZone: null,
};

let listenersWired = false;

export function registerStoryApi(a) {
  api = { ...api, ...a };
}

function getPhase() {
  return sessionStorage.getItem(STORY_KEY) || PHASE.INTRO_WALK;
}

function setPhase(p) {
  sessionStorage.setItem(STORY_KEY, p);
}

function el(id) {
  return document.getElementById(id);
}

function showStoryModal(text, onOk) {
  const wrap = el('story-modal-wrap');
  const p = el('story-modal-text');
  const btn = el('story-modal-ok');
  if (!wrap || !p || !btn) return;
  p.textContent = text;
  wrap.hidden = false;
  const handler = () => {
    btn.removeEventListener('click', handler);
    wrap.hidden = true;
    if (onOk) onOk();
  };
  btn.addEventListener('click', handler);
}

function hideG1Frame() {
  const w = el('g1-frame-wrap');
  const f = el('g1-frame');
  if (w) w.hidden = true;
  if (f) f.src = 'about:blank';
}

function showG1Frame() {
  const w = el('g1-frame-wrap');
  const f = el('g1-frame');
  if (!w || !f) return;
  f.src = '../game1_1/credit%20catching%20game/index.html?hub=1&embed=1&v=' + Date.now();
  w.hidden = false;
}

function normalizeRankName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function runEndJourneyBar(done) {
  const wrap = el('end-journey-overlay');
  const fill = el('end-journey-fill');
  if (!wrap || !fill) {
    if (done) done();
    return;
  }
  wrap.hidden = false;
  fill.style.width = '0%';
  const duration = 2800;
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    fill.style.width = Math.round(t * 100) + '%';
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      wrap.hidden = true;
      fill.style.width = '0%';
      if (done) done();
    }
  }
  requestAnimationFrame(step);
}

function getPlayerDisplayName() {
  try {
    return sessionStorage.getItem(SESSION_PLAYER) || '';
  } catch (_) {
    return '';
  }
}

/** Hạng người chơi trên bảng tổng (điểm cao nhất ĐKTC + điểm cao nhất Jerry). */
async function fetchUserCombinedLeaderboardRank() {
  const displayName = getPlayerDisplayName();
  const key = normalizeRankName(displayName);
  if (!key) return null;
  try {
    if (typeof location === 'undefined' || (location.protocol !== 'http:' && location.protocol !== 'https:')) {
      return null;
    }
    const r = await fetch('/api/leaderboards/combined?limit=50');
    if (!r.ok) return null;
    const data = await r.json();
    const entries = data.entries || [];
    for (let i = 0; i < entries.length; i++) {
      if (normalizeRankName(entries[i].username) === key) return i + 1;
    }
    return null;
  } catch (_) {
    return null;
  }
}

const LAUNCHER_FOLLOWUP_KEY = 'gpa_launcher_followup';

function runPostGame2CelebrationThenRank() {
  runEndJourneyBar(async () => {
    let scholarship = false;
    try {
      const rank = await fetchUserCombinedLeaderboardRank();
      scholarship = rank !== null && rank >= 1 && rank <= 3;
    } catch (_) {}
    try {
      sessionStorage.setItem(
        LAUNCHER_FOLLOWUP_KEY,
        JSON.stringify({ scholarship, showRank: true })
      );
    } catch (_) {}
    const home = new URL('../../index.html', window.location.href);
    window.location.href = home.href;
  });
}

export function shouldOpenEmbeddedWhenSitting() {
  return getPhase() === PHASE.READY_EMBED;
}

export function initStoryZones(desk, bed) {
  api.deskZone = desk;
  api.bedZone = bed;
}

export function onModelsReady() {
  const phase = getPhase();
  if (phase === PHASE.INTRO_WALK || phase === PHASE.AT_DESK_HINT) {
    if (api.setPlayerTarget) {
      const p = api.getPlayer && api.getPlayer();
      if (p) {
        p.position.set(0, 0, 3.2);
        p.rotation.y = Math.PI;
        api.setPlayerTarget(-1.0, 0, -0.6);
      }
    }
  }
}

export function storyTick(player) {
  if (!player || !api.setPlayerTarget) return;
  const phase = getPhase();
  if (phase === PHASE.INTRO_WALK) {
    const tx = -1.0;
    const tz = -0.6;
    const dx = player.position.x - tx;
    const dz = player.position.z - tz;
    if (Math.sqrt(dx * dx + dz * dz) < 0.55) {
      setPhase(PHASE.AT_DESK_HINT);
      api.setPlayerTarget(player.position.x, 0, player.position.z);
    }
  }
}

export function onPlayerSatDeskAfterPose() {
  const phase = getPhase();

  if (phase === PHASE.AT_DESK_HINT || phase === PHASE.INTRO_WALK) {
    setPhase(PHASE.MODAL_G1);
    showStoryModal(
      'Để bắt đầu. Bạn hãy thực hiện đăng ký tín chỉ. 2 quả bóng tương đương với 1 tín chỉ. Thu thập đủ số tín chỉ bạn sẽ qua màn.',
      () => {
        setPhase(PHASE.PLAYING_G1);
        showG1Frame();
      }
    );
    return;
  }

  if (phase === PHASE.READY_EMBED && api.toggleEmbeddedGame) {
    api.toggleEmbeddedGame(true);
  }
}

function wireMessages() {
  if (listenersWired) return;
  listenersWired = true;

  window.addEventListener('message', (event) => {
    const d = event.data;
    if (!d || typeof d !== 'object') return;

    if (d.type === 'gpaGame1Exit') {
      if (d.isWin !== true) {
        try {
          if (typeof localStorage !== 'undefined' && localStorage.getItem('GPA_DEBUG_STORY') === '1') {
            console.log('[STORY] gpaGame1Exit ignored (need win)', d);
          }
        } catch (_) {}
        return;
      }
      hideG1Frame();
      setPhase(PHASE.MODAL_G2);
      const p = api.getPlayer && api.getPlayer();
      if (p && api.standUp && api.deskZone && api.bedZone) {
        api.standUp(p, api.deskZone, api.bedZone);
      }
      showStoryModal(
        'Để tích lũy điểm số, bạn tìm cách chạy deadline mà không bị Jerry làm phiền. Hãy click vào Jerry để đuổi nó đi!',
        () => {
          setPhase(PHASE.READY_EMBED);
        }
      );
      return;
    }

    if (d.type === 'gameOver') {
      if (getPhase() !== PHASE.READY_EMBED) return;
      if (typeof d.score !== 'number' || !Number.isFinite(d.score)) return;
      if (!isEmbeddedGameActive()) return;
      const embedWin = getEmbeddedGameWindow();
      if (!embedWin || event.source !== embedWin) return;
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('GPA_DEBUG_STORY') === '1') {
          console.log('[STORY] gameOver accepted', { score: d.score, phase: PHASE.READY_EMBED });
        }
      } catch (_) {}
      setPhase(PHASE.DONE);
      const p = api.getPlayer && api.getPlayer();
      const hideDelay = 5000;
      setTimeout(() => {
        if (api.toggleEmbeddedGame) api.toggleEmbeddedGame(false);
        if (p && api.standUp && api.deskZone && api.bedZone) {
          api.standUp(p, api.deskZone, api.bedZone);
        }
        runPostGame2CelebrationThenRank();
      }, hideDelay);
      return;
    }
  });
}

export function initStoryFlow() {
  const rankWrap = el('rank-modal-wrap');
  if (rankWrap) rankWrap.hidden = true;
  const storyWrap = el('story-modal-wrap');
  if (storyWrap) storyWrap.hidden = true;
  const endJ = el('end-journey-overlay');
  if (endJ) endJ.hidden = true;

  try {
    const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
    if (!q || q.get('continue') !== '1') {
      sessionStorage.removeItem(STORY_KEY);
    }
  } catch (_) {
    sessionStorage.removeItem(STORY_KEY);
  }

  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('GPA_DEBUG_STORY') === '1') {
      console.log('[STORY] initStoryFlow', {
        phase: sessionStorage.getItem(STORY_KEY) || PHASE.INTRO_WALK,
        continueParam: typeof location !== 'undefined' ? new URLSearchParams(location.search).get('continue') : null,
      });
    }
  } catch (_) {}

  wireMessages();
}
