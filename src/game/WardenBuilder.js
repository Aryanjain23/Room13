import * as THREE from 'three';

export class WardenBuilder {
  constructor(scene) {
    this.scene = scene;
    this.root = null;
    this.pivots = {
      torso: null,
      head: null,
      leftLeg: null,
      rightLeg: null,
      leftArm: null,
      rightArm: null,
    };
    this.flashlightSpot = null;
  }

  build() {
    const root = new THREE.Group();
    // Begins outside Room 13 in the hallway (+X), facing -X into the room
    root.position.set(3.45, 0, 0.85);
    root.rotation.y = -Math.PI / 2;
    root.visible = false;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x9b6d4c, roughness: 0.76 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1b1a1c, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x4b473a, roughness: 0.85 });
    const trouserMat = new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.88 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x16171a, roughness: 0.6 });
    const torchMat = new THREE.MeshStandardMaterial({ color: 0x1d232b, roughness: 0.45, metalness: 0.4 });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xfff0c2,
      emissive: 0xffd27a,
      emissiveIntensity: 0.8,
    });

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.88, 0);
    const lLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.68, 6, 12), trouserMat);
    lLeg.position.y = -0.38;
    lLeg.castShadow = true;
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.075, 0.23), shoeMat);
    lShoe.position.set(0, -0.84, 0.04);
    lShoe.castShadow = true;
    leftLegPivot.add(lLeg, lShoe);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.88, 0);
    const rLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.68, 6, 12), trouserMat);
    rLeg.position.y = -0.38;
    rLeg.castShadow = true;
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.075, 0.23), shoeMat);
    rShoe.position.set(0, -0.84, 0.04);
    rShoe.castShadow = true;
    rightLegPivot.add(rLeg, rShoe);

    root.add(leftLegPivot, rightLegPivot);

    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 0.9, 0);

    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.22), trouserMat);
    waist.position.y = 0.04;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.045, 0.23), shoeMat);
    belt.position.y = 0.08;
    const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 8, 16), shirtMat);
    chest.scale.set(1.12, 1.0, 0.72);
    chest.position.y = 0.32;
    chest.castShadow = true;
    torsoPivot.add(waist, belt, chest);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.09, 12), skinMat);
    neck.position.y = 0.58;
    torsoPivot.add(neck);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.64, 0.01);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 16), skinMat);
    skull.scale.set(0.88, 1.08, 0.96);
    skull.position.y = 0.085;
    skull.castShadow = true;

    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.014, 0.016), hairMat);
    mustache.position.set(0, 0.056, 0.092);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.036, 0.024), skinMat);
    nose.position.set(0, 0.08, 0.098);
    [-0.035, 0.035].forEach((ex) => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.009, 0.012), hairMat);
      brow.position.set(ex, 0.11, 0.09);
      brow.rotation.z = ex < 0 ? -0.14 : 0.14; // stern expression
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), hairMat);
      eye.position.set(ex, 0.094, 0.089);
      headPivot.add(brow, eye);
    });

    const hairTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.107, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    hairTop.scale.set(0.9, 1.0, 0.98);
    hairTop.position.set(0, 0.102, -0.008);
    hairTop.rotation.x = -0.22;

    headPivot.add(skull, mustache, nose, hairTop);
    torsoPivot.add(headPivot);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.21, 0.48, 0);
    const lArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.38, 6, 10), shirtMat);
    lArm.position.y = -0.22;
    lArm.castShadow = true;
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), skinMat);
    lHand.position.y = -0.45;
    leftArmPivot.add(lArm, lHand);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.21, 0.48, 0);
    const rArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.36, 6, 10), shirtMat);
    rArm.position.y = -0.21;
    rArm.castShadow = true;
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), skinMat);
    rHand.position.y = -0.43;

    // Warden's heavy hostel flashlight
    const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.17, 12), torchMat);
    torch.rotation.x = Math.PI / 2;
    torch.position.set(0, -0.44, 0.08);
    const torchLens = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 12), lensMat);
    torchLens.rotation.x = Math.PI / 2;
    torchLens.position.set(0, -0.44, 0.168);

    const flashlight = new THREE.SpotLight(0xffe9b5, 0, 5.5, Math.PI / 5.5, 0.55, 1.3);
    flashlight.position.set(0, -0.44, 0.18);
    const flashTarget = new THREE.Object3D();
    flashTarget.position.set(0, -0.44, 2.5);
    rightArmPivot.add(rArm, rHand, torch, torchLens, flashlight, flashTarget);
    flashlight.target = flashTarget;

    torsoPivot.add(leftArmPivot, rightArmPivot);
    root.add(torsoPivot);

    this.scene.add(root);
    this.root = root;
    this.flashlightSpot = flashlight;
    this.pivots.torso = torsoPivot;
    this.pivots.head = headPivot;
    this.pivots.leftLeg = leftLegPivot;
    this.pivots.rightLeg = rightLegPivot;
    this.pivots.leftArm = leftArmPivot;
    this.pivots.rightArm = rightArmPivot;

    return this;
  }

  reset() {
    if (!this.root) return;
    this.root.visible = false;
    this.root.position.set(3.45, 0, 0.85);
    this.root.rotation.y = -Math.PI / 2;
    this.pivots.head.rotation.set(0, 0, 0);
    this.pivots.torso.rotation.set(0, 0, 0);
    this.pivots.leftLeg.rotation.set(0, 0, 0);
    this.pivots.rightLeg.rotation.set(0, 0, 0);
    this.pivots.leftArm.rotation.set(0, 0, 0);
    this.pivots.rightArm.rotation.set(-0.25, 0, 0);
    if (this.flashlightSpot) this.flashlightSpot.intensity = 0;
  }

  updateSequence(seqTime) {
    if (!this.root) return;
    this.root.visible = true;
    if (this.flashlightSpot) this.flashlightSpot.intensity = 2.6;

    // 0.0 -> 0.85s: waiting as handle moves & door starts swinging
    // 0.85 -> 2.35s: walks across doorway from x=3.35 -> x=1.95
    // 2.35 -> 3.8s+: pauses inside room, glances left/right, then turns to notice player
    if (seqTime < 0.85) {
      this.root.position.set(3.35, 0, 0.85);
      this.pivots.rightArm.rotation.x = -0.35;
      return;
    }

    if (seqTime < 2.35) {
      const walkT = (seqTime - 0.85) / 1.5;
      const eased = walkT * walkT * (3 - 2 * walkT);
      this.root.position.x = 3.35 - eased * 1.4;
      this.root.position.z = 0.85 - eased * 0.06;
      const stride = Math.sin(walkT * Math.PI * 5);
      this.pivots.leftLeg.rotation.x = stride * 0.36;
      this.pivots.rightLeg.rotation.x = -stride * 0.36;
      this.pivots.leftArm.rotation.x = -stride * 0.24;
      this.pivots.rightArm.rotation.x = -0.55 + stride * 0.12;
      this.pivots.head.rotation.y = Math.sin(walkT * Math.PI * 2) * 0.12;
      return;
    }

    // Stopped inside room: settle stance, look around room, then fix gaze on player
    this.root.position.set(1.95, 0, 0.79);
    this.pivots.leftLeg.rotation.x *= 0.85;
    this.pivots.rightLeg.rotation.x *= 0.85;
    this.pivots.leftArm.rotation.x *= 0.85;

    const pauseT = seqTime - 2.35;
    if (pauseT < 1.1) {
      // Looks left toward desk, then right toward bed
      this.pivots.head.rotation.y = Math.sin((pauseT / 1.1) * Math.PI * 1.5) * 0.45;
      this.pivots.rightArm.rotation.x = -0.78;
    } else {
      // Fixes gaze onto player & points flashlight slightly higher
      this.pivots.head.rotation.y = THREE.MathUtils.damp(this.pivots.head.rotation.y, 0.08, 6, 0.016);
      this.pivots.rightArm.rotation.x = THREE.MathUtils.damp(this.pivots.rightArm.rotation.x, -1.02, 5, 0.016);
    }
  }
}
