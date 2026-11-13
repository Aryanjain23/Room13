import * as THREE from 'three';
import { RoomBuilder } from './RoomBuilder.js';
import { LightingRig } from './Lighting.js';
import { CameraController } from './CameraController.js';
import { InteractionManager } from './InteractionManager.js';

function detectSoftwareWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class GameScene {
  constructor(mountEl, { onSelectObject, onContextLost }) {
    this.mountEl = mountEl;
    this.onSelectObject = onSelectObject;
    this.onContextLost = onContextLost;

    this.isSoftwareGl = detectSoftwareWebGL();
    this.clock = new THREE.Clock();
    this.frameId = 0;
    this.disposed = false;
    this.currentDifficulty = null;

    this.stateFlags = {
      drawerOpenAmount: 0,
      drawerTargetOpen: 0,
      wardrobeOpenAmount: 0,
      wardrobeTargetOpen: 0,
      doorOpenAmount: 0,
      doorTargetOpen: 0,
      notebookOpenAmount: 0,
      notebookTargetOpen: 0,
      handleRattleTimer: 0,
      clockTickAccum: 0,
      secondStep: 0,
      wardenActive: false,
      wardenElapsed: 0,
    };

    this.initRenderer();
    this.initScene();
    this.bindResize();
    this.startLoop();
  }

  initRenderer() {
    const width = this.mountEl.clientWidth || window.innerWidth;
    const height = this.mountEl.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';

    this.mountEl.innerHTML = '';
    this.mountEl.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (this.onContextLost) this.onContextLost();
    });
  }

  initScene() {
    const width = this.mountEl.clientWidth || window.innerWidth;
    const height = this.mountEl.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090c16);
    this.scene.fog = new THREE.FogExp2(0x090c16, 0.045);

    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.08, 40);

    const maxAnisotropy = this.isSoftwareGl
      ? 1
      : Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    this.lighting = new LightingRig(this.scene, this.isSoftwareGl);
    this.roomBuilder = new RoomBuilder(this.scene, maxAnisotropy);
    const built = this.roomBuilder.build();
    this.interactables = built.interactables;
    this.animated = built.animated;

    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.interactionManager = new InteractionManager(
      this.camera,
      this.renderer.domElement,
      this.interactables,
      this.cameraController,
      (id) => this.onSelectObject && this.onSelectObject(id)
    );

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  bindResize() {
    this._onResize = () => {
      if (this.disposed) return;
      const width = this.mountEl.clientWidth || window.innerWidth;
      const height = this.mountEl.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this._onResize);
  }

  syncState(snapshot) {
    if (snapshot.difficulty && snapshot.difficulty !== this.currentDifficulty) {
      this.currentDifficulty = snapshot.difficulty;
      this.roomBuilder.applyDifficulty(snapshot.difficulty);
    }

    this.stateFlags.drawerTargetOpen = snapshot.drawerPhysicallyOpen ? 1 : 0;
    this.stateFlags.wardrobeTargetOpen = snapshot.wardrobeOpen ? 1 : 0;
    if (this.stateFlags.wardenActive) {
      this.stateFlags.doorTargetOpen = this.stateFlags.wardenElapsed >= 0.65 ? 1 : 0;
    } else {
      this.stateFlags.doorTargetOpen = snapshot.doorUnlocked ? 1 : 0;
    }

    if (this.animated.tornNoteMesh) {
      this.animated.tornNoteMesh.visible = Boolean(snapshot.drawerUnlocked);
    }

    if (this.animated.keypadLedMat) {
      this.animated.keypadLedMat.color.setHex(snapshot.doorUnlocked ? 0x2de37e : 0xff3b30);
    }

    if (snapshot.phase === 'menu' || snapshot.phase === 'difficulty') {
      this.resetWarden();
      this.cameraController.setMode('menu');
      this.interactionManager.setEnabled(false);
    } else if (snapshot.phase === 'intro') {
      this.resetWarden();
      this.cameraController.resetOrientation();
      this.cameraController.setMode('explore');
      this.interactionManager.setEnabled(false);
    } else if (snapshot.phase === 'caught') {
      this.cameraController.triggerWardenView();
      this.interactionManager.setEnabled(false);
    } else if (snapshot.phase === 'victory') {
      this.resetWarden();
      this.cameraController.triggerEscapeView();
      this.interactionManager.setEnabled(false);
    } else if (
      this.cameraController.mode === 'menu' ||
      this.cameraController.mode === 'escape' ||
      this.cameraController.mode === 'warden'
    ) {
      this.resetWarden();
      this.cameraController.resetOrientation();
      this.cameraController.setMode('explore');
      this.interactionManager.setEnabled(true);
    } else {
      this.interactionManager.setEnabled(this.cameraController.mode === 'explore');
    }
  }

  inspectObjectView(objectMeta) {
    if (!objectMeta) return;
    this.stateFlags.notebookTargetOpen = objectMeta.id === 'notebook' ? 1 : 0;
    this.cameraController.focusOnObject(objectMeta.inspectView);
    this.interactionManager.setEnabled(false);
  }

  closeObjectView() {
    this.stateFlags.notebookTargetOpen = 0;
    if (this.cameraController.mode === 'inspect') {
      this.cameraController.exitInspect();
      this.interactionManager.setEnabled(true);
    }
  }

  triggerHandleRattle() {
    this.stateFlags.handleRattleTimer = 0.45;
  }

  startWardenSequence() {
    if (this.stateFlags.wardenActive) return;
    this.stateFlags.wardenActive = true;
    this.stateFlags.wardenElapsed = 0;
    this.stateFlags.handleRattleTimer = 0.7;
    this.cameraController.triggerWardenView();
    this.interactionManager.setEnabled(false);
  }

  resetWarden() {
    this.stateFlags.wardenActive = false;
    this.stateFlags.wardenElapsed = 0;
    if (this.animated.warden) {
      this.animated.warden.reset();
    }
  }

  resetCameraView() {
    this.cameraController.resetOrientation();
  }

  setJoystickInput(x, y) {
    this.cameraController.setJoystick(x, y);
  }

  flashKeypadError() {
    if (!this.animated.keypadLedMat) return;
    this.animated.keypadLedMat.color.setHex(0xff1e1e);
  }

  updateAnimations(elapsed, delta) {
    if (this.animated.ceilingFan) {
      this.animated.ceilingFan.rotation.y += delta * 3.1;
    }

    if (this.animated.roommate) {
      this.animated.roommate.updateIdle(elapsed, delta);
    }

    if (this.animated.secondHand) {
      this.stateFlags.clockTickAccum += delta;
      if (this.stateFlags.clockTickAccum >= 1) {
        this.stateFlags.clockTickAccum -= 1;
        this.stateFlags.secondStep = (this.stateFlags.secondStep + 1) % 60;
      }
      this.animated.secondHand.rotation.z = -(this.stateFlags.secondStep / 60) * Math.PI * 2;
    }

    if (this.animated.curtainLeft && this.animated.curtainRight) {
      this.animated.curtainLeft.rotation.z = Math.sin(elapsed * 1.1) * 0.025;
      this.animated.curtainRight.rotation.z = Math.sin(elapsed * 1.1 + 1.4) * 0.025;
    }

    this.stateFlags.drawerOpenAmount = THREE.MathUtils.damp(
      this.stateFlags.drawerOpenAmount,
      this.stateFlags.drawerTargetOpen,
      6.0,
      delta
    );
    if (this.animated.drawerGroup) {
      this.animated.drawerGroup.position.z = 0.02 + this.stateFlags.drawerOpenAmount * 0.34;
    }

    this.stateFlags.notebookOpenAmount = THREE.MathUtils.damp(
      this.stateFlags.notebookOpenAmount,
      this.stateFlags.notebookTargetOpen,
      7.0,
      delta
    );
    if (this.animated.notebookFlipPivot) {
      this.animated.notebookFlipPivot.rotation.z = this.stateFlags.notebookOpenAmount * (Math.PI * 0.92);
    }

    this.stateFlags.wardrobeOpenAmount = THREE.MathUtils.damp(
      this.stateFlags.wardrobeOpenAmount,
      this.stateFlags.wardrobeTargetOpen,
      5.2,
      delta
    );
    if (this.animated.wardrobeLeftDoor && this.animated.wardrobeRightDoor) {
      this.animated.wardrobeLeftDoor.rotation.y = -this.stateFlags.wardrobeOpenAmount * 0.92;
      this.animated.wardrobeRightDoor.rotation.y = this.stateFlags.wardrobeOpenAmount * 0.78;
    }

    if (this.stateFlags.wardenActive) {
      this.stateFlags.wardenElapsed += delta;
      this.stateFlags.doorTargetOpen = this.stateFlags.wardenElapsed >= 0.65 ? 1 : 0;
      if (this.animated.warden) {
        this.animated.warden.updateSequence(this.stateFlags.wardenElapsed);
      }
    }

    if (this.stateFlags.handleRattleTimer > 0) {
      this.stateFlags.handleRattleTimer = Math.max(0, this.stateFlags.handleRattleTimer - delta);
    }
    this.stateFlags.doorOpenAmount = THREE.MathUtils.damp(
      this.stateFlags.doorOpenAmount,
      this.stateFlags.doorTargetOpen,
      2.6,
      delta
    );
    if (this.animated.doorHandlePivot) {
      const unlockTurn = Math.sin(Math.min(1, this.stateFlags.doorOpenAmount * 2.5) * Math.PI) * 0.48;
      const rattleTurn =
        this.stateFlags.handleRattleTimer > 0
          ? Math.abs(Math.sin(this.stateFlags.handleRattleTimer * 28)) * 0.24
          : 0;
      this.animated.doorHandlePivot.rotation.x = unlockTurn + rattleTurn;
    }
    if (this.animated.doorPivot) {
      this.animated.doorPivot.rotation.y = -this.stateFlags.doorOpenAmount * (Math.PI * 0.48);
    }
    this.lighting.setCorridorOpenAmount(this.stateFlags.doorOpenAmount);
    if (this.animated.corridorBackdropMat) {
      this.animated.corridorBackdropMat.emissiveIntensity =
        0.45 + this.stateFlags.doorOpenAmount * 1.45;
    }
  }

  afterDraw(cb) {
    const gl = this.renderer.getContext();
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = window.setTimeout(cb, 80);
    }
  }

  startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const delta = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.elapsedTime;

      this.cameraController.update(elapsed, delta);
      this.lighting.update(elapsed, delta);
      this.updateAnimations(elapsed, delta);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };
    tick();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this._onResize);
    this.cameraController.dispose();
    this.interactionManager.dispose();

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.renderer.dispose();
  }
}
