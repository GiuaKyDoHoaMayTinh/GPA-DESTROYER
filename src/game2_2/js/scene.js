// scene.js - Quản lý Scene, Lighting, và Loading Models

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { showMessage, setModelLoadProgress, clearModelLoadProgress, setDoorIntroHint } from './ui.js';
import { CONFIG } from './utils.js';
import { initEmbeddedGame } from './embeddedGame.js';
import { addObstacle } from './collision.js'; // THÊM IMPORT để đăng ký va chạm
import { initPlayer } from './player.js';

let scene, renderer, loader;
let player = null;
let mouseModel = null;
let lampLight = null;
let lampOn = false;

// --- THÊM: Các biến quản lý animation ---
export let playerMixer = null;
export let playerAnimations = [];
export let playerStandAnimations = [];

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
      
      // Lấy animations từ gltf
      const animations = gltf.animations; 

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.name && (child.name.includes('Cylinder001_1') || child.name === 'Habitacion002')) {
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
      // Trả về cả model và animations
      onLoad(model, animations);
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
  const TOTAL_MODELS = 4;

  const checkComplete = () => {
    loadedCount++;
    if (loadedCount === TOTAL_MODELS) onComplete();
  };

  loadModel('assets/models/room3d.glb', (room) => {
    room.scale.set(1.1, 1.1, 1.1);
    room.position.set(0, 0.5, 0);
    scene.add(room);

    let screenMesh = null;
    room.traverse((child) => {
      if (child.isMesh) {
        // --- LOGIC VA CHẠM TỰ ĐỘNG ---
        // Danh sách các từ khóa tên object trong GLB cần tính va chạm
        const obstacleKeywords = ['bed', 'desk', 'table', 'closet', 'wall', 'habita', 'bur'];
        const nameLower = child.name.toLowerCase();
        
        if (obstacleKeywords.some(key => nameLower.includes(key))) {
            // Tạo Bounding Box chính xác cho từng mảnh model
            const box = new THREE.Box3().setFromObject(child);
            addObstacle(box); // Đưa vào danh sách kiểm tra trong collision.js
        }

        if (child.name === 'Cube018_1') {
          screenMesh = child;
        }
      }
    });

    if (screenMesh) {
      initEmbeddedGame(scene, screenMesh);
    }
    checkComplete();
  });

 // Trong file scene.js, tại hàm addPlayer
function addPlayer(character, animations) {
    character.name = 'player';
    // ... các thiết lập scale, position khác của bạn
    scene.add(character);
    player = character;
    
    playerMixer = new THREE.AnimationMixer(character);
    playerAnimations = animations;
    
    // FIX QUAN TRỌNG: Truyền character vào để Target trùng khít vị trí ban đầu
    initPlayer(character); 
    
    checkComplete(); // Dòng này cực kỳ quan trọng để thanh load biến mất
}

  loadModel('assets/models/CharKL.glb', (character, animations) => {
    addPlayer(character, animations);
    initPlayer(character); // Truyền nhân vật vào đây để lấy vị trí chuẩn
});

  // Tải file stand.glb để lấy animation đứng yên
  loadModel('assets/models/stand.glb', (model, animations) => {
    playerStandAnimations = animations;
    checkComplete();
  });

  loadModel('assets/models/Mice.glb', (mouse) => {
    mouseModel = mouse;
    mouseModel.scale.set(0.1, 0.1, 0.1);
    mouseModel.position.set(-4.5, 2, -3);
    mouseModel.rotation.y = Math.PI / 2;
    mouseModel.visible = false;
    mouseModel.name = 'Chuột_Phá_Hoại';
    scene.add(mouseModel);
    checkComplete();
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
    finishDoorIntro();
  });

  stallTimer = setTimeout(() => {
    if (!done && video.readyState < 2) {
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