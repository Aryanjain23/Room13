import * as THREE from 'three';

export class InteractionManager {
  constructor(camera, domElement, interactables, cameraController, onSelectObject) {
    this.camera = camera;
    this.domElement = domElement;
    this.interactables = interactables;
    this.cameraController = cameraController;
    this.onSelectObject = onSelectObject;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.hitMeshes = [];
    this.enabled = false;

    this.interactables.forEach((entry) => {
      this.hitMeshes.push(entry.hitMesh);
    });

    this.bindEvents();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.domElement.style.cursor = this.enabled ? 'grab' : 'default';
  }

  bindEvents() {
    this._onPointerUp = (e) => {
      if (!this.enabled) return;
      if (e.button !== undefined && e.button !== 0) return;
      if (this.cameraController.hasDraggedSinceDown()) return;

      this.updatePointer(e);
      const hitId = this.raycast();
      if (hitId) {
        this.onSelectObject(hitId);
      }
    };

    this.domElement.addEventListener('pointerup', this._onPointerUp);
  }

  updatePointer(e) {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  raycast() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);
    if (hits.length === 0) return null;

    // Prefer smaller/specific props over broader furniture colliders (table, bed)
    const specificHit = hits.find(
      (h) => h.object.userData.objectId !== 'table' && h.object.userData.objectId !== 'bed'
    );
    if (specificHit) {
      return specificHit.object.userData.objectId || null;
    }
    return hits[0].object.userData.objectId || null;
  }

  dispose() {
    this.domElement.removeEventListener('pointerup', this._onPointerUp);
  }
}
