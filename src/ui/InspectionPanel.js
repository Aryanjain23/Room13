import { getDifficultyConfig } from '../data/puzzleData.js';
import { getRoomObjectMeta } from '../data/roomObjects.js';

function clockHandEnd(angleRad, radius) {
  return {
    x: (50 + Math.sin(angleRad) * radius).toFixed(1),
    y: (50 - Math.cos(angleRad) * radius).toFixed(1),
  };
}

export class InspectionPanel {
  constructor({ puzzleManager, keypad, sound, onTryDoorHandle, onClose }) {
    this.puzzleManager = puzzleManager;
    this.keypad = keypad;
    this.sound = sound;
    this.onTryDoorHandle = onTryDoorHandle;
    this.onClose = onClose;

    this.activeObjectId = null;
    this.activeInventoryItem = null;
    this.doorHandleMessage = '';

    this.panel = document.createElement('aside');
    this.panel.id = 'inspection-panel';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'false');
    this.panel.hidden = true;
    this.panel.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.panel.addEventListener('pointerup', (e) => e.stopPropagation());
  }

  mount(parentEl) {
    parentEl.appendChild(this.panel);
  }

  openObject(objectId) {
    this.activeInventoryItem = null;
    this.activeObjectId = objectId;
    this.doorHandleMessage = '';
    this.keypad.clearFeedback();
    this.render(this.puzzleManager.getSnapshot());
    this.panel.hidden = false;
  }

  openInventoryItem(item) {
    this.activeObjectId = null;
    this.activeInventoryItem = item;
    this.render(this.puzzleManager.getSnapshot());
    this.panel.hidden = false;
  }

  close() {
    if (this.panel.hidden) return;
    this.panel.hidden = true;
    this.activeObjectId = null;
    this.activeInventoryItem = null;
    if (this.onClose) this.onClose();
  }

  isOpen() {
    return !this.panel.hidden;
  }

  buildCloseUpVisual(objectId, snapshot) {
    const cfg = getDifficultyConfig(snapshot.difficulty);
    const wrap = document.createElement('div');
    wrap.className = 'inspect-visual';

    if (objectId === 'clock') {
      const { hour, minute, rimHint } = cfg.clockTime;
      const hAng = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
      const mAng = (minute / 60) * Math.PI * 2;
      const hEnd = clockHandEnd(hAng, 24);
      const mEnd = clockHandEnd(mAng, 34);
      const formattedTime = `${String(hour).padStart(2, '0')} : ${String(minute).padStart(2, '0')}`;

      wrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;">
          <svg width="68" height="68" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="#ebe3cf" stroke="#ffb347" stroke-width="4"/>
            <line x1="50" y1="50" x2="${hEnd.x}" y2="${hEnd.y}" stroke="#1a1714" stroke-width="5" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="${mEnd.x}" y2="${mEnd.y}" stroke="#8b261d" stroke-width="4" stroke-linecap="round"/>
            <circle cx="50" cy="50" r="4" fill="#c22c24"/>
          </svg>
          <div>
            <div style="font-size:18px;font-weight:700;color:#ffe4b5;">${formattedTime}</div>
            <div style="font-size:13px;color:#a8a090;">Bezel marking: ${rimHint}</div>
          </div>
        </div>
      `;
      return wrap;
    }

    if (objectId === 'notice') {
      wrap.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
          <div style="background:#f2ebdc;color:#1d1f24;padding:8px;border-radius:4px;">
            <div style="font-weight:700;color:#8b261d;">INSPECTION SHEET</div>
            <div>Block B</div>
            <div style="font-weight:700;font-size:16px;">${cfg.noticeText.floorLine}</div>
            <div>Room: 13</div>
          </div>
          <div style="background:#fff5d6;color:#1d1f24;padding:8px;border-radius:4px;border:2px solid #9f231b;">
            <div style="font-weight:700;color:#9f231b;">CURFEW NOTICE</div>
            <div style="font-weight:700;font-size:16px;">${cfg.noticeText.curfewMain}</div>
            <div style="font-size:12px;">${cfg.noticeText.curfewSub}</div>
          </div>
        </div>
      `;
      return wrap;
    }

    if (objectId === 'notebook') {
      const nbClue = cfg.clues.notebook;
      wrap.innerHTML = `
        <div style="background:#f4edd9;color:#1e2638;padding:10px;border-radius:4px;font-family:Georgia,serif;">
          <div style="font-size:12px;color:#6f4322;">Margin note underlined twice:</div>
          <div style="font-weight:700;margin-top:4px;">${nbClue.content}</div>
        </div>
      `;
      return wrap;
    }

    if (objectId === 'bed') {
      wrap.innerHTML = `
        <div style="background:#cfd4dc;color:#18202c;padding:10px;border-radius:4px;text-align:center;border:2px solid #727b88;">
          <div style="font-size:11px;letter-spacing:0.15em;">HOSTEL INVENTORY TAG</div>
          <div style="font-weight:900;font-size:20px;font-family:Georgia,serif;">${cfg.bedTag}</div>
        </div>
      `;
      return wrap;
    }

    if (objectId === 'door') {
      wrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="background:#d4a746;color:#211503;padding:6px 14px;border-radius:4px;font-family:Cinzel,serif;font-weight:900;font-size:20px;border:2px solid #5c3f08;">
            ROOM 13
          </div>
          <div style="font-size:13px;color:${snapshot.doorUnlocked ? '#4ade80' : '#ff6b5e'};font-weight:700;">
            STATUS: ${snapshot.doorUnlocked ? 'UNLOCKED' : 'LOCKED'}
          </div>
        </div>
      `;
      return wrap;
    }

    return null;
  }

  render(snapshot) {
    this.panel.innerHTML = '';

    if (this.activeInventoryItem) {
      const item = this.activeInventoryItem;
      const head = document.createElement('div');
      head.className = 'inspect-head';
      head.innerHTML = `
        <div>
          <h3 class="inspect-title">${item.name}</h3>
          <div class="inspect-sub">Inventory Clue · ${item.source}</div>
        </div>
      `;
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'r13-icon-btn';
      closeBtn.textContent = 'Return to Room';
      closeBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.close();
      });
      head.appendChild(closeBtn);

      const desc = document.createElement('p');
      desc.className = 'inspect-desc';
      desc.textContent = item.description;

      const clue = document.createElement('div');
      clue.className = 'inspect-clue';
      clue.textContent = item.content;

      this.panel.append(head, desc, clue);
      return;
    }

    if (!this.activeObjectId) return;
    const obj = getRoomObjectMeta(this.activeObjectId, snapshot.difficulty);
    if (!obj) return;

    const head = document.createElement('div');
    head.className = 'inspect-head';
    head.innerHTML = `
      <div>
        <h3 class="inspect-title">${obj.name}</h3>
        <div class="inspect-sub">${obj.subtitle} · ${obj.tag}</div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'inspect-close-btn';
    closeBtn.className = 'r13-icon-btn';
    closeBtn.textContent = 'Return to Room';
    closeBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.close();
    });
    head.appendChild(closeBtn);
    this.panel.appendChild(head);

    const visual = this.buildCloseUpVisual(obj.id, snapshot);
    if (visual) this.panel.appendChild(visual);

    const desc = document.createElement('p');
    desc.className = 'inspect-desc';
    desc.textContent = obj.description;
    this.panel.appendChild(desc);

    if (obj.id === 'drawer') {
      this.panel.appendChild(this.keypad.renderDrawerLock(snapshot));
      if (snapshot.drawerUnlocked) {
        const cfg = getDifficultyConfig(snapshot.difficulty);
        const noteBox = document.createElement('div');
        noteBox.className = 'inspect-clue';
        noteBox.innerHTML = `
          <div style="font-weight:700;margin-bottom:4px;color:#ffb347;">Physical Note Found Inside Drawer:</div>
          <div id="unlocked-drawer-note"></div>
        `;
        noteBox.querySelector('#unlocked-drawer-note').textContent = cfg.clues.tornNote.content;
        this.panel.appendChild(noteBox);

        const drawerToggleBtn = document.createElement('button');
        drawerToggleBtn.type = 'button';
        drawerToggleBtn.id = 'drawer-toggle-btn';
        drawerToggleBtn.className = 'r13-btn';
        drawerToggleBtn.textContent = snapshot.drawerPhysicallyOpen
          ? 'Close Drawer'
          : 'Open Drawer';
        drawerToggleBtn.addEventListener('click', () => {
          this.sound.playClick();
          this.puzzleManager.toggleDrawerOpen();
        });
        this.panel.appendChild(drawerToggleBtn);
      }
    } else if (obj.id === 'wardrobe') {
      const clue = document.createElement('div');
      clue.className = 'inspect-clue';
      clue.textContent = snapshot.wardrobeOpen
        ? obj.clueText
        : 'The double teak doors are shut, with a navy hoodie sleeve pinched in the seam.';
      this.panel.appendChild(clue);

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.id = 'wardrobe-toggle-btn';
      toggleBtn.className = 'r13-btn';
      toggleBtn.textContent = snapshot.wardrobeOpen ? 'Close Wardrobe Doors' : 'Open Wardrobe Doors';
      toggleBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.puzzleManager.toggleWardrobe();
      });
      this.panel.appendChild(toggleBtn);
    } else if (obj.id === 'door') {
      const clue = document.createElement('div');
      clue.className = 'inspect-clue';
      clue.textContent = obj.clueText;
      this.panel.appendChild(clue);

      if (!snapshot.doorUnlocked) {
        const handleBtn = document.createElement('button');
        handleBtn.type = 'button';
        handleBtn.id = 'try-door-handle-btn';
        handleBtn.className = 'r13-btn';
        handleBtn.textContent = 'Try Door Handle';
        handleBtn.addEventListener('click', () => {
          this.sound.playHandleRattle();
          if (this.onTryDoorHandle) this.onTryDoorHandle();
          this.doorHandleMessage = 'The brass lever rattles tightly. Locked from the keypad.';
          this.render(this.puzzleManager.getSnapshot());
        });
        this.panel.appendChild(handleBtn);

        if (this.doorHandleMessage) {
          const msg = document.createElement('div');
          msg.className = 'puzzle-feedback error';
          msg.textContent = this.doorHandleMessage;
          this.panel.appendChild(msg);
        }
      }

      this.panel.appendChild(this.keypad.renderDoorKeypad(snapshot));
    } else if (obj.clueText) {
      const clue = document.createElement('div');
      clue.className = 'inspect-clue';
      clue.textContent = obj.clueText;
      this.panel.appendChild(clue);
    }
  }
}
