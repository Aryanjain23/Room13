import * as THREE from 'three';

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function finalizeTexture(canvas, maxAnisotropy = 4, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createFloorTileTexture(anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#25262b';
  ctx.fillRect(0, 0, 512, 512);

  const tiles = 4;
  const size = 512 / tiles;
  for (let r = 0; r < tiles; r += 1) {
    for (let c = 0; c < tiles; c += 1) {
      const shade = 44 + ((r * 7 + c * 11) % 9);
      ctx.fillStyle = `rgb(${shade + 4}, ${shade + 2}, ${shade - 2})`;
      ctx.fillRect(c * size + 3, r * size + 3, size - 6, size - 6);

      for (let s = 0; s < 18; s += 1) {
        const sx = c * size + 8 + Math.random() * (size - 16);
        const sy = r * size + 8 + Math.random() * (size - 16);
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(95,92,88,0.08)' : 'rgba(20,22,28,0.12)';
        ctx.fillRect(sx, sy, 4, 4);
      }
    }
  }
  return finalizeTexture(canvas, anisotropy, 4, 4);
}

export function createWallPlasterTexture(anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#5f6878';
  ctx.fillRect(0, 0, 512, 330);
  ctx.fillStyle = '#33404e';
  ctx.fillRect(0, 330, 512, 182);
  ctx.fillStyle = '#242b35';
  ctx.fillRect(0, 324, 512, 8);

  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.025)';
    ctx.fillRect(x, y, 3, 3);
  }
  return finalizeTexture(canvas, anisotropy, 2, 1);
}

export function createWoodTexture(baseHex = '#4a311e', grainHex = '#2c1b0e', anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 95; i += 1) {
    const y = (i / 95) * 512;
    ctx.strokeStyle = grainHex;
    ctx.globalAlpha = 0.12 + Math.random() * 0.2;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + (Math.random() - 0.5) * 14, 340, y + (Math.random() - 0.5) * 14, 512, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finalizeTexture(canvas, anisotropy);
}

export function createFabricTexture(baseHex = '#2c4159', stripeHex = '#1e2e40', anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = stripeHex;
  for (let i = 0; i < 256; i += 16) {
    ctx.fillRect(0, i, 256, 3);
    ctx.fillRect(i, 0, 2, 256);
  }
  return finalizeTexture(canvas, anisotropy, 2, 2);
}

export function createRugTexture(anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(512, 256);
  ctx.fillStyle = '#4f2724';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#c9934c';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, 476, 220);

  ctx.strokeStyle = '#8b4338';
  ctx.lineWidth = 4;
  ctx.strokeRect(32, 32, 448, 192);

  for (let x = 50; x < 462; x += 34) {
    ctx.fillStyle = '#d4a35e';
    ctx.beginPath();
    ctx.moveTo(x, 128);
    ctx.lineTo(x + 14, 108);
    ctx.lineTo(x + 28, 128);
    ctx.lineTo(x + 14, 148);
    ctx.closePath();
    ctx.fill();
  }
  return finalizeTexture(canvas, anisotropy);
}

export function createClockFaceTexture(
  anisotropy = 4,
  clockSpec = { hour: 10, minute: 40, rimHint: '40 MIN' }
) {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#ebe3cf';
  ctx.beginPath();
  ctx.arc(256, 256, 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#25211a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 256, 232, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 60; i += 1) {
    const a = (i * Math.PI) / 30;
    const isHour = i % 5 === 0;
    const r1 = isHour ? 196 : 212;
    const r2 = 224;
    ctx.strokeStyle = isHour ? '#1a1712' : '#6b6356';
    ctx.lineWidth = isHour ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1);
    ctx.lineTo(256 + Math.sin(a) * r2, 256 - Math.cos(a) * r2);
    ctx.stroke();
  }

  ctx.fillStyle = '#1d1914';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let h = 1; h <= 12; h += 1) {
    const a = (h * Math.PI) / 6;
    ctx.fillText(String(h), 256 + Math.sin(a) * 162, 256 - Math.cos(a) * 162);
  }

  const minAngle = (clockSpec.minute / 60) * Math.PI * 2;
  ctx.fillStyle = '#8b261d';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(
    clockSpec.rimHint || '',
    256 + Math.sin(minAngle) * 110,
    256 - Math.cos(minAngle) * 110
  );

  return finalizeTexture(canvas, anisotropy);
}

