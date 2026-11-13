import * as THREE from 'three';

export class LightingRig {
  constructor(scene, isSoftwareGl = false) {
    this.scene = scene;
    this.isSoftwareGl = isSoftwareGl;
    this.lampLight = null;
    this.corridorLight = null;
    this.moonLight = null;
    this.baseLampIntensity = 3.4;

    this.setupLights();
  }

  setupLights() {
    // Cool night sky / warm dark floor bounce
    const hemiLight = new THREE.HemisphereLight(0x5c73a8, 0x332419, 1.05);
    hemiLight.position.set(0, 3.0, 0);
    this.scene.add(hemiLight);

    // Subtle soft ambient fill so shadows never crush completely black
    const ambient = new THREE.AmbientLight(0x28334a, 0.52);
    this.scene.add(ambient);

    // Warm Amber Desk Lamp Light (Key Light - steady, no distracting flicker)
    this.lampLight = new THREE.PointLight(0xffa947, this.baseLampIntensity, 6.4, 1.45);
    this.lampLight.position.set(0.75, 1.18, -1.92);
    if (!this.isSoftwareGl) {
      this.lampLight.castShadow = true;
      this.lampLight.shadow.mapSize.set(1024, 1024);
      this.lampLight.shadow.bias = -0.0015;
      this.lampLight.shadow.normalBias = 0.025;
      this.lampLight.shadow.camera.near = 0.15;
      this.lampLight.shadow.camera.far = 5.5;
    }
    this.scene.add(this.lampLight);

    // Focused desk pool spot for warm reading glow on notebook & notice board
    const deskSpot = new THREE.SpotLight(0xffb85c, 2.2, 4.8, Math.PI / 3.1, 0.65, 1.3);
    deskSpot.position.set(0.84, 1.28, -1.88);
    deskSpot.target.position.set(0.18, 0.85, -1.92);
    this.scene.add(deskSpot);
    this.scene.add(deskSpot.target);

    // Cool Moonlight entering from West Window
    this.moonLight = new THREE.SpotLight(0x7aa4f0, 3.2, 8.5, Math.PI / 4.2, 0.58, 1.2);
    this.moonLight.position.set(-3.3, 2.15, -0.95);
    this.moonLight.target.position.set(-0.3, 0.25, -0.35);
    if (!this.isSoftwareGl) {
      this.moonLight.castShadow = true;
      this.moonLight.shadow.mapSize.set(1024, 1024);
      this.moonLight.shadow.bias = -0.0008;
      this.moonLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    // Faint warm corridor bleed near exit door (ramps up when door opens!)
    this.corridorLight = new THREE.PointLight(0xffcb7a, 0.28, 4.5, 1.4);
    this.corridorLight.position.set(3.2, 1.45, 0.85);
    this.scene.add(this.corridorLight);
  }

  setCorridorOpenAmount(openAmount) {
    if (this.corridorLight) {
      this.corridorLight.intensity = 0.28 + openAmount * 6.5;
    }
  }

  update() {
    // Lighting remains clean and steady without decorative sparkles or flickering
  }
}
