import * as THREE from 'three';
import { ROOM_BOUNDS, INITIAL_CAMERA_POSE, FURNITURE_COLLIDERS } from '../data/roomObjects.js';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _lookMat = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();
const _currentQuat = new THREE.Quaternion();
const _targetPos = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.mode = 'menu'; // 'menu' | 'explore' | 'inspect' | 'escape'
    this.yaw = INITIAL_CAMERA_POSE.yaw;
    this.pitch = INITIAL_CAMERA_POSE.pitch;
    this.targetYaw = INITIAL_CAMERA_POSE.yaw;
    this.targetPitch = INITIAL_CAMERA_POSE.pitch;

    this.playerPos = new THREE.Vector3(
      INITIAL_CAMERA_POSE.position.x,
      INITIAL_CAMERA_POSE.position.y,
      INITIAL_CAMERA_POSE.position.z
    );

    this.inspectTargetPos = new THREE.Vector3();
    this.inspectLookAt = new THREE.Vector3();
    this.escapeTargetPos = new THREE.Vector3(1.6, 1.62, 0.85);
    this.escapeLookAt = new THREE.Vector3(3.4, 1.45, 0.85);
    this.wardenTargetPos = new THREE.Vector3(0.25, 1.56, 0.68);
    this.wardenLookAt = new THREE.Vector3(2.2, 1.44, 0.82);

    this.keys = {};
    this.joystick = { x: 0, y: 0 };
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.pointerTravel = 0;

    this.bindEvents();
    this.applyImmediatePose();
  }

  bindEvents() {
    this._onKeyDown = (e) => {
      if (this.isTypingInInput(e)) return;
      this.keys[e.code] = true;
    };
    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };
    this._onBlur = () => {
      this.keys = {};
      this.isDragging = false;
      this.joystick = { x: 0, y: 0 };
    };

    this._onPointerDown = (e) => {
      if (this.mode !== 'explore') return;
      if (e.button !== undefined && e.button !== 0) return;
      this.isDragging = true;
      this.pointerTravel = 0;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;
    };

    this._onPointerMove = (e) => {
      if (!this.isDragging || this.mode !== 'explore') return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;
      this.pointerTravel += Math.hypot(dx, dy);

      const sensitivity = e.pointerType === 'touch' ? 0.0042 : 0.0032;
      this.targetYaw += dx * sensitivity;
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch + dy * sensitivity,
        -1.15,
        1.15
      );
    };

    this._onPointerUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    this.domElement.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
  }

  isTypingInInput(e) {
    const tag = e.target && e.target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }

  hasDraggedSinceDown() {
    return this.pointerTravel > 8;
  }

  setJoystick(x, y) {
    this.joystick.x = THREE.MathUtils.clamp(x, -1, 1);
    this.joystick.y = THREE.MathUtils.clamp(y, -1, 1);
  }

  setMode(mode) {
    this.mode = mode;
    this.isDragging = false;
  }

  resetOrientation() {
    this.playerPos.set(
      INITIAL_CAMERA_POSE.position.x,
      INITIAL_CAMERA_POSE.position.y,
      INITIAL_CAMERA_POSE.position.z
    );
    this.targetYaw = INITIAL_CAMERA_POSE.yaw;
    this.targetPitch = INITIAL_CAMERA_POSE.pitch;
  }

  focusOnObject(inspectView) {
    if (!inspectView) return;
    this.mode = 'inspect';
    this.inspectTargetPos.set(
      inspectView.position.x,
      inspectView.position.y,
      inspectView.position.z
    );
    this.inspectLookAt.set(
      inspectView.lookAt.x,
      inspectView.lookAt.y,
      inspectView.lookAt.z
    );
  }

  exitInspect() {
    if (this.mode === 'inspect') {
      this.mode = 'explore';
    }
  }

  triggerEscapeView() {
    this.mode = 'escape';
  }

  triggerWardenView() {
    this.mode = 'warden';
    this.isDragging = false;
  }

  applyImmediatePose() {
    this.camera.position.copy(this.playerPos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  resolveCollisions(pos) {
    const r = 0.28;
    pos.x = THREE.MathUtils.clamp(pos.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
    pos.z = THREE.MathUtils.clamp(pos.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);

    for (let i = 0; i < FURNITURE_COLLIDERS.length; i += 1) {
      const box = FURNITURE_COLLIDERS[i];
      const closestX = THREE.MathUtils.clamp(pos.x, box.minX, box.maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, box.minZ, box.maxZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < r * r) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const push = r - dist;
          pos.x += (dx / dist) * push;
          pos.z += (dz / dist) * push;
        } else {
          // Inside AABB fallback: push out nearest edge
          const penLeft = Math.abs(pos.x - box.minX);
          const penRight = Math.abs(box.maxX - pos.x);
          const penTop = Math.abs(pos.z - box.minZ);
          const penBottom = Math.abs(box.maxZ - pos.z);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);
          if (minPen === penLeft) pos.x = box.minX - r;
          else if (minPen === penRight) pos.x = box.maxX + r;
          else if (minPen === penTop) pos.z = box.minZ - r;
          else pos.z = box.maxZ + r;
        }
      }
    }
  }

  update(elapsed, delta) {
    if (this.mode === 'menu') {
      // Slow atmospheric camera pan around the room on main menu
      const angle = elapsed * 0.14;
      _targetPos.set(Math.sin(angle) * 0.85, 1.65, 0.75 + Math.cos(angle) * 0.45);
      this.camera.position.lerp(_targetPos, 1 - Math.exp(-3 * delta));
      _lookMat.lookAt(this.camera.position, _targetPos.set(0.15, 1.15, -1.55), _up);
      _targetQuat.setFromRotationMatrix(_lookMat);
      this.camera.quaternion.slerp(_targetQuat, 1 - Math.exp(-3 * delta));
      return;
    }

    if (this.mode === 'inspect') {
      const k = 1 - Math.exp(-6.5 * delta);
      this.camera.position.lerp(this.inspectTargetPos, k);
      _lookMat.lookAt(this.camera.position, this.inspectLookAt, _up);
      _targetQuat.setFromRotationMatrix(_lookMat);
      this.camera.quaternion.slerp(_targetQuat, k);
      return;
    }

    if (this.mode === 'escape') {
      const k = 1 - Math.exp(-3.2 * delta);
      this.camera.position.lerp(this.escapeTargetPos, k);
      _lookMat.lookAt(this.camera.position, this.escapeLookAt, _up);
      _targetQuat.setFromRotationMatrix(_lookMat);
      this.camera.quaternion.slerp(_targetQuat, k);
      return;
    }

    if (this.mode === 'warden') {
      const k = 1 - Math.exp(-4.0 * delta);
      this.camera.position.lerp(this.wardenTargetPos, k);
      _lookMat.lookAt(this.camera.position, this.wardenLookAt, _up);
      _targetQuat.setFromRotationMatrix(_lookMat);
      this.camera.quaternion.slerp(_targetQuat, k);
      return;
    }

    // Explore mode
    const rotDamp = 1 - Math.exp(-16 * delta);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, rotDamp);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, rotDamp);

    // Optional Q/E turn keys
    if (this.keys.KeyQ) this.targetYaw += 1.6 * delta;
    if (this.keys.KeyE) this.targetYaw -= 1.6 * delta;

    // Movement input (WASD + Arrow keys + Mobile virtual joystick)
    let moveZ = 0;
    let moveX = 0;
    if (this.keys.KeyW || this.keys.ArrowUp) moveZ += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) moveZ -= 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) moveX -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) moveX += 1;

    moveX += this.joystick.x;
    moveZ += -this.joystick.y;

    if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
      _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

      _move.set(0, 0, 0);
      _move.addScaledVector(_forward, moveZ);
      _move.addScaledVector(_right, moveX);
      if (_move.lengthSq() > 1) _move.normalize();

      const walkSpeed = 2.25;
      this.playerPos.addScaledVector(_move, walkSpeed * delta);
      this.resolveCollisions(this.playerPos);
    }

    this.camera.position.lerp(this.playerPos, 1 - Math.exp(-14 * delta));
    this.camera.rotation.order = 'YXZ';
    _currentQuat.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    this.camera.quaternion.slerp(_currentQuat, 1 - Math.exp(-18 * delta));
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
  }
}
