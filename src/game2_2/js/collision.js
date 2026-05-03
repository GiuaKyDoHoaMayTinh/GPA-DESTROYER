// collision.js - Quản lý va chạm và ranh giới phòng

import * as THREE from 'three';

// Định nghĩa ranh giới phòng - Thắt chặt hơn để nhân vật không chạm vào tường
const ROOM_BOUNDS = {
  minX: -4.8,
  maxX: 4.8,
  minZ: -4.3,
  maxZ: 4.6,
};

// Mảng chứa các va chạm động được quét từ model trong scene.js
let dynamicObstacles = [];

// Hàm để scene.js đăng ký các vật thể va chạm từ model GLB
export function addObstacle(box) {
  dynamicObstacles.push({ box });
}

// THÊM HÀM NÀY ĐỂ FIX LỖI "does not provide an export named 'clearObstacles'"
export function clearObstacles() {
  dynamicObstacles = [];
}

// Các vùng cấm cố định - Đã mở rộng kích thước để tạo "vùng đệm" an toàn
const OBSTACLES = [
  // Tường trái & phải (Tăng độ dày để không bị xuyên qua khi đi nhanh)
  { box: new THREE.Box3(new THREE.Vector3(-6, -1, -6), new THREE.Vector3(-4.6, 7, 6)) },
  { box: new THREE.Box3(new THREE.Vector3(4.6, -1, -5), new THREE.Vector3(6, 7, 6)) },
  
  // Tường trước (cửa sổ) & sau (cửa ra vào)
  { box: new THREE.Box3(new THREE.Vector3(-6, -1, -6), new THREE.Vector3(6, 7, -4.1)) },
  { box: new THREE.Box3(new THREE.Vector3(-6, -1, 4.4), new THREE.Vector3(6, 7, 6.5)) },
  
  // Bàn học: Mở rộng ra phía ngoài một chút (minZ và maxX)
  { box: new THREE.Box3(new THREE.Vector3(-5.0, -0.1, -4.8), new THREE.Vector3(-1.4, 2, -2.1)) },
  
  // Ghế: Tạo khối bao quanh toàn bộ ghế
  { box: new THREE.Box3(new THREE.Vector3(-3.4, -0.1, -2.6), new THREE.Vector3(-1.5, 2, -0.8)) },
  
  // Giường: Đây là khu vực hay lỗi nhất, mình nới rộng vùng cản phía trước và bên trái giường
  { box: new THREE.Box3(new THREE.Vector3(0.9, -0.1, -1.3), new THREE.Vector3(5.1, 1.5, 4.7)) },
  
  // Thùng rác
  { box: new THREE.Box3(new THREE.Vector3(-4.9, -0.1, 3.1), new THREE.Vector3(-3.1, 1, 5.1)) },
  
  // Tủ đầu giường (Tab)
  { box: new THREE.Box3(new THREE.Vector3(-0.4, -0.1, -4.9), new THREE.Vector3(1.4, 1.5, -2.7)) },
];

/**
 * Giới hạn vị trí nhân vật trong ranh giới phòng
 */
export function clampPlayerPosition(position, playerRadius = 0.5) {
  const clamped = new THREE.Vector3(position.x, position.y, position.z);

  clamped.x = Math.max(ROOM_BOUNDS.minX + playerRadius, 
                       Math.min(ROOM_BOUNDS.maxX - playerRadius, clamped.x));
  clamped.z = Math.max(ROOM_BOUNDS.minZ + playerRadius, 
                       Math.min(ROOM_BOUNDS.maxZ - playerRadius, clamped.z));

  return clamped;
}

/**
 * Kiểm tra va chạm: Kết hợp cả Obstacles tĩnh và động
 */
export function checkCollision(newPosition, oldPosition, playerRadius = 0.65) {
  // Tăng playerRadius lên 0.65 để bù đắp cho phần mũ và vai của nhân vật
  
  // Gộp tất cả vật cản lại
  const allObstacles = [...OBSTACLES, ...dynamicObstacles];
  
  const finalPos = new THREE.Vector3(newPosition.x, newPosition.y, newPosition.z);
  const playerSphere = new THREE.Sphere(finalPos, playerRadius);

  let collisionDetected = false;
  for (const obstacle of allObstacles) {
    if (obstacle.box.intersectsSphere(playerSphere)) {
      collisionDetected = true;
      break;
    }
  }

  if (collisionDetected) {
    // Thử di chuyển trượt dọc trục X
    const testX = new THREE.Vector3(newPosition.x, oldPosition.y, oldPosition.z);
    let collisionX = false;
    const sphereX = new THREE.Sphere(testX, playerRadius);
    for (const obs of allObstacles) {
      if (obs.box.intersectsSphere(sphereX)) {
        collisionX = true; 
        break;
      }
    }
    
    // Thử di chuyển trượt dọc trục Z
    const testZ = new THREE.Vector3(oldPosition.x, oldPosition.y, newPosition.z);
    let collisionZ = false;
    const sphereZ = new THREE.Sphere(testZ, playerRadius);
    for (const obs of allObstacles) {
      if (obs.box.intersectsSphere(sphereZ)) {
        collisionZ = true; 
        break;
      }
    }

    // Ưu tiên trượt nếu chỉ vướng một trục
    if (!collisionX) return clampPlayerPosition(testX, playerRadius);
    if (!collisionZ) return clampPlayerPosition(testZ, playerRadius);
    
    // Nếu vướng cả hai, ép nhân vật đứng lại tại vị trí cũ hoàn toàn
    return oldPosition.clone();
  }

  // Thực hiện giới hạn trong phòng
  const clampedPos = clampPlayerPosition(newPosition, playerRadius);
  
  // Nếu sau khi clamp mà không di chuyển được đáng kể, giữ vị trí cũ để tránh rung lắc
  if (clampedPos.distanceTo(oldPosition) < 0.001 && newPosition.distanceTo(oldPosition) > 0.01) {
      return oldPosition.clone();
  }

  return clampedPos;
}

export function isNearDeskZone(position, deskZone, radius = 1.8) {
  return position.distanceTo(deskZone) < radius;
}

export function isNearBedZone(position, bedZone, radius = 2.0) {
  return position.distanceTo(bedZone) < radius;
}

export function isNearLampZone(position, lampZone, radius = 1.5) {
  return position.distanceTo(lampZone) < radius;
}

export function getRoomBounds() {
  return ROOM_BOUNDS;
}

export function getObstacles() {
  return [...OBSTACLES, ...dynamicObstacles];
}