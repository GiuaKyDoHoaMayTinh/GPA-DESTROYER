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
      // Va chạm detected, tìm vị trí an toàn gần nhất giữa oldPosition và newPosition
      return findSafePosition(oldPosition, newPosition, playerRadius);
    }
  }

  // Không va chạm, clamping vào ranh giới phòng
  return clampPlayerPosition(newPosition, playerRadius);
}

function findSafePosition(start, end, playerRadius = 0.4) {
  // Binary search để tìm điểm gần end nhất mà an toàn
  let low = 0;
  let high = 1;
  const iterations = 5; // Số lần binary search
  
  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2;
    const testPos = new THREE.Vector3()
      .copy(start)
      .lerp(end, mid);
    
    const testSphere = new THREE.Sphere(testPos, playerRadius);
    let collision = false;
    
    // Kiểm tra collision tại testPos
    for (const obstacle of OBSTACLES) {
      if (obstacle.box.intersectsSphere(testSphere)) {
        collision = true;
        break;
      }
    }
    
    if (collision) {
      // testPos bị block, tìm về phía start
      high = mid;
    } else {
      // testPos safe, có thể tìm xa hơn về phía end
      low = mid;
    }
  }
  
  // Trả về vị trí an toàn cuối cùng
  const safePos = new THREE.Vector3()
    .copy(start)
    .lerp(end, low);
  
  return clampPlayerPosition(safePos, playerRadius);
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

export function isPositionBlocked(position, playerRadius = 0.4) {
  const playerSphere = new THREE.Sphere(position, playerRadius);
  
  // Kiểm tra va chạm với các obstacle
  for (const obstacle of OBSTACLES) {
    if (obstacle.box.intersectsSphere(playerSphere)) {
      return true; // Vị trí bị block
    }
  }
  
  return false; // Vị trí an toàn
}
