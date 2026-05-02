// embeddedGame.js - Quản lý game2_1 embedded trên màn hình máy tính

import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

let css3dRenderer = null;
let embeddedGameObject = null;
/** @type {HTMLIFrameElement | null} */
let embeddedIframeEl = null;
let screenMesh = null;
let isGameActive = false;
let messageListenerAdded = false;
let embeddedExitHandler = null;
let isGame2DRunning = false;

async function forceStandUpFromEmbeddedSpace() {
  try {
    const [{ standUp }, { getPlayer }, { CONFIG }] = await Promise.all([
      import('./player.js'),
      import('./scene.js'),
      import('./utils.js'),
    ]);

    const player = getPlayer();
    const deskZone = new THREE.Vector3(CONFIG.deskZone.x, CONFIG.deskZone.y, CONFIG.deskZone.z);
    const bedZone = new THREE.Vector3(CONFIG.bedZone.x, CONFIG.bedZone.y, CONFIG.bedZone.z);

    console.log('[EMBED_PARENT] forceStandUpFromEmbeddedSpace:before', {
      hasPlayer: !!player,
      embeddedActive: isGameActive,
    });

    standUp(player, deskZone, bedZone);

    console.log('[EMBED_PARENT] forceStandUpFromEmbeddedSpace:after');
  } catch (error) {
    console.error('[EMBED_PARENT] forceStandUpFromEmbeddedSpace:error', error);
  }
}

function attachEmbeddedKeyboardBridge(iframe) {
  if (!iframe || !iframe.contentWindow || !iframe.contentWindow.document) return;

  const iframeDocument = iframe.contentWindow.document;
  if (iframeDocument.__spaceExitBridgeAttached) return;

  iframeDocument.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;
    
  // ✅ Game2D đang chạy → KHÓA Space thoát
    if (isGame2DRunning) {
      return; // Space hoàn toàn thuộc về game2D
    }

    // ✅ Game2D KHÔNG chạy → Space thoát bình thường
    event.preventDefault();
    event.stopPropagation();

    if (typeof embeddedExitHandler === 'function') {
      embeddedExitHandler();
    } else {
      forceStandUpFromEmbeddedSpace();
    }
  }, true);

  iframeDocument.__spaceExitBridgeAttached = true;
}

export function initEmbeddedGame(scene, screenMesh) {
  if (!screenMesh) {
    console.warn('⚠️ Không tìm thấy màn hình để ghép game');
    return;
  }

  screenMesh = screenMesh;

  // Tạo CSS3DRenderer
  css3dRenderer = new CSS3DRenderer();
  css3dRenderer.setSize(window.innerWidth, window.innerHeight);
  css3dRenderer.domElement.style.position = 'absolute';
  css3dRenderer.domElement.style.top = '0';
  css3dRenderer.domElement.style.left = '0';
  css3dRenderer.domElement.style.pointerEvents = 'none';
  document.body.appendChild(css3dRenderer.domElement);

  // Tạo iframe cho game2_1
  const iframe = document.createElement('iframe');
  embeddedIframeEl = iframe;
  iframe.src = '../game2_1/index.html';
  iframe.style.width = '1920px';
  iframe.style.height = '1080px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.addEventListener('load', () => {
    attachEmbeddedKeyboardBridge(iframe);
  });

  // Tạo CSS3DObject
  embeddedGameObject = new CSS3DObject(iframe);

  // Scale và adjust để fit screen mesh
  const scale = 0.0025; // Test với scale lớn hơn
  embeddedGameObject.scale.set(scale, scale, scale);
  
  // Điều chỉnh vị trí để iframe nằm chính xác trên screen
  embeddedGameObject.position.add(new THREE.Vector3(-7.2, 1.7, -1)); // Điều chỉnh offset nếu cần
  embeddedGameObject.rotation.set(0, Math.PI / 2, 0); // Xoay để iframe hướng ra ngoài

  scene.add(embeddedGameObject);
  embeddedGameObject.visible = false;

  if (!messageListenerAdded) {
    window.addEventListener('message', async (event) => {
      if (!event.data || typeof event.data.type !== 'string') return;

      const mouseSceneModel = scene.getObjectByName('Chuột_Phá_Hoại');
      if (!mouseSceneModel) return;

      const mouseModule = await import('./mouse.js');

      if (event.data.type === 'gameStarted') {
        mouseModule.allowMouseLifecycle(mouseSceneModel);
        isGame2DRunning = true;
        console.log('[EMBED] Game2D started → lock Space');
      }

      if (event.data.type === 'gameOver') {
        mouseModule.stopMouseLifecycle(mouseSceneModel);
        isGame2DRunning = false;
        console.log('[EMBED] Game2D stopped → unlock Space');
      }

    });
    messageListenerAdded = true;
  }

  console.log('✅ Embedded game đã được khởi tạo trên:', screenMesh.name);
}

