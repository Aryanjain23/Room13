import * as THREE from 'three';
import owaspPosterUrl from '../assets/owasp-poster.png';
import { getDifficultyConfig } from '../data/puzzleData.js';
import { RoommateBuilder } from './RoommateBuilder.js';
import { WardenBuilder } from './WardenBuilder.js';
import {
  createFloorTileTexture,
  createWallPlasterTexture,
  createWoodTexture,
  createFabricTexture,
  createRugTexture,
  createClockFaceTexture,
  createNoticeBoardTexture,
  createNotebookTexture,
  createPlaqueTexture,
  createTornNoteTexture,
  createContactShadowTexture,
  createPaperBackdropTexture,
} from './ProceduralTextures.js';

export class RoomBuilder {
  constructor(scene, maxAnisotropy = 4) {
    this.scene = scene;
    this.maxAnisotropy = maxAnisotropy;
    this.interactables = new Map();
    this.roommateBuilder = new RoommateBuilder(scene);
    this.wardenBuilder = new WardenBuilder(scene);
    this.difficultyTargets = {
      clockHourPivot: null,
      clockMinutePivot: null,
      clockDialMat: null,
      noticeMat: null,
      bedTagMat: null,
      notebookMat: null,
      tornNoteMat: null,
      wardrobeTagMesh: null,
      wardrobeTagMat: null,
    };
    this.animated = {
      ceilingFan: null,
      secondHand: null,
      drawerGroup: null,
      tornNoteMesh: null,
      notebookFlipPivot: null,
      wardrobeLeftDoor: null,
      wardrobeRightDoor: null,
      doorPivot: null,
      doorHandlePivot: null,
      keypadLedMat: null,
      curtainLeft: null,
      curtainRight: null,
      corridorBackdropMat: null,
      roommate: this.roommateBuilder,
      warden: this.wardenBuilder,
    };
  }

  build() {
    this.buildMaterials();
    this.buildRoomShell();
    this.buildExteriorNight();
    this.buildExteriorCorridor();
    this.buildCeilingFan();
    this.buildStudyDeskArea();
    this.buildNoticeBoard();
    this.buildOwaspPosterIfUploaded();
    this.buildWallClock();
    this.buildBedArea();
    this.buildWardrobe();
    this.buildWindow();
    this.buildExitDoor();
    this.buildRoommate();
    this.wardenBuilder.build();

    this.applyDifficulty('easy');

    return {
      interactables: this.interactables,
      animated: this.animated,
    };
  }

  buildMaterials() {
    const aniso = this.maxAnisotropy;
    this.mats = {
      floor: new THREE.MeshStandardMaterial({
        map: createFloorTileTexture(aniso),
        roughness: 0.78,
        metalness: 0.02,
      }),
      wall: new THREE.MeshStandardMaterial({
        map: createWallPlasterTexture(aniso),
        roughness: 0.9,
        metalness: 0.0,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0x3b4250,
        roughness: 0.92,
        metalness: 0.0,
      }),
      darkWood: new THREE.MeshStandardMaterial({
        map: createWoodTexture('#4c311d', '#241409', aniso),
        roughness: 0.64,
        metalness: 0.02,
      }),
      warmWood: new THREE.MeshStandardMaterial({
        map: createWoodTexture('#6b462a', '#3a2212', aniso),
        roughness: 0.6,
        metalness: 0.02,
      }),
      trimWood: new THREE.MeshStandardMaterial({
        color: 0x261a11,
        roughness: 0.72,
        metalness: 0.02,
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xd4a84f,
        roughness: 0.42,
        metalness: 0.72,
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: 0x1e242c,
        roughness: 0.56,
        metalness: 0.58,
      }),
      steel: new THREE.MeshStandardMaterial({
        color: 0xb7c2cc,
        roughness: 0.38,
        metalness: 0.72,
      }),
      blanket: new THREE.MeshStandardMaterial({
        map: createFabricTexture('#2c4663', '#1c3046', aniso),
        roughness: 0.88,
        metalness: 0.0,
      }),
      curtain: new THREE.MeshStandardMaterial({
        map: createFabricTexture('#52323a', '#3a2127', aniso),
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
      contactShadow: new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      }),
    };
  }

