// scene.js - Quản lý Scene, Lighting, và Loading Models

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { showMessage, setModelLoadProgress, clearModelLoadProgress, setDoorIntroHint } from './ui.js';
import { CONFIG } from './utils.js';
import { initEmbeddedGame } from './embeddedGame.js';
import { initPlayerAnimations } from './player.js';

let scene, renderer, loader;
let player = null;
let mouseModel = null;
let lampLight = null;
let lampOn = false;
let playerMixer = null;

function shouldDoorIntro() {
  try {
    if (sessionStorage.getItem('gpa_door_intro') === '1') return true;
    const q = new URLSearchParams(window.location.search);
    if (q.get('doorIntro') === '1') return true;
  } catch (_) {}
  return false;
}

function consumeDoorIntroFlag() {
  try {
    sessionStorage.removeItem('gpa_door_intro');
  } catch (_) {}
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('doorIntro') === '1') {
      url.searchParams.delete('doorIntro');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  } catch (_) {}
}

/** Giữ API cho index; intro cửa dùng video HTML, không còn mixer GLB. */
export function updateDoorIntro(_delta) {}

export function initScene(width, height) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7aa8c8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);

  const loadingManager = new THREE.LoadingManager();
  loadingManager.onStart = () => setModelLoadProgress(0, 1, 'Đang tải…');
  loadingManager.onProgress = (_url, loaded, total) => {
    setModelLoadProgress(loaded, total, 'Đang tải mô hình');
  };
  loadingManager.onLoad = () => clearModelLoadProgress();
  loadingManager.onError = (url) => console.error('LoadingManager error:', url);

  loader = new GLTFLoader(loadingManager);

  setupLighting();
  setupFloor();

  return { scene, renderer, loader };
}

function setupLighting() {
  const ambientLight = new THREE.HemisphereLight(0xf0f0f5, 0xcccccc, 1.7);
  scene.add(ambientLight);

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.35;

  const fill = new THREE.DirectionalLight(0xeef4ff, 0.35);
  fill.position.set(-6, 8, 6);
  scene.add(fill);

  const sunlight = new THREE.DirectionalLight(0xfffcf0, 1.2);
  sunlight.position.set(0, 12, -8);
  sunlight.castShadow = true;
  sunlight.shadow.camera.top = 10;
  sunlight.shadow.camera.bottom = -10;
  sunlight.shadow.camera.left = -10;
  sunlight.shadow.camera.right = 10;
  sunlight.shadow.mapSize.set(2048, 2048);
  scene.add(sunlight);

  // Đèn đầu giường
  lampLight = new THREE.PointLight(0xffffff, 0, 6, 2);
  lampLight.position.set(CONFIG.lampZone.x, CONFIG.lampZone.y + 1.2, CONFIG.lampZone.z);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.visible = false;
  scene.add(lampLight);

  const lampBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffffee,
      emissive: 0xffffff,
      emissiveIntensity: 0,
      metalness: 0.2,
      roughness: 0.3,
    })
  );
  lampBulb.position.copy(lampLight.position);
  lampBulb.name = 'lampBulb';
  scene.add(lampBulb);
}

function setupFloor() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ color: 0x8899aa, transparent: true, opacity: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

}

function loadModel(path, onLoad, onError) {
  console.log('📦 Bắt đầu tải mô hình:', path);

  loader.load(
    path,
    (gltf) => {
      console.log('✅ Tải thành công:', path);
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.name && child.name.includes('Cylinder001_1')||child.name === ('Habitacion002')) {
            const setTransparentMaterial = (material) => {
              material.transparent = true;
              material.opacity = child.name === 'Habitacion002' ? 0.8 : 1.0;
              material.side = THREE.DoubleSide;
              material.depthWrite = false;
              material.alphaTest = 0.01;
              material.needsUpdate = true;
            };

            if (Array.isArray(child.material)) {
              child.material.forEach(setTransparentMaterial);
            } else if (child.material) {
              setTransparentMaterial(child.material);
            }

            child.renderOrder = 1;
            child.castShadow = false;
          }
        }
      });
      onLoad(gltf);
    },
    (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
        console.log('⏳ Tiến độ ' + path + ':', percentComplete.toFixed(1) + '%');
      }
    },
    (error) => {
      console.error('❌ Lỗi tải mô hình:', path, error);
      if (typeof onError === 'function') {
        onError(error);
      } else {
        showMessage('❌ Lỗi: ' + path + ' - Kiểm tra console để chi tiết');
      }
    }
  );
}

