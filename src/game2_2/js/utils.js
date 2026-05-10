// utils.js - Các hàm tiện ích chung

export const CONFIG = {
  deskZone: { x: -2.2, y: 0, z: -1.3 },
  bedZone: { x: 2.5, y: 0, z: -1.0 },
  lampZone: { x: 0.3, y: 0, z: -3.6 },
  zoneRadius: 1.4,
  lampRadius: 3,
  playerScale: 0.9,
  playerStartPos: {x: -3, y: 0, z: 3.5},
  playerStartRot: Math.PI/2,
  mouseScale: 0.5,
  mouseStartPos: { x: 1.7, y: 0, z: 1.8 },
  playerSpeed: 2.8,
  cameraHeight: 3.4,
  cameraDistance: 5.5,
  cameraLerpFactor: 0.12,
};

export function createVector3(x, y, z) {
  // Hàm helper để tạo Vector3 (sẽ được import từ THREE)
  return { x, y, z };
}

export function distance(pos1, pos2) {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
