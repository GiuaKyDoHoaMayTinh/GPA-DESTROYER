// mouse.js - Quản lý animation và AI chuột

import * as THREE from 'three';
import { getScene, getRenderer } from './scene.js';

const tableX = -4.47;
const tableY = 2;
const minZ = -3.5;
const maxZ = 0.4;
const mouseSpeed = 2;
const chasedSpeed = mouseSpeed + 3; // Tốc độ khi bị đuổi
const chatBoxTargetPos = new THREE.Vector3(-5.313, 2.5, 0.6); // Vị trí hiển thị khungchat


let mouseTarget = new THREE.Vector3(tableX, tableY, maxZ);
let mouseVisible = false;
let isMoving = false;
let currentTarget = 'max'; // 'max' or 'min'
let allowedToAppear = false;
let respawnTimer = null;
let threatTimer = null;
let isChased = false; // Trạng thái bị đuổi

let mouseRunSound = null;
let mouseThreatenSound = null;
let mouseChasedSound = null;
let chatBoxSprite = null;
let chatBoxTexture = null;
let chatBoxAspect = 1;
let isFirstMouseAppearance = true;

export function initMouse() {
  mouseTarget = new THREE.Vector3(tableX, tableY, maxZ);
  mouseVisible = false;
  isMoving = false;
  currentTarget = 'max';
  allowedToAppear = false;
  isChased = false;
  clearRespawnTimer();
  isFirstMouseAppearance = true;
  
  // Get audio elements
  mouseRunSound = document.getElementById('mouseRunSound');
  mouseThreatenSound = document.getElementById('mouseThreatenSound');
  mouseChasedSound = document.getElementById('mouseChasedSound');
  
  // Load chat box texture in background
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    '../../assets/2D/khungchat.png',
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const renderer = getRenderer();
      if (renderer) {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      texture.needsUpdate = true;
      chatBoxTexture = texture;
      if (texture.image && texture.image.width && texture.image.height) {
        chatBoxAspect = texture.image.width / texture.image.height;
      }
    },
    undefined,
    (error) => {
      console.warn('Error loading khungchat.png:', error);
    }
  );
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
  
  // Remove chat box sprite from scene
  if (chatBoxSprite) {
    try {
      getScene().remove(chatBoxSprite);
    } catch (e) {
      console.warn('Could not remove chat box sprite:', e);
    }
    chatBoxSprite = null;
  }
  
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
    
    // Remove chat box when mouse is clicked
    if (chatBoxSprite) {
      try {
        getScene().remove(chatBoxSprite);
      } catch (e) {}
      chatBoxSprite = null;
    }
    
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
      
      // Hiển thị khungchat khi chuột dừng lại ở ổ điện
      if (isFirstMouseAppearance && chatBoxTexture) {
        const material = new THREE.SpriteMaterial({
          map: chatBoxTexture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        });
        chatBoxSprite = new THREE.Sprite(material);
        chatBoxSprite.center.set(0.82, 0.77);
        chatBoxSprite.scale.set(2 * chatBoxAspect, 2, 1);
        chatBoxSprite.position.copy(chatBoxTargetPos);
        chatBoxSprite.position.x += 0.25;
        chatBoxSprite.position.y += 0.45;
        chatBoxSprite.position.z += 0.05;
        chatBoxSprite.renderOrder = 999;
        try {
          getScene().add(chatBoxSprite);
        } catch (e) {
          console.warn('Could not add chat box sprite to scene:', e);
          chatBoxSprite = null;
        }
        isFirstMouseAppearance = false;
      }
    
    // 🧨 Bắt đầu đe doạ: sau 3s sẽ làm tối màn hình game2D
      clearThreatTimer();
      playMouseThreatenSound();
      threatTimer = setTimeout(() => {
        if (mouseVisible && currentTarget === 'max') {
          // Remove chat box before blackout
          if (chatBoxSprite) {
            try {
              getScene().remove(chatBoxSprite);
            } catch (e) {}
            chatBoxSprite = null;
          }
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