function loadMainModels(onComplete) {
  let loadedCount = 0;

  loadModel('assets/models/room3d.glb', (gltf) => {
    const room = gltf.scene;
    room.scale.set(1.1, 1.1, 1.1);
    room.position.set(0, 0.5, 0);
    scene.add(room);

    let screenMesh = null;
    room.traverse((child) => {
      if (child.isMesh) {
        console.log('Tìm thấy mesh:', child.name);
        if (child.name === 'Cube018_1') {
          screenMesh = child;
          console.log('✅ Tìm thấy màn hình:', child.name);
        }
      }
    });

    if (screenMesh) {
      initEmbeddedGame(scene, screenMesh);
    } else {
      console.warn('⚠️ Không tìm thấy Cube018_1, game embedded sẽ không hoạt động');
    }

    loadedCount++;
    if (loadedCount === 3) onComplete();
  });

  function addPlayer(gltf) {
    const character = gltf.scene;
    character.name = 'player';
    character.scale.set(0.9, 0.9, 0.9);
    character.position.set(CONFIG.playerStartPos.x, CONFIG.playerStartPos.y, CONFIG.playerStartPos.z);
    character.rotation.y = Math.PI/2;
    scene.add(character);
    player = character;

    // Tạo animation mixer nếu có animations
    if (gltf.animations && gltf.animations.length > 0) {
      playerMixer = new THREE.AnimationMixer(character);
      initPlayerAnimations(playerMixer, gltf.animations);
      console.log('✅ Tạo AnimationMixer cho player với', gltf.animations.length, 'animations');
    }

    loadedCount++;
    if (loadedCount === 3) onComplete();
  }

  loadModel('assets/models/CharKL.glb', (gltf) => addPlayer(gltf));

  loadModel('assets/models/Mice.glb', (gltf) => {
    mouseModel = gltf.scene;
    mouseModel.scale.set(0.1, 0.1, 0.1);
    mouseModel.position.set(-4.5, 2, -3);
    mouseModel.rotation.y = Math.PI / 2;
    mouseModel.visible = false;
    mouseModel.name = 'Chuột_Phá_Hoại';
    scene.add(mouseModel);
    loadedCount++;
    if (loadedCount === 3) onComplete();
  });
}

const DOOR_VIDEO_PATH = 'assets/video/0001-0250.mkv';

function playDoorIntroVideo(onComplete, viewCamera) {
  setDoorIntroHint(true);
  if (viewCamera) {
    viewCamera.position.set(5, 7.5, 5);
    viewCamera.lookAt(0, 2, 0);
    viewCamera.updateProjectionMatrix();
  }
  scene.background.setHex(0x000000);
  if (renderer && renderer.domElement) {
    renderer.domElement.style.visibility = 'hidden';
  }

  const wrap = document.createElement('div');
  wrap.id = 'door-intro-video-wrap';
  const video = document.createElement('video');
  video.className = 'door-intro-video';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.playsInline = true;
  video.controls = false;
  video.preload = 'auto';
  video.src = DOOR_VIDEO_PATH;
  wrap.appendChild(video);
  document.body.appendChild(wrap);

  let done = false;
  let safetyTimer = null;
  let stallTimer = null;

  function finishDoorIntro() {
    if (done) return;
    done = true;
    setDoorIntroHint(false);
    if (safetyTimer !== null) clearTimeout(safetyTimer);
    if (stallTimer !== null) clearTimeout(stallTimer);
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } catch (_) {}
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    scene.background.setHex(0xe8ecf2);
    if (renderer && renderer.domElement) {
      renderer.domElement.style.visibility = '';
    }
    loadMainModels(onComplete);
  }

  safetyTimer = setTimeout(finishDoorIntro, 120000);

  video.addEventListener('ended', finishDoorIntro, { once: true });
  video.addEventListener('error', () => {
    console.warn(
      '[scene] Video intro lỗi — MKV/H.264 có thể không được mọi trình duyệt hỗ trợ. Thử xuất MP4 (H.264):',
      DOOR_VIDEO_PATH
    );
    finishDoorIntro();
  });

  stallTimer = setTimeout(() => {
    if (!done && video.readyState < 2) {
      console.warn('[scene] Video intro không tải kịp — bỏ qua.');
      finishDoorIntro();
    }
  }, 15000);

  video.addEventListener(
    'canplaythrough',
    () => {
      if (stallTimer !== null) clearTimeout(stallTimer);
      stallTimer = null;
      video
        .play()
        .catch((e) => {
          console.warn('[scene] play intro:', e);
          video.muted = true;
          video.play().catch(() => finishDoorIntro());
        });
    },
    { once: true }
  );

  video.load();
}

export function loadModels(onComplete, viewCamera = null) {
  if (!shouldDoorIntro()) {
    loadMainModels(onComplete);
    return;
  }

  consumeDoorIntroFlag();
  playDoorIntroVideo(onComplete, viewCamera);
}


export function getScene() {
  return scene;
}

export function getRenderer() {
  return renderer;
}

export function getPlayer() {
  return player;
}

export function getPlayerMixer() {
  return playerMixer;
}

export function getMouseModel() {
  return mouseModel;
}

export function toggleLamp() {
  if (!lampLight) return false;
  lampOn = !lampOn;
  lampLight.intensity = lampOn ? 0.8 : 0;
  lampLight.visible = lampOn;

  const bulb = scene.getObjectByName('lampBulb');
  if (bulb && bulb.material) {
    bulb.material.emissiveIntensity = lampOn ? 1.2 : 0;
  }

  showMessage(lampOn ? 'Đèn đầu giường đã bật.' : 'Đèn đầu giường đã tắt.');
  return lampOn;
}

export function getLampState() {
  return lampOn;
}

export function resizeRenderer(width, height) {
  renderer.setSize(width, height);
}