export function toggleEmbeddedGame(visible) {
  if (!embeddedGameObject) {
    console.warn('⚠️ Embedded game chưa được khởi tạo');
    return;
  }

  embeddedGameObject.visible = visible;
  isGameActive = visible;
  window.dispatchEvent(new CustomEvent('embedded-visibility-change', {
    detail: { visible: !!visible },
  }));

  // Cho phép/cấm pointer events trên CSS3DRenderer
  if (css3dRenderer) {
    css3dRenderer.domElement.style.pointerEvents = visible ? 'auto' : 'none';
  }

  // XỬ LÝ FOCUS KHI BẬT GAME
  if (visible && embeddedGameObject.element) {
    // Dùng setTimeout để đợi iframe thực sự render lên màn hình rồi mới focus
    setTimeout(() => {
      // 1. Focus vào thẻ iframe
      embeddedGameObject.element.focus();
      
      // 2. Focus thẳng vào cửa sổ (window) bên trong iframe để bắt phím chắc chắn hơn
      if (embeddedGameObject.element.contentWindow) {
        embeddedGameObject.element.contentWindow.focus();
      }
      
      console.log('🎮 Đã focus vào game2_1 iframe thành công');
    }, 150); // Đợi 150 mili-giây
  }

  console.log(visible ? '🎮 Bật game2_1 trên màn hình' : '📺 Tắt game2_1 trên màn hình');
}

export function isEmbeddedGameActive() {
  return isGameActive;
}

/** Cửa sổ iframe game2_1 — dùng lọc postMessage trong storyFlow */
export function getEmbeddedGameWindow() {
  return embeddedIframeEl?.contentWindow ?? null;
}

export function setEmbeddedExitHandler(handler) {
  embeddedExitHandler = handler;

  if (embeddedGameObject && embeddedGameObject.element) {
    attachEmbeddedKeyboardBridge(embeddedGameObject.element);
  }
}

export function focusEmbeddedGameInput() {
  if (!isGameActive || !embeddedGameObject || !embeddedGameObject.element) return;
  const iframe = embeddedGameObject.element;
  if (iframe.contentWindow) {
    iframe.contentWindow.focus();
    iframe.contentWindow.postMessage({ type: 'focusInput' }, '*');
  }
}

/** Bấm Enter trên cửa sổ game2_2 → bắt đầu game2_1 (iframe thường không nhận focus phím) */
export function sendEmbeddedStartGame() {
  if (!isGameActive || !embeddedGameObject?.element?.contentWindow) return;
  try {
    embeddedGameObject.element.focus();
    embeddedGameObject.element.contentWindow.focus();
  } catch (_) {}
  embeddedGameObject.element.contentWindow.postMessage({ type: 'embedStartGame' }, '*');
}

export function getCSS3DRenderer() {
  return css3dRenderer;
}

export function updateCSS3DRendererSize(width, height) {
  if (css3dRenderer) {
    css3dRenderer.setSize(width, height);
  }
}

window.addEventListener('mouse-blackout-on', () => {
  if (!embeddedGameObject?.element?.contentWindow) return;
  embeddedGameObject.element.contentWindow.postMessage(
    { type: 'MOUSE_BLACKOUT_ON' },
    '*'
  );
});

window.addEventListener('mouse-blackout-off', () => {
  if (!embeddedGameObject?.element?.contentWindow) return;
  embeddedGameObject.element.contentWindow.postMessage(
    { type: 'MOUSE_BLACKOUT_OFF' },
    '*'
  );
});
