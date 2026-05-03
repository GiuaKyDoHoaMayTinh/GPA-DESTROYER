// player.js - Quản lý điều khiển, animation và collision nhân vật

import * as THREE from 'three';
import { showMessage, updateHint, hideActionHint } from './ui.js';
import { checkCollision, isNearDeskZone, isNearBedZone } from './collision.js';
import { CONFIG } from './utils.js';
import { toggleEmbeddedGame } from './embeddedGame.js';
import { getMouseModel } from './scene.js';
import { shouldOpenEmbeddedWhenSitting, onPlayerSatDeskAfterPose } from './storyFlow.js';

let actionState = 'walk';
let isMoving = false;
let walkAnimationTime = 0;
const walkAnimationSpeed = 6; // Tốc độ bobbing
const PLAYER_DEBUG = true;

let playerTarget = new THREE.Vector3(CONFIG.playerStartPos.x, CONFIG.playerStartPos.y, CONFIG.playerStartPos.z); // Vị trí mục tiêu cho nhân vật

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  arrowup: false,
  arrowleft: false,
  arrowdown: false,
  arrowright: false,
};

function playerDebug(tag, extra = {}) {
  if (!PLAYER_DEBUG) return;
  console.log('[PLAYER_STATE]', tag, {
    actionState,
    isMoving,
    ...extra,
  });
}

export function initPlayer() {
  actionState = 'walk';
  isMoving = false;
  walkAnimationTime = 0;
  playerTarget.set(CONFIG.playerStartPos.x, CONFIG.playerStartPos.y, CONFIG.playerStartPos.z);
  Object.keys(keys).forEach(key => keys[key] = false);
}

export function getActionState() {
  return actionState;
}

export function setPlayerTarget(x, y, z) {
  playerTarget.set(x, y, z);
}

export function getPlayerTarget() {
  return playerTarget;
}

export function updatePlayerInput(key, isPressed) {
  if (keys.hasOwnProperty(key)) {
    keys[key] = isPressed;
  }
}

export function updatePlayerMovement(player, dt) {
  if (!player || actionState !== 'walk') {
    isMoving = false;
    return;
  }

  const direction = new THREE.Vector3().subVectors(playerTarget, player.position);
  const distance = direction.length();

  if (distance < 0.1) {
    // Đã tới target, dừng
    isMoving = false;
    return;
  }

  isMoving = true;

  // Normalize direction
  direction.normalize();

  // Cập nhật hướng nhân vật
  const angle = Math.atan2(direction.x, direction.z);
  player.rotation.y = angle;

  // Tính vị trí mới
  const move = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  const speed = 2.8;
  const newPosition = new THREE.Vector3()
    .copy(player.position)
    .addScaledVector(move, speed * dt);

  // Kiểm tra collision và clamping
  const safePosition = checkCollision(newPosition, player.position);
  player.position.copy(safePosition);

  // Cập nhật animation đi bộ (bỏ bobbing)
  walkAnimationTime += dt * walkAnimationSpeed;
}

export function setPlayerPose(player, position, rotationY, stateText, rotationX = 0, rotationZ = 0) {
  if (!player) return;
  playerDebug('setPlayerPose:begin', {
    nextState: stateText,
    x: position.x,
    y: position.y,
    z: position.z,
  });
  player.position.copy(position);
  player.rotation.set(rotationX, rotationY, rotationZ);
  actionState = stateText;
  isMoving = false;
  walkAnimationTime = 0;

  // Toggle embedded game khi ngồi bàn (theo kịch bản — lần đầu chỉ hướng dẫn + game1)
  if (stateText === 'sit') {
    const openEmbedded = shouldOpenEmbeddedWhenSitting();
    toggleEmbeddedGame(openEmbedded);
    showMessage(
      openEmbedded
        ? 'Bạn đã ngồi vào bàn. Chơi game trên màn hình máy tính!'
        : 'Bạn đã ngồi vào bàn.'
    );
  } else {
    toggleEmbeddedGame(false);
    if (stateText === 'lie') {
      showMessage('Bạn đã nằm trên giường.');
    }
    hideActionHint();
  }
}

export function sitAtDesk(player, deskZone) {
  const newPos = new THREE.Vector3(deskZone.x + 0.5, -0.5, deskZone.z + 0.15);
  setPlayerPose(player, newPos, -Math.PI / 2, 'sit');
  onPlayerSatDeskAfterPose();

  import('./mouse.js').then((mouse) => {
    const mouseModel = getMouseModel();
    if (mouseModel) {
      mouse.showMouseOnMesa(mouseModel);
    }
  }).catch(() => {
    // ignore if mouse module not available
  });
}

export function lieOnBed(player, bedZone) {
  const newPos = new THREE.Vector3(bedZone.x , -1.2, bedZone.z-0.25);
  setPlayerPose(player, newPos, 0 , 'lie',-Math.PI / 5.5);
}

export function standUp(player, deskZone, bedZone) {
  playerDebug('standUp:called', {
    hasPlayer: !!player,
    embeddedLikelyFromSit: actionState === 'sit',
  });
  if (!player || actionState === 'walk') {
    playerDebug('standUp:skipped', { hasPlayer: !!player });
    return;
  }

  let newPos;
  let rotationY = player.rotation.y;

  if (actionState === 'sit') {
    newPos = new THREE.Vector3(deskZone.x + 1.5, 0, deskZone.z + 1);
    rotationY = Math.PI;
  } else if (actionState === 'lie') {
    newPos = new THREE.Vector3(bedZone.x - 2.5, 0, bedZone.z - 0.5);
    rotationY = -Math.PI / 2;
  } else {
    playerDebug('standUp:skipped:unknownState');
    return;
  }

  player.position.copy(newPos);
  player.position.y = 0;
  player.rotation.set(0, rotationY, 0);
  playerTarget.copy(newPos);
  
  // Tắt embedded game khi đứng dậy
  toggleEmbeddedGame(false);
  window.dispatchEvent(new CustomEvent('force-camera-default'));
  
  actionState = 'walk';
  isMoving = false;
  walkAnimationTime = 0;
  hideActionHint();
  playerDebug('standUp:completed', {
    x: newPos.x,
    y: newPos.y,
    z: newPos.z,
  });
  showMessage('Bạn đã đứng dậy. Tiếp tục đi khám phá.');

  import('./mouse.js').then((mouse) => {
    const mouseModel = getMouseModel();
    if (mouseModel) {
      mouse.hideMouse(mouseModel);
    }
  }).catch(() => {
    // ignore if mouse module not available
  });
}

export function tryInteract(player, deskZone, bedZone) {
  playerDebug('tryInteract:called', { hasPlayer: !!player });
  if (!player || actionState !== 'walk') {
    playerDebug('tryInteract:skipped', { hasPlayer: !!player });
    return;
  }

  const distanceDesk = player.position.distanceTo(deskZone);
  const distanceBed = player.position.distanceTo(bedZone);
  playerDebug('tryInteract:distances', { distanceDesk, distanceBed });

  if (distanceDesk <= distanceBed) {
    sitAtDesk(player, deskZone);
  } else {
    lieOnBed(player, bedZone);
  }
}
