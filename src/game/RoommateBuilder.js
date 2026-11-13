import * as THREE from 'three';

export class RoommateBuilder {
  constructor(scene) {
    this.scene = scene;
    this.pivots = {
      root: null,
      torso: null,
      head: null,
      leftArm: null,
      rightArm: null,
    };
  }

  build() {
    // Seated naturally on the upper-middle edge of the hostel bed facing into the room (+X)
    const root = new THREE.Group();
    root.position.set(-1.68, 0, 0.48);
    root.rotation.y = Math.PI / 2 - 0.16;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb9825c, roughness: 0.72, metalness: 0.0 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1615, roughness: 0.88, metalness: 0.04 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x2d4356, roughness: 0.86, metalness: 0.0 });
    const hoodieInnerMat = new THREE.MeshStandardMaterial({ color: 0x223342, roughness: 0.9 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x263244, roughness: 0.88, metalness: 0.02 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.65 });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0xc8c3b8, roughness: 0.82 });
    const watchMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.4, metalness: 0.4 });

    // Grounded legs & sneakers (sitting on mattress at Y=0.50, feet flat on floor Y=0.0)
    [-0.1, 0.1].forEach((sideX, idx) => {
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.28, 6, 12), jeansMat);
      thigh.rotation.x = Math.PI / 2;
      thigh.position.set(sideX, 0.535, 0.16);
      thigh.castShadow = true;
      root.add(thigh);

      const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.34, 6, 12), jeansMat);
      calf.position.set(sideX, 0.27, 0.35 + idx * 0.015);
      calf.rotation.x = -0.06;
      calf.castShadow = true;
      root.add(calf);

      const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.024, 0.22), soleMat);
      shoeSole.position.set(sideX, 0.012, 0.39 + idx * 0.015);
      shoeSole.castShadow = true;
      const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.065, 0.19), shoeMat);
      shoeUpper.position.set(sideX, 0.052, 0.38 + idx * 0.015);
      shoeUpper.castShadow = true;
      root.add(shoeSole, shoeUpper);
    });

    // Pelvis resting on mattress
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.22), jeansMat);
    hips.position.set(0, 0.55, -0.02);
    hips.castShadow = true;
    root.add(hips);

    // Articulated Torso Pivot
    const torsoPivot = new THREE.Group();
    torsoPivot.position.set(0, 0.6, -0.02);
    torsoPivot.rotation.x = 0.07; // relaxed slight forward slouch

    const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.24, 8, 16), hoodieMat);
    chest.scale.set(1.08, 1.0, 0.72);
    chest.position.set(0, 0.22, 0);
    chest.castShadow = true;
    torsoPivot.add(chest);

    // Rolled hoodie collar/hood behind neck
    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.038, 10, 18), hoodieInnerMat);
    hood.rotation.x = Math.PI / 2 - 0.25;
    hood.position.set(0, 0.41, -0.03);
    torsoPivot.add(hood);

    // Neck & Articulated Head Pivot
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.08, 12), skinMat);
    neck.position.set(0, 0.45, 0.01);
    torsoPivot.add(neck);

    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.51, 0.015);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.102, 18, 16), skinMat);
    skull.scale.set(0.88, 1.06, 0.96);
    skull.position.set(0, 0.08, 0);
    skull.castShadow = true;
    headPivot.add(skull);

    // Nose & ears for natural human silhouette
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.028), skinMat);
    nose.position.set(0, 0.075, 0.095);
    const earL = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.036, 0.022), skinMat);
    earL.position.set(-0.088, 0.075, 0.0);
    const earR = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.036, 0.022), skinMat);
    earR.position.set(0.088, 0.075, 0.0);
    headPivot.add(nose, earL, earR);

    // Subtle dark eyes & eyebrows (realistic scale, never cartoonish)
    [-0.034, 0.034].forEach((ex) => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.007, 0.01), hairMat);
      brow.position.set(ex, 0.102, 0.089);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), hairMat);
      eye.position.set(ex, 0.088, 0.088);
      headPivot.add(brow, eye);
    });

    // Short sculpted college hair
    const hairTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.106, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hairMat
    );
    hairTop.scale.set(0.9, 1.02, 0.99);
    hairTop.position.set(0, 0.095, -0.006);
    hairTop.rotation.x = -0.18;
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.07), hairMat);
    hairBack.position.set(0, 0.075, -0.068);
    headPivot.add(hairTop, hairBack);

    torsoPivot.add(headPivot);

    // Left Arm (with wristwatch, resting toward lap / periodic watch glance)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(0.18, 0.36, 0.0);
    const lUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.19, 6, 10), hoodieMat);
    lUpper.position.set(0.02, -0.11, 0.04);
    lUpper.rotation.x = -0.35;
    lUpper.castShadow = true;
    const lForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.18, 6, 10), hoodieMat);
    lForearm.position.set(0.0, -0.22, 0.17);
    lForearm.rotation.x = Math.PI / 2.25;
    lForearm.castShadow = true;
    const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.02, 12), watchMat);
    watch.rotation.x = Math.PI / 2;
    watch.position.set(0, -0.24, 0.24);
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), skinMat);
    lHand.position.set(-0.02, -0.25, 0.28);
    leftArmPivot.add(lUpper, lForearm, watch, lHand);
    torsoPivot.add(leftArmPivot);

    // Right Arm (resting hand near knee)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(-0.18, 0.36, 0.0);
    const rUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.19, 6, 10), hoodieMat);
    rUpper.position.set(-0.02, -0.11, 0.04);
    rUpper.rotation.x = -0.32;
    rUpper.castShadow = true;
    const rForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.18, 6, 10), hoodieMat);
    rForearm.position.set(0.01, -0.23, 0.16);
    rForearm.rotation.x = Math.PI / 2.15;
    rForearm.castShadow = true;
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 10), skinMat);
    rHand.position.set(0.03, -0.25, 0.27);
    rightArmPivot.add(rUpper, rForearm, rHand);
    torsoPivot.add(rightArmPivot);

    root.add(torsoPivot);

    // Invisible interaction collider matching seated posture
    const hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 1.24, 0.62),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.position.set(0, 0.62, 0.12);
    root.add(hitMesh);

    this.scene.add(root);

    this.pivots.root = root;
    this.pivots.torso = torsoPivot;
    this.pivots.head = headPivot;
    this.pivots.leftArm = leftArmPivot;
    this.pivots.rightArm = rightArmPivot;

    return { group: root, hitMesh };
  }

  updateIdle(elapsed) {
    if (!this.pivots.torso || !this.pivots.head) return;

    // Gentle natural breathing & posture shift
    const breath = Math.sin(elapsed * 1.45);
    this.pivots.torso.rotation.x = 0.07 + breath * 0.015;
    this.pivots.torso.rotation.z = Math.sin(elapsed * 0.31) * 0.02;

    // Natural intermittent look around the room (window, desk, door) — never staring straight at player
    this.pivots.head.rotation.y =
      Math.sin(elapsed * 0.36) * 0.28 + Math.sin(elapsed * 0.14) * 0.14;
    this.pivots.head.rotation.x = 0.05 + Math.sin(elapsed * 0.52) * 0.06;

    // Occasional wrist glance check
    if (this.pivots.leftArm) {
      const watchGlance = Math.max(0, Math.sin(elapsed * 0.24 - 1.1));
      this.pivots.leftArm.rotation.x = -watchGlance * 0.22;
    }
    if (this.pivots.rightArm) {
      this.pivots.rightArm.rotation.x = Math.sin(elapsed * 0.62) * 0.03;
    }
  }
}
