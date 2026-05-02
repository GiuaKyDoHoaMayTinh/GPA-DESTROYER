// collision.js - Quản lý va chạm và ranh giới phòng

import * as THREE from 'three';

// Định nghĩa ranh giới phòng và các vật thể
const ROOM_BOUNDS = {
  minX: -5.5,
  maxX: 5.5,
  minZ: -5,
  maxZ: 5.2,
};

// Các vùng cấm (tường, bàn, giường, etc) - sử dụng bounding boxes
const OBSTACLES = [
  // Tường trái
  { box: new THREE.Box3(new THREE.Vector3(-6, -1, -6), new THREE.Vector3(-4, 7, 6)) },
  // Tường phải
  { box: new THREE.Box3(new THREE.Vector3(5, -1, -5), new THREE.Vector3(6, 7, 6)) },
  // Tường trước
  { box: new THREE.Box3(new THREE.Vector3(-5.5, -1, -6), new THREE.Vector3(6, 7, -4.5)) },
  // Tường sau
  { box: new THREE.Box3(new THREE.Vector3(-6, -1, 5.5), new THREE.Vector3(6, 7, 6.5)) },
  // Bàn học
  { box: new THREE.Box3(new THREE.Vector3(-4.5, -0.1, -4.0), new THREE.Vector3(-2.5, 2, 1)) },
  // Ghế
  { box: new THREE.Box3(new THREE.Vector3(-2.8, -0.1, -2), new THREE.Vector3(-1.2, 2.6, -0.4)) },
  // Giường
  { box: new THREE.Box3(new THREE.Vector3(1.5, -0.1, -2.0), new THREE.Vector3(5.0, 0.5, 4.0)) },
  // Thùng rác
  { box: new THREE.Box3(new THREE.Vector3(-4.0, -0.1, 1.5), new THREE.Vector3(-3.7, 0.5, 2)) },
  // Tủ đầu giường
  { box: new THREE.Box3(new THREE.Vector3(-0.5, -0.1, -4.5), new THREE.Vector3(1, 1.5, -2.5)) },
];

export function clampPlayerPosition(position, playerRadius = 0.4) {
  const clamped = new THREE.Vector3(position.x, position.y, position.z);

  // Giới hạn ranh giới phòng
  clamped.x = Math.max(ROOM_BOUNDS.minX + playerRadius, 
                       Math.min(ROOM_BOUNDS.maxX - playerRadius, clamped.x));
  clamped.z = Math.max(ROOM_BOUNDS.minZ + playerRadius, 
                       Math.min(ROOM_BOUNDS.maxZ - playerRadius, clamped.z));

  return clamped;
}

export function checkCollision(newPosition, oldPosition, playerRadius = 0.4) {
  const playerSphere = new THREE.Sphere(newPosition, playerRadius);

  // Kiểm tra va chạm với các obstacle
  for (const obstacle of OBSTACLES) {
    if (obstacle.box.intersectsSphere(playerSphere)) {
      // Va chạm detected, giữ vị trí cũ
      return oldPosition.clone();
    }
  }

  // Không va chạm, clamping vào ranh giới phòng
  return clampPlayerPosition(newPosition, playerRadius);
}

export function isNearDeskZone(position, deskZone, radius = 1.5) {
  return position.distanceTo(deskZone) < radius;
}

export function isNearBedZone(position, bedZone, radius = 1.5) {
  return position.distanceTo(bedZone) < radius;
}

export function isNearLampZone(position, lampZone, radius = 1.5) {
  return position.distanceTo(lampZone) < radius;
}

export function getRoomBounds() {
  return ROOM_BOUNDS;
}

export function getObstacles() {
  return OBSTACLES;
}
