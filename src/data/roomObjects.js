import { getDifficultyConfig } from './puzzleData.js';
import { ROOMMATE_PROFILE } from './roommateData.js';

export const ROOM_BOUNDS = {
  width: 5.4,
  depth: 4.8,
  height: 3.0,
  minX: -2.2,
  maxX: 2.2,
  minZ: -1.9,
  maxZ: 1.9,
  eyeHeight: 1.62,
};

export const INITIAL_CAMERA_POSE = {
  position: { x: 0.15, y: 1.62, z: 0.95 },
  yaw: 0.12,
  pitch: -0.06,
};

export const ROOM_OBJECTS = {
  table: {
    id: 'table',
    name: 'Study Table',
    subtitle: 'Wooden hostel study desk & chair',
    description:
      'A heavy sheesham-wood hostel study table lit by a warm green-shaded desk lamp. Hardcover textbooks sit stacked next to a steel mug of half-finished chai, an open notebook, and a right-hand drawer.',
    clueText:
      'A neat stack of hardcover textbooks rests on the left corner beside a cold mug of chai.',
    tag: 'Furniture',
    inspectView: {
      position: { x: 0.35, y: 1.38, z: -0.78 },
      lookAt: { x: 0.35, y: 0.78, z: -1.92 },
    },
  },
  notebook: {
    id: 'notebook',
    name: 'Study Notebook',
    subtitle: 'Spiral-bound physics notebook on desk',
    description:
      'A worn spiral notebook lying open under the amber desk lamp. Margin notes and faint chai cup rings mark its pages.',
    clueText: 'Handwritten instruction: "Read the room in this order: TIME -> FLOOR -> BED."',
    tag: 'Notebook',
    inspectView: {
      position: { x: 0.08, y: 1.24, z: -1.25 },
      lookAt: { x: 0.05, y: 0.78, z: -1.86 },
    },
  },
  clock: {
    id: 'clock',
    name: 'Wall Clock',
    subtitle: 'Plastic wall clock above the study area',
    description:
      'A plain hostel wall clock whose second hand ticks steadily in the quiet room. The hour and minute hands remain stuck in place.',
    clueText: 'The clock displays 10:40.',
    tag: 'Timepiece',
    inspectView: {
      position: { x: -1.05, y: 1.92, z: -1.25 },
      lookAt: { x: -1.15, y: 2.02, z: -2.35 },
    },
  },
  notice: {
    id: 'notice',
    name: 'Notice Board',
    subtitle: 'Corkboard pinned with hostel notices',
    description:
      'A cork notice board crowded with faded circulars, a mess rota, a curfew warning, and an official hostel room inspection sheet.',
    clueText: 'Inspection Sheet and Curfew Notice pinned side by side.',
    tag: 'Notice Board',
    inspectView: {
      position: { x: 0.2, y: 1.68, z: -1.25 },
      lookAt: { x: 0.2, y: 1.68, z: -2.35 },
    },
  },
  bed: {
    id: 'bed',
    name: 'Hostel Bed',
    subtitle: 'Single iron-frame bed by the window',
    description:
      'An unmade hostel bed with a rumpled navy blanket and a worn pillow. Tucked underneath the lower rail is a stamped inventory tag.',
    clueText: 'Label underneath the bed frame: "BED NO. 7".',
    tag: 'Bed Frame',
    inspectView: {
      position: { x: -1.05, y: 0.96, z: 1.15 },
      lookAt: { x: -1.95, y: 0.36, z: 1.05 },
    },
  },
  drawer: {
    id: 'drawer',
    name: 'Desk Drawer',
    subtitle: 'Locked brass-fitted study drawer',
    description:
      'The main right-hand drawer of the study table. A sturdy three-digit brass combination lock secures the handle.',
    clueText: 'Requires a 3-digit combination to unlock.',
    tag: 'Combination Lock',
    inspectView: {
      position: { x: 0.62, y: 1.08, z: -0.95 },
      lookAt: { x: 0.66, y: 0.62, z: -1.62 },
    },
  },
  wardrobe: {
    id: 'wardrobe',
    name: 'Wardrobe',
    subtitle: 'Tall wooden hostel almirah',
    description:
      'A tall teak-finish wardrobe against the east wall. A navy hoodie sleeve is caught between its slightly sagging double doors.',
    clueText:
      'Folded winter sweaters and old exam papers sit on the shelf. Nothing helpful for the locks stands out.',
    tag: 'Storage',
    inspectView: {
      position: { x: 1.05, y: 1.48, z: -1.05 },
      lookAt: { x: 2.2, y: 1.25, z: -1.15 },
    },
  },
  window: {
    id: 'window',
    name: 'Courtyard Window',
    subtitle: 'Steel-grilled window facing the dark courtyard',
    description:
      'Cool moonlight filters through the heavy steel security grille. Across the dark courtyard, another hostel block sits silent under the night sky.',
    clueText:
      'Bolted iron grille and sheer concrete outside. No numbers, notes, or way out here—just the quiet night.',
    tag: 'Window',
    inspectView: {
      position: { x: -1.2, y: 1.62, z: -0.9 },
      lookAt: { x: -2.65, y: 1.62, z: -0.95 },
    },
  },
  mug: {
    id: 'mug',
    name: 'Steel Chai Mug',
    subtitle: 'Half-finished tea on the desk',
    description:
      'An ordinary stainless-steel hostel mug still half-full of lukewarm masala chai. A faint brown ring stains the edge of the tabletop.',
    clueText:
      'Just leftover chai from late-night exam prep. There are no markings or hidden clues on the mug.',
    tag: 'Desk Prop',
    inspectView: {
      position: { x: 0.68, y: 1.2, z: -1.38 },
      lookAt: { x: 0.77, y: 0.84, z: -1.95 },
    },
  },
  switchboard: {
    id: 'switchboard',
    name: 'Wall Switchboard',
    subtitle: 'Hostel electrical switches near the door',
    description:
      'A plastic four-switch panel wired into the overhead ceiling fan and unlit tubelight.',
    clueText:
      'The fan switch is clicked down; the tubelight flickered out earlier tonight. Nothing useful to unlock the room here.',
    tag: 'Fixture',
    inspectView: {
      position: { x: 1.85, y: 1.44, z: -0.1 },
      lookAt: { x: 2.68, y: 1.38, z: -0.1 },
    },
  },
  door: {
    id: 'door',
    name: 'Main Exit Door',
    subtitle: 'Heavy hostel door with brass plaque & keypad',
    description:
      'A solid timber exit door fitted with a brass room number plaque ("13") and a four-digit electronic curfew keypad.',
    clueText: 'Brass Plaque: "Room 13". Electronic Keypad requires a 4-digit exit code.',
    tag: 'Exit Door',
    inspectView: {
      position: { x: 1.25, y: 1.48, z: 0.85 },
      lookAt: { x: 2.65, y: 1.42, z: 0.85 },
    },
  },
  roommate: {
    id: 'roommate',
    name: ROOMMATE_PROFILE.name,
    subtitle: ROOMMATE_PROFILE.subtitle,
    description: ROOMMATE_PROFILE.description,
    clueText: '',
    tag: 'Roommate',
    inspectView: {
      position: { x: -0.78, y: 1.38, z: 0.45 },
      lookAt: { x: -1.66, y: 1.08, z: 0.48 },
    },
  },
};

export function getRoomObjectMeta(objectId, difficulty = 'easy') {
  const base = ROOM_OBJECTS[objectId];
  if (!base) return null;
  const cfg = getDifficultyConfig(difficulty);
  const clue = cfg.clues[objectId];
  if (!clue) {
    if (objectId === 'wardrobe') {
      return {
        ...base,
        clueText:
          'Folded winter sweaters and old exam papers sit on the shelf. Nothing helpful for the locks stands out.',
      };
    }
    if (objectId === 'bed') {
      return {
        ...base,
        clueText: `Stamped metal plate reads "${cfg.bedTag}", though nothing else on the frame stands out.`,
      };
    }
    return base;
  }
  return {
    ...base,
    clueText: clue.content,
  };
}

export const FURNITURE_COLLIDERS = [
  // Study desk + tucked chair
  { id: 'desk_col', minX: -0.55, maxX: 1.22, minZ: -2.38, maxZ: -1.15 },
  // Bed
  { id: 'bed_col', minX: -2.68, maxX: -1.42, minZ: -0.18, maxZ: 2.02 },
  // Wardrobe
  { id: 'wardrobe_col', minX: 1.75, maxX: 2.68, minZ: -1.78, maxZ: -0.55 },
];
