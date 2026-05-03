// ui.js - Quản lý giao diện người dùng

import { isNearDeskZone, isNearBedZone } from './collision.js';
import { shouldOpenEmbeddedWhenSitting } from './storyFlow.js';

const hintElement = document.getElementById('hint');
const actionHintElement = document.getElementById('actionHint');
const messageElement = document.getElementById('message');
let messageTimeout = null;

/** Khi GLTF / LoadingManager báo tiến độ — ưu tiên hiển thị thay vì "Đang tải mô hình..." tĩnh */
let modelLoadState = null;

/** Intro mở cửa (video HTML): player chưa có — tránh hiện "Đang khởi tạo…" gây hiểu nhầm lỗi. */
let doorIntroHint = false;

export function setDoorIntroHint(on) {
  doorIntroHint = !!on;
}

export function setModelLoadProgress(loaded, total, label) {
  modelLoadState = {
    loaded: Math.max(0, loaded),
    total: Math.max(1, total),
    label: label || 'Đang tải',
  };
}

export function clearModelLoadProgress() {
  modelLoadState = null;
}

export function initUI() {
  if (!hintElement || !actionHintElement || !messageElement) {
    console.error('UI elements not found');
  }

  hideActionHint();
}

export function showActionHint(text) {
  if (!actionHintElement) return;
  actionHintElement.textContent = text;
  actionHintElement.style.display = 'block';
}

export function hideActionHint() {
  if (!actionHintElement) return;
  actionHintElement.textContent = '';
  actionHintElement.style.display = 'none';
}

export function playBgMusic() {
  const bgMusic = document.getElementById('bgMusic');
  if (bgMusic && bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
}

export function pauseBgMusic() {
  const bgMusic = document.getElementById('bgMusic');
  if (bgMusic && !bgMusic.paused) {
    bgMusic.pause();
  }
}

export function showMessage(text) {
  if (!messageElement) return;
  messageElement.textContent = text;
  messageElement.style.opacity = '1';
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => {
    messageElement.style.opacity = '0';
  }, 3000);
}

export function updateHint(playerPosition, actionState, deskZone, bedZone, lampZone, lampOn, zoneRadius) {
  if (modelLoadState) {
    const pct = Math.round((modelLoadState.loaded / modelLoadState.total) * 100);
    hintElement.textContent =
      modelLoadState.label + ' — ' + modelLoadState.loaded + '/' + modelLoadState.total + ' (' + pct + '%)';
    if (actionHintElement) actionHintElement.textContent = '';
    return;
  }

  if (doorIntroHint) {
    hintElement.textContent = '🚪 Đang mở cửa…';
    if (actionHintElement) actionHintElement.textContent = '';
    return;
  }

  if (!playerPosition) {
    hintElement.textContent = 'Đang khởi tạo…';
    if (actionHintElement) actionHintElement.textContent = '';
    return;
  }

  if (actionState === 'walk') {
    const distanceDesk = playerPosition.distanceTo(deskZone);
    const distanceBed = playerPosition.distanceTo(bedZone);
    const distanceLamp = playerPosition.distanceTo(lampZone);
    const interactionDistance = 1.2;

    if (distanceLamp < interactionDistance) {
      hintElement.textContent = lampOn
        ? '💡 Đèn đầu giường BẬT - Nhấn P để tắt'
        : '💡 Đèn đầu giường TẮT - Nhấn P để bật';
    } else if (distanceDesk < interactionDistance) {
      hintElement.textContent = '✅ Nhấn E để ngồi vào bàn';
    } else if (distanceBed < interactionDistance) {
      hintElement.textContent = '✅ Nhấn E để nằm lên giường';
    } else if (distanceLamp < 2.0) {
      hintElement.textContent = '🚶 Tiếp cận gần đèn hơn - Nhấn P để bật/tắt';
    } else if (distanceDesk < 2.0) {
      hintElement.textContent = '🚶 Tiếp cận gần bàn hơn - Nhấn E để ngồi';
    } else if (distanceBed < 2.0) {
      hintElement.textContent = '🚶 Tiếp cận gần giường hơn - Nhấn E để nằm';
    } else {
      hintElement.textContent = '🖱️ Click để di chuyển';
    }
  } else if (actionState === 'sit') {
    hintElement.textContent = '🪑 Bạn đang ngồi - Bấm Space để đứng.';
    if (shouldOpenEmbeddedWhenSitting()) {
      showActionHint('Bấm Enter để bắt đầu');
    } else {
      hideActionHint();
    }
  } else {
    hideActionHint();
  }
}
