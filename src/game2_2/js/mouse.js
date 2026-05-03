// mouse.js - Quản lý animation và AI chuột

import * as THREE from 'three';

const tableX = -4.47;
const tableY = 2;
const minZ = -3.5;
const maxZ = 0.4;
const mouseSpeed = 2;
const chasedSpeed = mouseSpeed + 3; // Tốc độ khi bị đuổi

let mouseTarget = new THREE.Vector3(tableX, tableY, maxZ);
let mouseVisible = false;
let isMoving = false;
let currentTarget = 'max'; // 'max' or 'min'
let allowedToAppear = false;
let respawnTimer = null;
let threatTimer = null;
let isChased = false; // Trạng thái bị đuổi

// Audio management
let mouseRunSound = null;
let mouseThreatenSound = null;
let mouseChasedSound = null;

export function initMouse() {
  mouseTarget = new THREE.Vector3(tableX, tableY, maxZ);
  mouseVisible = false;
  isMoving = false;
  currentTarget = 'max';
  allowedToAppear = false;
  isChased = false;
  clearRespawnTimer();
  
  // Get audio elements
  mouseRunSound = document.getElementById('mouseRunSound');
  mouseThreatenSound = document.getElementById('mouseThreatenSound');
  mouseChasedSound = document.getElementById('mouseChasedSound');
}

function clearRespawnTimer() {
  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }
}


function clearThreatTimer() {
  if (threatTimer) {
    clearTimeout(threatTimer);
    threatTimer = null;
  }
}

// Sound management functions
function playMouseRunSound() {
  if (!mouseRunSound) return;
  mouseRunSound.currentTime = 0;
  mouseRunSound.volume = 1.0;
  mouseRunSound.play().catch(() => {});
}

function playMouseThreatenSound() {
  if (!mouseThreatenSound) return;
  mouseThreatenSound.currentTime = 0;
  mouseThreatenSound.volume = 1.0;
  mouseThreatenSound.play().catch(() => {});
}

function playMouseChasedSound() {
  if (!mouseChasedSound) return;
  mouseChasedSound.currentTime = 0;
  mouseChasedSound.volume = 1.0;
  mouseChasedSound.play().catch(() => {});
}

function stopAllMouseSounds() {
  if (mouseRunSound) mouseRunSound.pause();
  if (mouseThreatenSound) mouseThreatenSound.pause();
  if (mouseChasedSound) mouseChasedSound.pause();
}


function scheduleAppearance(mouseModel, delay) {
  clearRespawnTimer();
  if (!allowedToAppear || !mouseModel) return;

  respawnTimer = setTimeout(() => {
    if (!allowedToAppear) return;
    showMouseOnMesa(mouseModel);
  }, delay);
}

export function allowMouseLifecycle(mouseModel) {
  allowedToAppear = true;
  clearRespawnTimer();
  if (mouseModel) {
    scheduleAppearance(mouseModel, 5000);
  }
}

export function stopMouseLifecycle(mouseModel) {
  allowedToAppear = false;
  clearRespawnTimer();
  if (mouseModel) {
    hideMouse(mouseModel);
  }
}

export function showMouseOnMesa(mouseModel) {
  if (!mouseModel || !allowedToAppear) return;
  clearRespawnTimer();
  mouseVisible = true;
  currentTarget = 'max';
  isChased = false; // Reset trạng thái bị đuổi khi xuất hiện lại
  mouseModel.visible = true;
  mouseModel.name = 'Chuột_Phá_Hoại';
  mouseModel.position.set(tableX, tableY, minZ);
  mouseTarget.set(tableX, tableY, maxZ);
  isMoving = true;
  playMouseRunSound();
}

export function hideMouse(mouseModel) {
  if (!mouseModel) return;
  clearThreatTimer();
  window.dispatchEvent(new CustomEvent('mouse-blackout-off'));
  mouseVisible = false;
  mouseModel.visible = false;
  isMoving = false;
  stopAllMouseSounds();
}

export function isMouseVisible() {
  return mouseVisible;
}

export function handleMouseClick(raycaster, camera, scene) {
  if (!mouseVisible || !scene) return false;

  const mouseModel = scene.getObjectByName('Chuột_Phá_Hoại');
  if (!mouseModel) return false;

  const intersects = raycaster.intersectObject(mouseModel, true);
  if (intersects.length > 0) {
  
    clearThreatTimer();
    window.dispatchEvent(new CustomEvent('mouse-blackout-off'));
    playMouseChasedSound();
    isChased = true; // Chuột bị đuổi, tăng tốc độ

    if (currentTarget === 'max') {
      currentTarget = 'min';
      mouseTarget.set(tableX, tableY, minZ);
    } else {
      currentTarget = 'max';
      mouseTarget.set(tableX, tableY, maxZ);
    }
    isMoving = true;
    return true;
  }
  return false;
}

export function updateMouseMovement(mouseModel, dt) {
  if (!mouseModel || !mouseVisible || !isMoving) return;

  const direction = new THREE.Vector3().subVectors(mouseTarget, mouseModel.position);

  if (direction.length() < 0.05) {

    isMoving = false; // Stop when reached target
    isChased = false; // Reset trạng thái bị đuổi khi dừng lại

    if (currentTarget === 'max') {
      mouseModel.rotation.y += -Math.PI/6;
    
    // 🧨 Bắt đầu đe doạ: sau 3s sẽ làm tối màn hình game2D
      clearThreatTimer();
      playMouseThreatenSound();
      threatTimer = setTimeout(() => {
        if (mouseVisible && currentTarget === 'max') {
          window.dispatchEvent(new CustomEvent('mouse-blackout-on'));
        }
      }, 3000);

      return;
    }

    if (currentTarget === 'min' && allowedToAppear) {
      const delay = Math.random() * 9000 + 1000; // 1..10s
      scheduleAppearance(mouseModel, delay);
    }

    return;
  }

  direction.normalize();
  // Sử dụng tốc độ cao hơn khi bị đuổi
  const currentSpeed = isChased ? chasedSpeed : mouseSpeed;
  mouseModel.position.addScaledVector(direction, currentSpeed * dt);
  mouseModel.position.x = tableX;
  mouseModel.position.y = tableY;
  mouseModel.rotation.y = Math.atan2(direction.x, direction.z);
}

export function getMouseTarget() {
  return mouseTarget;
}

export function setMouseTarget(x, y, z) {
  mouseTarget.set(x, y, z);
}