  addContactShadow(x, z, width, depth) {
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), this.mats.contactShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, 0.004, z);
    shadow.renderOrder = 1;
    this.scene.add(shadow);
  }

  registerInteractable(id, group, hitMesh) {
    hitMesh.userData.objectId = id;
    group.userData.objectId = id;
    this.interactables.set(id, {
      id,
      group,
      hitMesh,
    });
  }

  applyDifficulty(difficultyId) {
    const cfg = getDifficultyConfig(difficultyId);
    const aniso = this.maxAnisotropy;

    if (this.difficultyTargets.clockHourPivot && this.difficultyTargets.clockMinutePivot) {
      const { hour, minute } = cfg.clockTime;
      this.difficultyTargets.clockHourPivot.rotation.z =
        -(((hour % 12) + minute / 60) / 12) * Math.PI * 2;
      this.difficultyTargets.clockMinutePivot.rotation.z = -(minute / 60) * Math.PI * 2;
    }

    if (this.difficultyTargets.clockDialMat) {
      if (this.difficultyTargets.clockDialMat.map) this.difficultyTargets.clockDialMat.map.dispose();
      this.difficultyTargets.clockDialMat.map = createClockFaceTexture(aniso, cfg.clockTime);
      this.difficultyTargets.clockDialMat.needsUpdate = true;
    }

    if (this.difficultyTargets.noticeMat) {
      if (this.difficultyTargets.noticeMat.map) this.difficultyTargets.noticeMat.map.dispose();
      this.difficultyTargets.noticeMat.map = createNoticeBoardTexture(aniso, cfg.noticeText);
      this.difficultyTargets.noticeMat.needsUpdate = true;
    }

    if (this.difficultyTargets.bedTagMat) {
      if (this.difficultyTargets.bedTagMat.map) this.difficultyTargets.bedTagMat.map.dispose();
      this.difficultyTargets.bedTagMat.map = createPlaqueTexture(
        cfg.bedTag,
        '#cfd4dc',
        '#18202c',
        38,
        aniso
      );
      this.difficultyTargets.bedTagMat.needsUpdate = true;
    }

    if (this.difficultyTargets.notebookMat) {
      if (this.difficultyTargets.notebookMat.map) this.difficultyTargets.notebookMat.map.dispose();
      this.difficultyTargets.notebookMat.map = createNotebookTexture(aniso, cfg.notebookLines);
      this.difficultyTargets.notebookMat.needsUpdate = true;
    }

    if (this.difficultyTargets.tornNoteMat) {
      if (this.difficultyTargets.tornNoteMat.map) this.difficultyTargets.tornNoteMat.map.dispose();
      this.difficultyTargets.tornNoteMat.map = createTornNoteTexture(aniso, cfg.tornNoteLines);
      this.difficultyTargets.tornNoteMat.needsUpdate = true;
    }

    if (this.difficultyTargets.wardrobeTagMesh) {
      if (cfg.wardrobeTag && this.difficultyTargets.wardrobeTagMat) {
        if (this.difficultyTargets.wardrobeTagMat.map) {
          this.difficultyTargets.wardrobeTagMat.map.dispose();
        }
        this.difficultyTargets.wardrobeTagMat.map = createPlaqueTexture(
          cfg.wardrobeTag,
          '#2e2217',
          '#e6dfd1',
          34,
          aniso
        );
        this.difficultyTargets.wardrobeTagMat.needsUpdate = true;
        this.difficultyTargets.wardrobeTagMesh.visible = true;
      } else {
        this.difficultyTargets.wardrobeTagMesh.visible = false;
      }
    }
  }

  buildRoomShell() {
    const W = 5.4;
    const D = 4.8;
    const H = 3.0;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), this.mats.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const rugMat = new THREE.MeshStandardMaterial({
      map: createRugTexture(this.maxAnisotropy),
      roughness: 0.92,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.012, 1.35), rugMat);
    rug.position.set(0.05, 0.006, 0.15);
    rug.receiveShadow = true;
    this.scene.add(rug);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), this.mats.ceiling);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    this.scene.add(ceiling);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.18, 0.24), this.mats.ceiling);
    beam.position.set(0, H - 0.09, -0.5);
    this.scene.add(beam);

    const northWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.mats.wall);
    northWall.position.set(0, H / 2, -D / 2);
    northWall.receiveShadow = true;
    this.scene.add(northWall);

    const southWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.mats.wall);
    southWall.rotation.y = Math.PI;
    southWall.position.set(0, H / 2, D / 2);
    southWall.receiveShadow = true;
    this.scene.add(southWall);

    const westWallGroup = new THREE.Group();
    const westLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.8, H), this.mats.wall);
    westLeft.position.set(0, H / 2, -2.0);
    westLeft.rotation.y = Math.PI / 2;

    const westRight = new THREE.Mesh(new THREE.PlaneGeometry(2.7, H), this.mats.wall);
    westRight.position.set(0, H / 2, 1.05);
    westRight.rotation.y = Math.PI / 2;

    const westBottom = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.0), this.mats.wall);
    westBottom.position.set(0, 0.5, -0.95);
    westBottom.rotation.y = Math.PI / 2;

    const westTop = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.75), this.mats.wall);
    westTop.position.set(0, 2.625, -0.95);
    westTop.rotation.y = Math.PI / 2;

    [westLeft, westRight, westBottom, westTop].forEach((m) => {
      m.receiveShadow = true;
      westWallGroup.add(m);
    });
    westWallGroup.position.x = -W / 2;
    this.scene.add(westWallGroup);

    const eastWallGroup = new THREE.Group();
    const eastLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.74, H), this.mats.wall);
    eastLeft.position.set(0, H / 2, -1.03);
    eastLeft.rotation.y = -Math.PI / 2;

    const eastRight = new THREE.Mesh(new THREE.PlaneGeometry(1.04, H), this.mats.wall);
    eastRight.position.set(0, H / 2, 1.88);
    eastRight.rotation.y = -Math.PI / 2;

    const eastTop = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.82), this.mats.wall);
    eastTop.position.set(0, 2.59, 0.85);
    eastTop.rotation.y = -Math.PI / 2;

    [eastLeft, eastRight, eastTop].forEach((m) => {
      m.receiveShadow = true;
      eastWallGroup.add(m);
    });
    eastWallGroup.position.x = W / 2;
    this.scene.add(eastWallGroup);

    const skirtMat = this.mats.trimWood;
    const nSkirt = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, 0.03), skirtMat);
    nSkirt.position.set(0, 0.05, -D / 2 + 0.015);
    const sSkirt = new THREE.Mesh(new THREE.BoxGeometry(W, 0.1, 0.03), skirtMat);
    sSkirt.position.set(0, 0.05, D / 2 - 0.015);
    const wSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, D), skirtMat);
    wSkirt.position.set(-W / 2 + 0.015, 0.05, 0);
    this.scene.add(nSkirt, sSkirt, wSkirt);

    // Interactive Switchboard on East Wall beside Door (ordinary prop, no clue)
    const switchGroup = new THREE.Group();
    switchGroup.position.set(2.68, 1.38, -0.1);
    const switchBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.18, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.5 })
    );
    const switchHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.28, 0.24),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    switchGroup.add(switchBox, switchHit);
    this.scene.add(switchGroup);
    this.registerInteractable('switchboard', switchGroup, switchHit);

    const tubeHousing = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.05, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xc2c6cc, roughness: 0.4, metalness: 0.4 })
    );
    tubeHousing.position.set(0.15, 2.66, -2.36);
    this.scene.add(tubeHousing);
  }

  buildExteriorNight() {
    const ext = new THREE.Group();
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x0a132c });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), skyMat);
    sky.rotation.y = Math.PI / 2;
    sky.position.set(-5.8, 1.9, -0.95);
    ext.add(sky);

    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 24),
      new THREE.MeshBasicMaterial({ color: 0xe6eeff })
    );
    moon.rotation.y = Math.PI / 2;
    moon.position.set(-5.6, 2.55, -1.55);
    ext.add(moon);

    const bldMat = new THREE.MeshBasicMaterial({ color: 0x090e1c });
    const dimWinMat = new THREE.MeshBasicMaterial({ color: 0x384257 });
    const blocks = [
      { z: -2.3, h: 2.5, d: 1.4 },
      { z: -0.7, h: 3.1, d: 1.2 },
      { z: 0.8, h: 2.2, d: 1.5 },
    ];
    blocks.forEach((b) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, b.h, b.d), bldMat);
      m.position.set(-5.0, b.h / 2 - 0.3, b.z);
      ext.add(m);
      for (let k = 0; k < 3; k += 1) {
        if ((k + Math.round(b.z)) % 2 === 0) {
          const w = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.18), dimWinMat);
          w.rotation.y = Math.PI / 2;
          w.position.set(-4.69, 0.8 + k * 0.55, b.z - 0.25 + k * 0.22);
          ext.add(w);
        }
      }
    });

    this.scene.add(ext);
  }

  buildExteriorCorridor() {
    const corr = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffd796,
      emissive: 0xffa63d,
      emissiveIntensity: 0.45,
      roughness: 0.7,
    });
    this.animated.corridorBackdropMat = wallMat;

    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.8), wallMat);
    back.rotation.y = -Math.PI / 2;
    back.position.set(4.1, 1.4, 0.85);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x4b3b2b, roughness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(3.45, 0.005, 0.85);

    corr.add(back, floor);
    this.scene.add(corr);
  }

  buildCeilingFan() {
    const fan = new THREE.Group();
    fan.position.set(0, 3.0, 0.1);

    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.06, 16), this.mats.darkMetal);
    canopy.position.y = -0.03;

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 12), this.mats.darkMetal);
    rod.position.y = -0.21;

    const spinner = new THREE.Group();
    spinner.position.y = -0.4;

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.07, 20), this.mats.darkWood);
    spinner.add(hub);

    for (let i = 0; i < 3; i += 1) {
      const bladeWrap = new THREE.Group();
      bladeWrap.rotation.y = (i * Math.PI * 2) / 3;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.04), this.mats.brass);
      bracket.position.x = 0.14;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.13), this.mats.darkWood);
      blade.position.x = 0.44;
      blade.rotation.x = 0.14;
      bladeWrap.add(bracket, blade);
      spinner.add(bladeWrap);
    }

    fan.add(canopy, rod, spinner);
    this.scene.add(fan);
    this.animated.ceilingFan = spinner;
  }

  buildStudyDeskArea() {
    const desk = new THREE.Group();
    desk.position.set(0.35, 0, -1.92);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.045, 0.72), this.mats.warmWood);
    top.position.y = 0.76;
    top.castShadow = true;
    top.receiveShadow = true;
    desk.add(top);

    const apron = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.03), this.mats.darkWood);
    apron.position.set(0, 0.7, 0.32);
    desk.add(apron);

    const legGeo = new THREE.BoxGeometry(0.055, 0.74, 0.055);
    [
      [-0.7, -0.31],
      [0.7, -0.31],
      [-0.7, 0.31],
      [0.7, 0.31],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, this.mats.darkWood);
      leg.position.set(lx, 0.37, lz);
      leg.castShadow = true;
      leg.receiveShadow = true;
      desk.add(leg);
    });

    const pedSideL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.64), this.mats.darkWood);
    pedSideL.position.set(0.08, 0.42, 0);
    const pedSideR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.64), this.mats.darkWood);
    pedSideR.position.set(0.66, 0.42, 0);
    const pedBottom = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.28, 0.62), this.mats.darkWood);
    pedBottom.position.set(0.37, 0.25, 0);
    const pedBack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.03), this.mats.darkWood);
    pedBack.position.set(0.37, 0.56, -0.3);
    desk.add(pedSideL, pedSideR, pedBottom, pedBack);

    const drawerGroup = new THREE.Group();
    drawerGroup.position.set(0.37, 0.61, 0.02);

    const drFront = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.035), this.mats.warmWood);
    drFront.position.z = 0.295;
    drFront.castShadow = true;

    const drBottom = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.56), this.mats.darkWood);
    drBottom.position.set(0, -0.06, 0.01);

    const drSideL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.56), this.mats.darkWood);
    drSideL.position.set(-0.24, -0.01, 0.01);
    const drSideR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.56), this.mats.darkWood);
    drSideR.position.set(0.24, -0.01, 0.01);

    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.055, 0.012), this.mats.brass);
    lockPlate.position.set(0, 0.02, 0.318);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.016, 0.028), this.mats.brass);
    handle.position.set(0, -0.03, 0.325);

    const tornNoteMat = new THREE.MeshStandardMaterial({
      map: createTornNoteTexture(this.maxAnisotropy),
      roughness: 0.85,
    });
    this.difficultyTargets.tornNoteMat = tornNoteMat;
    const tornNote = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.004, 0.16), tornNoteMat);
    tornNote.position.set(0, -0.045, 0.06);
    tornNote.rotation.y = 0.18;
    tornNote.visible = false;
    this.animated.tornNoteMesh = tornNote;

    const drawerHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.24, 0.22),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    drawerHit.position.set(0, 0, 0.34);

    drawerGroup.add(drFront, drBottom, drSideL, drSideR, lockPlate, handle, tornNote, drawerHit);
    desk.add(drawerGroup);
    this.animated.drawerGroup = drawerGroup;
    this.registerInteractable('drawer', drawerGroup, drawerHit);

    const chair = new THREE.Group();
    chair.position.set(0.12, 0, -1.36);
    chair.rotation.y = 0.22;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.44), this.mats.warmWood);
    seat.position.y = 0.45;
    seat.castShadow = true;
    chair.add(seat);
    [
      [-0.19, -0.18],
      [0.19, -0.18],
      [-0.19, 0.18],
      [0.19, 0.18],
    ].forEach(([cx, cz]) => {
      const cLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.04), this.mats.darkWood);
      cLeg.position.set(cx, 0.22, cz);
      cLeg.castShadow = true;
      chair.add(cLeg);
    });
    const backPostL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), this.mats.darkWood);
    backPostL.position.set(-0.19, 0.71, 0.19);
    const backPostR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), this.mats.darkWood);
    backPostR.position.set(0.19, 0.71, 0.19);
    const backRest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.03), this.mats.warmWood);
    backRest.position.set(0, 0.84, 0.19);
    chair.add(backPostL, backPostR, backRest);
    this.scene.add(chair);

    this.addContactShadow(0.35, -1.92, 1.8, 0.95);
    this.addContactShadow(0.12, -1.36, 0.65, 0.65);

    const notebookGroup = new THREE.Group();
    notebookGroup.position.set(0.05, 0.785, -1.86);
    notebookGroup.rotation.y = 0.08;

    const nbCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.012, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x1e3830, roughness: 0.7 })
    );
    const nbMat = new THREE.MeshStandardMaterial({
      map: createNotebookTexture(this.maxAnisotropy),
      roughness: 0.85,
    });
    this.difficultyTargets.notebookMat = nbMat;
    const nbPages = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.014, 0.23), nbMat);
    nbPages.position.y = 0.005;

    const flipPivot = new THREE.Group();
    flipPivot.position.set(0, 0.013, 0);
    const flipSheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.155, 0.003, 0.225),
      new THREE.MeshStandardMaterial({ color: 0xf4edd9, roughness: 0.88 })
    );
    flipSheet.position.set(0.078, 0, 0);
    flipPivot.add(flipSheet);
    this.animated.notebookFlipPivot = flipPivot;

    const nbHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    nbHit.position.y = 0.03;

    notebookGroup.add(nbCover, nbPages, flipPivot, nbHit);
    this.scene.add(notebookGroup);
    this.registerInteractable('notebook', notebookGroup, nbHit);

    const bookColors = [0x7e2929, 0x264473, 0xcab993];
    bookColors.forEach((col, i) => {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.24 - i * 0.015, 0.036, 0.18 - i * 0.01),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.78 })
      );
      b.position.set(-0.24, 0.8 + i * 0.037, -2.02);
      b.rotation.y = (i - 1) * 0.12;
      b.castShadow = true;
      this.scene.add(b);
    });

    // Steel Chai Mug (ordinary non-clue inspectable prop)
    const mugGroup = new THREE.Group();
    mugGroup.position.set(0.42, 0.785, -1.95);
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.095, 16), this.mats.steel);
    mug.position.y = 0.045;
    mug.castShadow = true;
    const chai = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.01, 14),
      new THREE.MeshStandardMaterial({ color: 0x6f4322, roughness: 0.3 })
    );
    chai.position.y = 0.088;
    const mugHit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.16, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    mugHit.position.y = 0.06;
    mugGroup.add(mug, chai, mugHit);
    this.scene.add(mugGroup);
    this.registerInteractable('mug', mugGroup, mugHit);

    const lamp = new THREE.Group();
    lamp.position.set(0.84, 0.785, -2.05);
    const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.025, 20), this.mats.darkMetal);
    const lStem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 10), this.mats.brass);
    lStem1.position.set(0, 0.14, 0);
    lStem1.rotation.z = 0.25;
    const lStem2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 10), this.mats.brass);
    lStem2.position.set(-0.07, 0.34, 0.03);
    lStem2.rotation.z = -0.55;
    lStem2.rotation.x = 0.2;

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.11, 0.12, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x265c45,
        roughness: 0.35,
        metalness: 0.2,
        side: THREE.DoubleSide,
      })
    );
    shade.position.set(-0.14, 0.42, 0.06);
    shade.rotation.z = -0.35;

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffe0a3,
        emissive: 0xffad3b,
        emissiveIntensity: 0.85,
      })
    );
    bulb.position.set(-0.14, 0.39, 0.06);

    lamp.add(lBase, lStem1, lStem2, shade, bulb);
    this.scene.add(lamp);

    const tableHit = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 0.84, 0.78),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    tableHit.position.set(0, 0.42, 0);
    desk.add(tableHit);
    this.registerInteractable('table', desk, tableHit);

    this.scene.add(desk);
  }

  buildNoticeBoard() {
    const boardGroup = new THREE.Group();
    boardGroup.position.set(0.2, 1.68, -2.36);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.78, 0.04), this.mats.darkWood);
    frame.castShadow = true;

    const noticeMat = new THREE.MeshStandardMaterial({
      map: createNoticeBoardTexture(this.maxAnisotropy),
      roughness: 0.85,
    });
    this.difficultyTargets.noticeMat = noticeMat;

    const cork = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.68), noticeMat);
    cork.position.z = 0.022;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.84, 0.16),
      new THREE.MeshBasicMaterial({ visible: false })
    );

    boardGroup.add(frame, cork, hit);
    this.scene.add(boardGroup);
    this.registerInteractable('notice', boardGroup, hit);
  }

  buildOwaspPosterIfUploaded() {
    // Exact aspect ratio of attached src/assets/owasp-poster.png (1080 x 1266)
    const artW = 0.52;
    const initialAspect = 1080 / 1266;
    const artH = artW / initialAspect;
    const sheetW = artW + 0.08;
    const sheetH = artH + 0.21;

    const posterGroup = new THREE.Group();
    posterGroup.position.set(1.38, 1.66, -2.382);

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(sheetW, sheetH, 0.006),
      new THREE.MeshStandardMaterial({
        map: createPaperBackdropTexture(this.maxAnisotropy),
        roughness: 0.92,
        metalness: 0.0,
      })
    );
    backing.receiveShadow = true;

    const loader = new THREE.TextureLoader();
    const imgTex = loader.load(owaspPosterUrl, (loaded) => {
      const img = loaded.image;
      if (img && img.width && img.height) {
        const aspect = img.width / img.height;
        const correctedH = artW / aspect;
        artwork.geometry.dispose();
        artwork.geometry = new THREE.PlaneGeometry(artW, correctedH);
      }
    });
    imgTex.colorSpace = THREE.SRGBColorSpace;
    imgTex.anisotropy = this.maxAnisotropy;

    const artwork = new THREE.Mesh(
      new THREE.PlaneGeometry(artW, artH),
      new THREE.MeshStandardMaterial({
        map: imgTex,
        roughness: 0.9,
        metalness: 0.0,
      })
    );
    artwork.position.set(0, 0.055, 0.005);
    artwork.receiveShadow = true;

    // Subtle matte masking tape strips at upper corners for physical wall-mounted look
    const tapeMat = new THREE.MeshStandardMaterial({
      color: 0xd8cdb3,
      roughness: 0.94,
      metalness: 0.0,
    });
    const tapeGeo = new THREE.BoxGeometry(0.065, 0.018, 0.002);
    const tapeL = new THREE.Mesh(tapeGeo, tapeMat);
    tapeL.position.set(-sheetW / 2 + 0.032, sheetH / 2 - 0.016, 0.005);
    tapeL.rotation.z = 0.62;
    const tapeR = new THREE.Mesh(tapeGeo, tapeMat);
    tapeR.position.set(sheetW / 2 - 0.032, sheetH / 2 - 0.016, 0.005);
    tapeR.rotation.z = -0.62;

    posterGroup.add(backing, artwork, tapeL, tapeR);
    this.scene.add(posterGroup);
  }

  buildWallClock() {
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-1.15, 2.02, -2.35);

    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.055, 32),
      this.mats.darkMetal
    );
    bezel.rotation.x = Math.PI / 2;
    bezel.castShadow = true;

    const dialMat = new THREE.MeshStandardMaterial({
      map: createClockFaceTexture(this.maxAnisotropy),
      roughness: 0.72,
    });
    this.difficultyTargets.clockDialMat = dialMat;
    const dial = new THREE.Mesh(new THREE.CircleGeometry(0.23, 32), dialMat);
    dial.position.z = 0.029;

    const handMat = new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.5 });

    const hourPivot = new THREE.Group();
    hourPivot.position.z = 0.034;
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.12, 0.006), handMat);
    hourHand.position.y = 0.048;
    hourPivot.add(hourHand);
    this.difficultyTargets.clockHourPivot = hourPivot;

    const minutePivot = new THREE.Group();
    minutePivot.position.z = 0.038;
    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.175, 0.006), handMat);
    minuteHand.position.y = 0.072;
    minutePivot.add(minuteHand);
    this.difficultyTargets.clockMinutePivot = minutePivot;

    const secondPivot = new THREE.Group();
    secondPivot.position.z = 0.042;
    const secondHand = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.19, 0.004),
      new THREE.MeshStandardMaterial({ color: 0xc22c24, roughness: 0.4 })
    );
    secondHand.position.y = 0.075;
    secondPivot.add(secondHand);
    this.animated.secondHand = secondPivot;

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.015, 12),
      new THREE.MeshStandardMaterial({ color: 0xc22c24 })
    );
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.045;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.58, 0.16),
      new THREE.MeshBasicMaterial({ visible: false })
    );

    clockGroup.add(bezel, dial, hourPivot, minutePivot, secondPivot, cap, hit);
    this.scene.add(clockGroup);
    this.registerInteractable('clock', clockGroup, hit);
  }

  buildBedArea() {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-2.05, 0, 0.88);

    const frameMat = this.mats.darkWood;
    const railBase = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.08, 2.04), frameMat);
    railBase.position.y = 0.28;
    railBase.castShadow = true;
    railBase.receiveShadow = true;

    const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.86, 0.07), frameMat);
    headboard.position.set(0, 0.43, -1.0);
    headboard.castShadow = true;

    const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.46, 0.06), frameMat);
    footboard.position.set(0, 0.23, 1.0);
    footboard.castShadow = true;

    [
      [-0.48, -0.98],
      [0.48, -0.98],
      [-0.48, 0.98],
      [0.48, 0.98],
    ].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), this.mats.darkMetal);
      leg.position.set(lx, 0.14, lz);
      bedGroup.add(leg);
    });

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(0.98, 0.18, 1.94),
      new THREE.MeshStandardMaterial({ color: 0xd4cfc2, roughness: 0.9 })
    );
    mattress.position.set(0, 0.41, 0);
    mattress.castShadow = true;
    mattress.receiveShadow = true;

    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.01, 0.1, 1.32), this.mats.blanket);
    blanket.position.set(0.01, 0.47, 0.28);
    blanket.castShadow = true;
    blanket.receiveShadow = true;

    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.11, 0.34),
      new THREE.MeshStandardMaterial({ color: 0xe6e0d2, roughness: 0.88 })
    );
    pillow.position.set(-0.04, 0.54, -0.74);
    pillow.rotation.y = 0.09;
    pillow.rotation.x = 0.08;
    pillow.castShadow = true;

    const bedTagMat = new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('BED NO. 7', '#cfd4dc', '#18202c', 38, this.maxAnisotropy),
      roughness: 0.35,
      metalness: 0.65,
    });
    this.difficultyTargets.bedTagMat = bedTagMat;
    const tagPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.22), bedTagMat);
    tagPlate.position.set(0.53, 0.28, 0.24);

    const slipperMat = new THREE.MeshStandardMaterial({ color: 0x245a78, roughness: 0.8 });
    const slip1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.24), slipperMat);
    slip1.position.set(0.75, 0.015, 0.12);
    slip1.rotation.y = 0.22;
    const slip2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.24), slipperMat);
    slip2.position.set(0.88, 0.015, 0.22);
    slip2.rotation.y = -0.15;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.9, 2.15),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.y = 0.45;

    bedGroup.add(railBase, headboard, footboard, mattress, blanket, pillow, tagPlate, slip1, slip2, hit);
    this.scene.add(bedGroup);
    this.addContactShadow(-2.05, 0.88, 1.35, 2.3);
    this.registerInteractable('bed', bedGroup, hit);
  }

  buildWardrobe() {
    const wardGroup = new THREE.Group();
    wardGroup.position.set(2.22, 0, -1.15);

    const w = 0.72;
    const h = 2.08;
    const d = 1.08;

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, d), this.mats.darkWood);
    back.position.set(w / 2 - 0.02, h / 2, 0);
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.06, d + 0.06), this.mats.darkWood);
    top.position.set(0, h - 0.03, 0);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), this.mats.darkWood);
    bottom.position.set(0, 0.04, 0);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), this.mats.darkWood);
    sideL.position.set(0, h / 2, -d / 2 + 0.02);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), this.mats.darkWood);
    sideR.position.set(0, h / 2, d / 2 - 0.02);
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.08, 0.03, d - 0.08), this.mats.warmWood);
    shelf.position.set(0.02, 1.15, 0);

    // Chalked compartment label visible inside shelf on Moderate & Hard difficulties
    const wardrobeTagMat = new THREE.MeshStandardMaterial({
      map: createPlaqueTexture('LOCKER #60', '#2e2217', '#e6dfd1', 34, this.maxAnisotropy),
      roughness: 0.85,
    });
    this.difficultyTargets.wardrobeTagMat = wardrobeTagMat;
    const shelfTag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.1),
      wardrobeTagMat
    );
    shelfTag.rotation.y = -Math.PI / 2;
    shelfTag.position.set(w / 2 - 0.045, 1.38, 0);
    shelfTag.visible = false;
    this.difficultyTargets.wardrobeTagMesh = shelfTag;

    const clothes1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.14, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x6f3232, roughness: 0.9 })
    );
    clothes1.position.set(0.05, 1.24, -0.2);
    const clothes2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.12, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x2c4a6b, roughness: 0.9 })
    );
    clothes2.position.set(0.05, 1.23, 0.22);

    const doorLeftPivot = new THREE.Group();
    doorLeftPivot.position.set(-w / 2 + 0.02, 0, -d / 2 + 0.04);
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.035, h - 0.14, d / 2 - 0.045), this.mats.warmWood);
    doorL.position.set(0, h / 2, (d / 2 - 0.045) / 2);
    doorL.castShadow = true;
    const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.02), this.mats.brass);
    handleL.position.set(-0.025, 1.05, d / 2 - 0.09);
    doorLeftPivot.add(doorL, handleL);

    const doorRightPivot = new THREE.Group();
    doorRightPivot.position.set(-w / 2 + 0.02, 0, d / 2 - 0.04);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.035, h - 0.14, d / 2 - 0.045), this.mats.warmWood);
    doorR.position.set(0, h / 2, -(d / 2 - 0.045) / 2);
    doorR.castShadow = true;
    const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.02), this.mats.brass);
    handleR.position.set(-0.025, 1.05, -(d / 2 - 0.09));
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.22, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x354663, roughness: 0.9 })
    );
    sleeve.position.set(-0.03, 0.78, -(d / 2 - 0.05));
    sleeve.rotation.z = 0.25;
    doorRightPivot.add(doorR, handleR, sleeve);

    this.animated.wardrobeLeftDoor = doorLeftPivot;
    this.animated.wardrobeRightDoor = doorRightPivot;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, h, d + 0.1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.y = h / 2;

    wardGroup.add(
      back,
      top,
      bottom,
      sideL,
      sideR,
      shelf,
      shelfTag,
      clothes1,
      clothes2,
      doorLeftPivot,
      doorRightPivot,
      hit
    );
    this.scene.add(wardGroup);
    this.addContactShadow(2.22, -1.15, 0.95, 1.25);
    this.registerInteractable('wardrobe', wardGroup, hit);
  }

  buildWindow() {
    const winGroup = new THREE.Group();
    winGroup.position.set(-2.69, 1.62, -0.95);

    const topF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 1.34), this.mats.trimWood);
    topF.position.y = 0.625;
    const botF = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 1.38), this.mats.trimWood);
    botF.position.y = -0.625;
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.06), this.mats.trimWood);
    leftF.position.z = -0.65;
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.06), this.mats.trimWood);
    rightF.position.z = 0.65;
    const midV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.22, 0.04), this.mats.trimWood);
    const midH = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.28), this.mats.trimWood);
    winGroup.add(topF, botF, leftF, rightF, midV, midH);

    for (let i = -2; i <= 2; i += 1) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.22, 8), this.mats.darkMetal);
      bar.position.set(-0.03, 0, i * 0.24);
      winGroup.add(bar);
    }

    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.26, 1.22),
      new THREE.MeshStandardMaterial({
        color: 0xaec8ff,
        transparent: true,
        opacity: 0.14,
        roughness: 0.35,
        metalness: 0.0,
        depthWrite: false,
      })
    );
    glass.rotation.y = Math.PI / 2;
    glass.position.x = -0.02;
    winGroup.add(glass);

    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.56, 10), this.mats.darkMetal);
    rod.rotation.x = Math.PI / 2;
    rod.position.set(0.09, 0.72, 0);
    winGroup.add(rod);

    const curtainL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.44, 0.28), this.mats.curtain);
    curtainL.position.set(0.09, 0.0, -0.58);
    const curtainR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.44, 0.28), this.mats.curtain);
    curtainR.position.set(0.09, 0.0, 0.58);
    winGroup.add(curtainL, curtainR);
    this.animated.curtainLeft = curtainL;
    this.animated.curtainRight = curtainR;

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 1.35, 1.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    winGroup.add(hit);

    this.scene.add(winGroup);
    this.registerInteractable('window', winGroup, hit);
  }

  buildExitDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(2.69, 0, 0.85);

    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.22, 0.06), this.mats.trimWood);
    frameL.position.set(0, 1.11, -0.53);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.22, 0.06), this.mats.trimWood);
    frameR.position.set(0, 1.11, 0.53);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 1.12), this.mats.trimWood);
    frameTop.position.set(0, 2.21, 0);
    doorGroup.add(frameL, frameR, frameTop);

    const doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0, 0.5);

    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.055, 2.16, 0.98), this.mats.darkWood);
    leaf.position.set(0, 1.09, -0.5);
    leaf.castShadow = true;
    leaf.receiveShadow = true;

    const panelUpper = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.72, 0.68), this.mats.warmWood);
    panelUpper.position.set(0, 1.56, -0.5);
    const panelLower = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.78, 0.68), this.mats.warmWood);
    panelLower.position.set(0, 0.62, -0.5);

    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.14, 0.22),
      new THREE.MeshStandardMaterial({
        map: createPlaqueTexture('13', '#d4a746', '#211503', 100, this.maxAnisotropy),
        roughness: 0.3,
        metalness: 0.75,
      })
    );
    plaque.position.set(-0.036, 1.62, -0.5);

    const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.18, 0.05), this.mats.brass);
    handlePlate.position.set(-0.036, 1.02, -0.88);

    const doorHandlePivot = new THREE.Group();
    doorHandlePivot.position.set(-0.044, 1.04, -0.89);
    const leverStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.036, 10), this.mats.brass);
    leverStem.rotation.z = Math.PI / 2;
    leverStem.position.x = -0.015;
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.024, 0.13), this.mats.brass);
    lever.position.set(-0.03, 0, 0.055);
    doorHandlePivot.add(leverStem, lever);
    this.animated.doorHandlePivot = doorHandlePivot;

    doorPivot.add(leaf, panelUpper, panelLower, plaque, handlePlate, doorHandlePivot);
    doorGroup.add(doorPivot);
    this.animated.doorPivot = doorPivot;

    const keypadBox = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.16), this.mats.darkMetal);
    keypadBox.position.set(-0.03, 1.32, -0.66);
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.045, 0.11),
      new THREE.MeshBasicMaterial({ color: 0x0b2218 })
    );
    screen.position.set(-0.05, 1.39, -0.66);

    const ledMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    this.animated.keypadLedMat = ledMat;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), ledMat);
    led.position.set(-0.052, 1.425, -0.61);

    doorGroup.add(keypadBox, screen, led);
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 0.022, 0.024),
          new THREE.MeshStandardMaterial({ color: 0x8b95a5, roughness: 0.4, metalness: 0.3 })
        );
        key.position.set(-0.052, 1.34 - r * 0.032, -0.695 + c * 0.035);
        doorGroup.add(key);
      }
    }

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 2.22, 1.18),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.set(-0.04, 1.11, -0.05);
    doorGroup.add(hit);

    this.scene.add(doorGroup);
    this.registerInteractable('door', doorGroup, hit);
  }

  buildRoommate() {
    const { group, hitMesh } = this.roommateBuilder.build();
    this.registerInteractable('roommate', group, hitMesh);
  }
}
