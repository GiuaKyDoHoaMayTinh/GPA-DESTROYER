// input.js - Xử lý input từ bàn phím và chuột

import { updatePlayerInput, standUp, tryInteract, setPlayerTarget } from './player.js';
import { getCamera } from './camera.js';
import { getScene, toggleLamp } from './scene.js';
import { updateCSS3DRendererSize, isEmbeddedGameActive, sendEmbeddedStartGame, exitEmbeddedGame } from './embeddedGame.js';
import { pauseBgMusic } from './ui.js';
import * as THREE from 'three';
import { handleMouseClick, isMouseVisible } from './mouse.js';

export function initInput(player, deskZone, bedZone, lampZone, zoneRadius) {
  // Keyboard events (keep for E and Space)
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Home' && !isEmbeddedGameActive()) {
      event.preventDefault();
      pauseBgMusic();
      try {
        sessionStorage.setItem('gpa_home_to_menu', '1');
      } catch (_) {}
      window.location.href = new URL('../../index.html', window.location.href).href;
      return;
    }

    if (isEmbeddedGameActive()) {
      if (event.code === 'Escape') {
        event.preventDefault();
        exitEmbeddedGame();
        return;
      }
      if (event.code === 'Enter' || event.code === 'NumpadEnter') {
        event.preventDefault();
        sendEmbeddedStartGame();
      }
      return;
    }

    const key = event.key.toLowerCase();
    updatePlayerInput(key, true);

    if (key === 'e') {
      tryInteract(player, deskZone, bedZone);
    }

    if (event.code === 'Space') {
      standUp(player, deskZone, bedZone);
    }

    if (event.code === 'KeyP') {
      const distanceToLamp = player.position.distanceTo(lampZone);
      if (distanceToLamp <= zoneRadius) {
        toggleLamp();
      }
    }
  });

  window.addEventListener('keyup', (event) => {
    // Nếu game embedded active, không handle input cho game2_2
    if (isEmbeddedGameActive()) return;

    const key = event.key.toLowerCase();
    updatePlayerInput(key, false);
  });

  // Mouse click for movement or mouse interaction
  window.addEventListener('click', (event) => {
    const camera = getCamera();
    const scene = getScene();
    if (!camera || !scene) return;

    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // First, check if clicking on mouse
    if (isMouseVisible() && handleMouseClick(raycaster, camera, scene)) {
      // Mouse was clicked, handled
      return;
    }

    // Nếu game embedded active, không handle click cho movement
    if (isEmbeddedGameActive()) return;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0 plane
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    // Set player target to clicked position
    setPlayerTarget(target.x, 0, target.z);
  });
}

export function initWindowResize(renderer, camera) {
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Resize CSS3DRenderer
    updateCSS3DRendererSize(width, height);
  });
}
