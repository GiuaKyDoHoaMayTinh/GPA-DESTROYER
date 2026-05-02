// camera.js - Quản lý camera cố định ở góc phòng

import * as THREE from 'three';
import { getActionState } from './player.js';
import { isEmbeddedGameActive } from './embeddedGame.js';

let camera;
const DEFAULT_CAMERA_POS = new THREE.Vector3(5, 7.5, 5);
const DEFAULT_CAMERA_LOOK_AT = new THREE.Vector3(0, 2, 0);
const SIT_CAMERA_POS = new THREE.Vector3(-0.5, 5, -1.5);
const SIT_CAMERA_LOOK_AT = new THREE.Vector3(-3, 3, -1.5);
let forceDefaultCameraUntil = 0;

export function initCamera(width, height) {
  camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 2000);
  camera.position.copy(DEFAULT_CAMERA_POS);
  camera.lookAt(DEFAULT_CAMERA_LOOK_AT);

  window.addEventListener('embedded-visibility-change', (event) => {
    if (!event.detail || event.detail.visible !== false) return;
    forceDefaultCameraUntil = performance.now() + 600;
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.lookAt(DEFAULT_CAMERA_LOOK_AT);
  });

  window.addEventListener('force-camera-default', () => {
    forceDefaultCameraUntil = performance.now() + 1000;
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.lookAt(DEFAULT_CAMERA_LOOK_AT);
  });

  return camera;
}

export function updateCameraFollow(player, camera) {
  if (!camera) return;

  const now = performance.now();
  if (now < forceDefaultCameraUntil) {
    camera.position.copy(DEFAULT_CAMERA_POS);
    camera.lookAt(DEFAULT_CAMERA_LOOK_AT);
    return;
  }

  const actionState = getActionState();
  const embeddedActive = isEmbeddedGameActive();

  if (actionState === 'sit' && embeddedActive) {
    // Khi ngồi vào ghế, đổi góc camera nhìn vào màn hình
    camera.position.copy(SIT_CAMERA_POS);
    camera.lookAt(SIT_CAMERA_LOOK_AT);
    return;
  }

  // Khi không ngồi (walk/lie), luôn trả camera về góc phòng mặc định.
  camera.position.copy(DEFAULT_CAMERA_POS);
  camera.lookAt(DEFAULT_CAMERA_LOOK_AT);
}

export function getCamera() {
  return camera;
}

export function updateCameraAspect(width, height) {
  if (!camera) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