export function createNoticeBoardTexture(
  anisotropy = 4,
  noticeSpec = {
    floorLine: 'FLOOR: 2',
    curfewMain: '10:00 PM',
    curfewSub: 'GATES LOCK AT HOUR 10',
    extraLine: 'Warden Round: 11:00 PM',
  }
) {
  const { canvas, ctx } = makeCanvas(768, 512);
  ctx.fillStyle = '#926840';
  ctx.fillRect(0, 0, 768, 512);
  for (let i = 0; i < 1800; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(60,36,16,0.2)' : 'rgba(220,180,120,0.12)';
    ctx.fillRect(Math.random() * 768, Math.random() * 512, 3, 3);
  }

  // Left Sheet: Inspection Sheet
  ctx.fillStyle = '#f2ebdc';
  ctx.fillRect(42, 46, 320, 410);
  ctx.fillStyle = '#1b2434';
  ctx.fillRect(42, 46, 320, 56);
  ctx.fillStyle = '#f9e3b4';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('HOSTEL INSPECTION', 64, 83);

  ctx.fillStyle = '#1d1f24';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('BLOCK: B', 64, 152);
  ctx.fillStyle = '#8b261d';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(noticeSpec.floorLine, 64, 212);
  ctx.fillStyle = '#1d1f24';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('ROOM NO: 13', 64, 268);

  ctx.fillStyle = '#555';
  ctx.font = '20px sans-serif';
  ctx.fillText(noticeSpec.extraLine || 'Warden Round: 11:00 PM', 64, 330);
  ctx.fillText('Keep desks clear & locked', 64, 366);
  ctx.fillText('Sign-in mandatory', 64, 402);

  // Right Top Sheet: Curfew Notice
  ctx.save();
  ctx.translate(565, 165);
  ctx.rotate(0.03);
  ctx.fillStyle = '#fff5d6';
  ctx.fillRect(-150, -110, 300, 220);
  ctx.strokeStyle = '#9f231b';
  ctx.lineWidth = 6;
  ctx.strokeRect(-138, -98, 276, 196);
  ctx.fillStyle = '#9f231b';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOSTEL CURFEW', 0, -45);
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(noticeSpec.curfewMain, 0, 18);
  ctx.fillStyle = '#2c251d';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(noticeSpec.curfewSub, 0, 68);
  ctx.restore();

  // Right Bottom Sheet: Mess / Laundry Note
  ctx.fillStyle = '#d8e6eb';
  ctx.fillRect(425, 305, 290, 155);
  ctx.fillStyle = '#20313a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('MESS & LAUNDRY ROTA', 444, 344);
  ctx.font = '18px sans-serif';
  ctx.fillText('Dinner: 7:30 - 9:15 PM', 444, 382);
  ctx.fillText('Night Chai: Room 13 Kettle', 444, 412);

  [
    [202, 58],
    [565, 68],
    [570, 318],
  ].forEach(([px, py]) => {
    ctx.fillStyle = '#c83226';
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
  });

  return finalizeTexture(canvas, anisotropy);
}

export function createNotebookTexture(
  anisotropy = 4,
  notebookSpec = {
    left: ['v = u + at', 'E = mc^2', 'Curfew check: 10:47'],
    rightHeading: ['Read the room', 'in this order:'],
    rightHighlight: 'TIME -> FLOOR -> BED',
  }
) {
  const { canvas, ctx } = makeCanvas(512, 384);
  ctx.fillStyle = '#f4edd9';
  ctx.fillRect(0, 0, 512, 384);

  ctx.strokeStyle = 'rgba(72, 118, 168, 0.35)';
  ctx.lineWidth = 2;
  for (let y = 44; y < 370; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(252, 0, 8, 384);

  ctx.strokeStyle = 'rgba(130, 74, 24, 0.32)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(110, 290, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#243554';
  ctx.font = 'italic 20px Georgia, serif';
  (notebookSpec.left || []).forEach((line, idx) => {
    ctx.fillText(line, 28, 72 + idx * 54);
  });

  ctx.fillStyle = '#18233a';
  ctx.font = 'bold 21px Georgia, serif';
  (notebookSpec.rightHeading || []).forEach((line, idx) => {
    ctx.fillText(line, 276, 94 + idx * 32);
  });
  ctx.fillStyle = '#8e1c14';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText(notebookSpec.rightHighlight || '', 272, 198);

  ctx.strokeStyle = '#8e1c14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(272, 214);
  ctx.lineTo(486, 214);
  ctx.stroke();

  return finalizeTexture(canvas, anisotropy);
}

export function createPlaqueTexture(text, bg = '#c79b3b', fg = '#241804', fontSize = 110, anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(256, 160);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 160);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 236, 140);
  ctx.fillStyle = fg;
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 84);
  return finalizeTexture(canvas, anisotropy);
}

export function createTornNoteTexture(
  anisotropy = 4,
  lines = [
    'FINAL CODE CLUE:',
    'Hidden in plain sight.',
    'Combine the ROOM NUMBER',
    'with the HOUR OF CURFEW.',
  ]
) {
  const { canvas, ctx } = makeCanvas(384, 256);
  ctx.fillStyle = '#f1e5c4';
  ctx.fillRect(0, 0, 384, 256);
  ctx.fillStyle = '#201812';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(lines[0] || '', 24, 56);
  ctx.font = '19px Georgia, serif';
  ctx.fillText(lines[1] || '', 24, 106);
  ctx.fillText(lines[2] || '', 24, 148);
  ctx.fillText(lines[3] || '', 24, 186);
  return finalizeTexture(canvas, anisotropy);
}

export function createContactShadowTexture() {
  const { canvas, ctx } = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 62);
  grad.addColorStop(0, 'rgba(4, 6, 12, 0.72)');
  grad.addColorStop(0.55, 'rgba(4, 6, 12, 0.34)');
  grad.addColorStop(1, 'rgba(4, 6, 12, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createPaperBackdropTexture(anisotropy = 4) {
  const { canvas, ctx } = makeCanvas(512, 704);
  ctx.fillStyle = '#ebe4d4';
  ctx.fillRect(0, 0, 512, 704);

  // Subtle matte paper fiber grain without bright speckles
  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(40,34,26,0.022)' : 'rgba(255,252,245,0.025)';
    ctx.fillRect(Math.random() * 512, Math.random() * 704, 3, 2);
  }

  // Subtle printed poster inner rule
  ctx.strokeStyle = 'rgba(24, 26, 31, 0.14)';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 668);

  // Clear uppercase OWASP title directly underneath the poster image
  ctx.fillStyle = '#14171c';
  ctx.font = 'bold 62px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OWASP', 256, 628);

  return finalizeTexture(canvas, anisotropy);
}
