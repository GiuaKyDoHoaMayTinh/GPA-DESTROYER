// player.js - Quản lý điều khiển, animation và collision nhân vật

import * as THREE from 'three';
import { showMessage, updateHint, hideActionHint } from './ui.js';
import { checkCollision, isNearDeskZone, isNearBedZone } from './collision.js';
import { CONFIG } from './utils.js';
import { toggleEmbeddedGame } from './embeddedGame.js';
import { getMouseModel, playerMixer, playerAnimations, playerStandAnimations } from './scene.js'; // THÊM IMPORT
import { shouldOpenEmbeddedWhenSitting, onPlayerSatDeskAfterPose } from './storyFlow.js';

let actionState = 'walk';
let isMoving = false;
let walkAnimationTime = 0;
const walkAnimationSpeed = 6; // Tốc độ bobbing
const PLAYER_DEBUG = true;

// Thêm biến quản lý action hiện tại để fade
let currentAction = null;
let walkAction = null;

// FIX LỖI 1: Thay đổi tọa độ cứng (0, 0, 2.4) thành vị trí mặc định từ CONFIG để không tự chạy khi vừa load
let playerTarget = new THREE.Vector3();

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

// --- HÀM THÊM: Chuyển đổi animation mượt mà ---
function fadeToAction(newAction, duration = 0.2) {
  if (!newAction || currentAction === newAction) return;
  
  // Đảm bảo action mới được cấu hình đúng
  newAction.reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();

  if (currentAction) {
    currentAction.fadeOut(duration);
  }
  
  currentAction = newAction;
}

function playerDebug(tag, extra = {}) {
  if (!PLAYER_DEBUG) return;
  console.log('[PLAYER_STATE]', tag, {
    actionState,
    isMoving,
    ...extra,
  });
}

export function initPlayer(player) {
  actionState = 'walk';
  isMoving = false;
  walkAnimationTime = 0;
  if (player) {
        // Ép mục tiêu trùng khít với vị trí thực tế của nhân vật lúc load
        playerTarget.copy(player.position); 
    }
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

// Giữ API cũ nhưng cập nhật lại cách lấy walkAction từ playerAnimations
export function setPlayerAnimationMixer(m, _unused) {
  // Mixer giờ đã được khởi tạo bên scene.js và export qua playerMixer
  if (playerAnimations && playerAnimations.length > 0) {
    // Tìm animation đi bộ (thường có tên chứa 'walk' hoặc 'v001' tùy model)
    const walkClip = playerAnimations.find(a => 
      a.name.toLowerCase().includes('walk') || 
      a.name.toLowerCase().includes('v001')
    ) || playerAnimations[0];
    
    walkAction = playerMixer.clipAction(walkClip);
  }
}

export function updatePlayerMovement(player, dt) {
  if (!player || actionState !== 'walk') {
    isMoving = false;
    return;
  }

  // Cập nhật mixer để xương chuyển động (CỰC KỲ QUAN TRỌNG)
  if (playerMixer) playerMixer.update(dt);

  const direction = new THREE.Vector3().subVectors(playerTarget, player.position);
  const distance = direction.length();

  // TỰ ĐỘNG KHỞI TẠO WALK ACTION NẾU CHƯA CÓ
  if (!walkAction && playerMixer && playerAnimations.length > 0) {
    const walkClip = playerAnimations.find(a => 
      a.name.toLowerCase().includes('walk') || 
      a.name.toLowerCase().includes('v001')
    ) || playerAnimations[0];
    walkAction = playerMixer.clipAction(walkClip);
  }

  // KIỂM TRA DỪNG
  if (distance < 0.15) {
    if (isMoving) {
      isMoving = false;
      // Chuyển sang animation đứng yên (stand.glb)
      if (playerMixer && playerStandAnimations.length > 0) {
        fadeToAction(playerMixer.clipAction(playerStandAnimations[0]));
      } else if (currentAction) {
        currentAction.fadeOut(0.2); // Fallback nếu không có animation đứng
      }
    }
    return;
  }

  // BẮT ĐẦU DI CHUYỂN
  isMoving = true;

  // Chuyển sang animation đi bộ
  if (walkAction) {
    fadeToAction(walkAction);
  }

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

  // Kiểm tra collision - Truyền thêm bán kính va chạm (0.7) để chặn đâm xuyên tường hiệu quả hơn
  const safePosition = checkCollision(newPosition, player.position, 0.7);
  
  // FIX LỖI 2: Nếu bị kẹt (vị trí an toàn bằng vị trí cũ), ép playerTarget về vị trí hiện tại để dừng hẳn
  if (safePosition.distanceTo(player.position) < 0.01 && distance > 0.2) {
    playerTarget.copy(player.position);
    if (playerMixer && playerStandAnimations.length > 0) {
      fadeToAction(playerMixer.clipAction(playerStandAnimations[0]));
    }
    isMoving = false;
  }

  player.position.copy(safePosition);
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
  // Cập nhật target khi thay đổi tư thế để không bị lỗi giật vị trí khi đứng dậy
  playerTarget.copy(position);

  // Dừng mọi animation khi ngồi/nằm
  if (currentAction) {
    currentAction.fadeOut(0.1);
    currentAction = null;
  }

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
  const newPos = new THREE.Vector3(deskZone.x + 0.5, -0.5, deskZone.z + 0.35);
  setPlayerPose(player, newPos, -Math.PI / 2, 'sit');
  onPlayerSatDeskAfterPose();

  import('./mouse.js').then((mouse) => {
    const mouseModel = getMouseModel();
    if (mouseModel) {
      mouse.showMouseOnMesa(mouseModel);
    }
  }).catch(() => {});
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
  
  toggleEmbeddedGame(false);
  window.dispatchEvent(new CustomEvent('force-camera-default'));
  
  actionState = 'walk';
  isMoving = false;
  walkAnimationTime = 0;
  hideActionHint();

  // Khi đứng dậy thì phát ngay animation idle (đứng yên)
  if (playerMixer && playerStandAnimations.length > 0) {
    fadeToAction(playerMixer.clipAction(playerStandAnimations[0]));
  }

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
  }).catch(() => {});
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