export class HUD {
  constructor({
    puzzleManager,
    hintSystem,
    sound,
    onToggleSound,
    onOpenJournal,
    onOpenSettings,
    onResetView,
    onInspectInventoryItem,
    onJoystickInput,
  }) {
    this.puzzleManager = puzzleManager;
    this.hintSystem = hintSystem;
    this.sound = sound;
    this.onToggleSound = onToggleSound;
    this.onOpenJournal = onOpenJournal;
    this.onOpenSettings = onOpenSettings;
    this.onResetView = onResetView;
    this.onInspectInventoryItem = onInspectInventoryItem;
    this.onJoystickInput = onJoystickInput;

    this.toastTimer = 0;
    this.knownItemIds = new Set();
    this.lastDifficulty = null;
    this.buildDOM();
  }

  buildDOM() {
    this.root = document.createElement('div');
    this.root.id = 'hud-layer';
    this.root.hidden = true;

    this.root.innerHTML = `
      <div class="hud-top">
        <div class="hud-brand">
          <strong>ROOM 13</strong>
          <span id="hud-difficulty" class="hud-diff">Easy Mode</span>
          <span class="hud-time-sub">Block B · 10:47 PM</span>
        </div>

        <div class="hud-progress-wrap">
          <div class="hud-progress-meta">
            <span id="hud-prog-label">Puzzles Completed: 0/3</span>
            <span id="hud-clues-label">Clues Collected: 0/5</span>
          </div>
          <div class="hud-progress-bar">
            <div class="hud-progress-fill" id="hud-prog-fill"></div>
          </div>
        </div>

        <div class="hud-controls">
          <span id="hud-timer" class="hud-timer" role="timer" aria-label="Curfew countdown">10:00</span>
          <button id="hud-journal-btn" type="button" class="r13-icon-btn" title="Open Clue Journal (J)">Journal (0/5)</button>
          <button id="hud-reset-view" type="button" class="r13-icon-btn" title="Reset Camera View (R)">Reset View</button>
          <button id="hud-sound-btn" type="button" class="r13-icon-btn">Sound: On</button>
          <button id="hud-settings-btn" type="button" class="r13-icon-btn" title="Pause & Settings (Esc)">Pause</button>
        </div>
      </div>

      <div id="mobile-pad" class="auto-hide" aria-label="Movement joystick">
        <div id="mobile-stick"></div>
      </div>

      <div class="hud-bottom">
        <div class="hud-objective-line">
          <div class="hud-objective-text">
            <span id="hud-objective" style="color:#ffe2b3;font-weight:700;"></span>
          </div>
          <div class="hud-stages-inline" id="hud-stages"></div>
        </div>
        <div class="hud-dock-row">
          <div class="inventory-bar" id="hud-inventory" aria-label="Collected clues inventory"></div>
          <div id="hud-hint-slot"></div>
        </div>
      </div>
    `;

    this.toastEl = document.createElement('div');
    this.toastEl.id = 'toast-banner';
    this.toastEl.setAttribute('role', 'status');
  }

  mount(parentEl) {
    parentEl.appendChild(this.root);
    parentEl.appendChild(this.toastEl);

    // Prevent clicks/taps on HUD bars from rotating or panning the 3D camera
    ['.hud-top', '.hud-bottom'].forEach((sel) => {
      const el = this.root.querySelector(sel);
      if (el) {
        el.addEventListener('pointerdown', (e) => e.stopPropagation());
        el.addEventListener('pointerup', (e) => e.stopPropagation());
      }
    });

    const hintSlot = this.root.querySelector('#hud-hint-slot');
    this.hintSystem.mount(hintSlot);

    this.root.querySelector('#hud-journal-btn').addEventListener('click', () => {
      this.sound.playClick();
      if (this.onOpenJournal) this.onOpenJournal();
    });

    this.root.querySelector('#hud-sound-btn').addEventListener('click', () => {
      this.sound.playClick();
      if (this.onToggleSound) this.onToggleSound();
    });

    this.root.querySelector('#hud-settings-btn').addEventListener('click', () => {
      this.sound.playClick();
      if (this.onOpenSettings) this.onOpenSettings();
    });

    this.root.querySelector('#hud-reset-view').addEventListener('click', () => {
      this.sound.playClick();
      if (this.onResetView) this.onResetView();
      this.showToast('Camera view reset.', 1800);
    });

    this.setupMobileJoystick();
    this.setupHudTopObserver();
    this.update(this.puzzleManager.getSnapshot());
  }

  syncHudTopInset() {
    const shell = this.root && this.root.parentElement;
    const topBar = this.root && this.root.querySelector('.hud-top');
    if (!shell || !topBar || this.root.hidden) return;
    const rect = topBar.getBoundingClientRect();
    if (rect.height > 0) {
      shell.style.setProperty('--hud-top-bottom', `${Math.ceil(rect.bottom)}px`);
    }
  }

  setupHudTopObserver() {
    const topBar = this.root && this.root.querySelector('.hud-top');
    if (!topBar) return;
    if (typeof ResizeObserver === 'function') {
      this.topObserver = new ResizeObserver(() => this.syncHudTopInset());
      this.topObserver.observe(topBar);
    }
    window.addEventListener('resize', () => this.syncHudTopInset());
  }

  setupMobileJoystick() {
    const pad = this.root.querySelector('#mobile-pad');
    const stick = this.root.querySelector('#mobile-stick');
    let activePointerId = null;

    const updateStick = (clientX, clientY) => {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxDist = rect.width * 0.36;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      if (this.onJoystickInput) {
        this.onJoystickInput(dx / maxDist, dy / maxDist);
      }
    };

    const resetStick = () => {
      activePointerId = null;
      stick.style.transform = 'translate(0px, 0px)';
      if (this.onJoystickInput) this.onJoystickInput(0, 0);
    };

    pad.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      activePointerId = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });

    pad.addEventListener('pointermove', (e) => {
      if (e.pointerId !== activePointerId) return;
      e.stopPropagation();
      updateStick(e.clientX, e.clientY);
    });

    pad.addEventListener('pointerup', (e) => {
      if (e.pointerId !== activePointerId) return;
      e.stopPropagation();
      resetStick();
    });
    pad.addEventListener('pointercancel', resetStick);
  }

  setVisible(visible) {
    this.root.hidden = !visible;
    if (visible) {
      window.requestAnimationFrame(() => this.syncHudTopInset());
    }
  }

  showToast(message, durationMs = 3600) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('on');
    }, durationMs);
  }

  update(snapshot) {
    const totalClues = snapshot.totalCluesCount || 5;
    if (snapshot.difficulty !== this.lastDifficulty) {
      this.lastDifficulty = snapshot.difficulty;
      this.knownItemIds.clear();
    }

    this.root.querySelector('#hud-difficulty').textContent = `${snapshot.difficultyLabel || 'Easy'} Mode`;
    this.root.querySelector('#hud-prog-label').textContent = `Puzzles Completed: ${snapshot.solvedCount}/3`;
    this.root.querySelector('#hud-clues-label').textContent = `Clues Collected: ${snapshot.cluesCollectedCount}/${totalClues}`;
    this.root.querySelector('#hud-prog-fill').style.width = `${(snapshot.solvedCount / 3) * 100}%`;

    const timerEl = this.root.querySelector('#hud-timer');
    const m = Math.floor(snapshot.countdownSeconds / 60);
    const s = snapshot.countdownSeconds % 60;
    timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const lowThreshold = (snapshot.totalDurationSeconds || 600) <= 90 ? 20 : 60;
    timerEl.classList.toggle('low', snapshot.countdownSeconds <= lowThreshold);

    this.root.querySelector('#hud-sound-btn').textContent = `Sound: ${snapshot.soundEnabled ? 'On' : 'Off'}`;
    this.root.querySelector('#hud-journal-btn').textContent = `Journal (${snapshot.cluesCollectedCount}/${totalClues})`;
    this.root.querySelector('#hud-objective').textContent = snapshot.objective;

    const stagesEl = this.root.querySelector('#hud-stages');
    const s1 = snapshot.numbersFound ? 'stage-done' : 'stage-active';
    const s2 = snapshot.drawerUnlocked ? 'stage-done' : snapshot.numbersFound ? 'stage-active' : '';
    const s3 = snapshot.doorUnlocked ? 'stage-done' : snapshot.drawerUnlocked ? 'stage-active' : '';
    stagesEl.innerHTML = `
      <span class="${s1}">1. Explore clues (${snapshot.numberCluesCount}/${snapshot.drawerCluesTotal || 3})</span>
      <span>·</span>
      <span class="${s2}">2. Unlock drawer ${snapshot.drawerUnlocked ? '✓' : ''}</span>
      <span>·</span>
      <span class="${s3}">3. Unlock exit ${snapshot.doorUnlocked ? '✓' : ''}</span>
    `;

    if (snapshot.inventory.length === 0) {
      this.knownItemIds.clear();
    }
    const invEl = this.root.querySelector('#hud-inventory');
    invEl.innerHTML = '';
    for (let i = 0; i < totalClues; i += 1) {
      const item = snapshot.inventory[i];
      const slot = document.createElement('button');
      slot.type = 'button';
      const isNew = Boolean(item && !this.knownItemIds.has(item.id));
      if (isNew) this.knownItemIds.add(item.id);
      slot.className = item ? `inv-slot filled${isNew ? ' just-added' : ''}` : 'inv-slot';
      if (item) {
        slot.innerHTML = `
          <span style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:94px;">${item.shortName}</span>
          <span class="inv-slot-badge">${item.badge}</span>
        `;
        slot.title = `Inspect ${item.name}`;
        slot.addEventListener('click', () => {
          this.sound.playClick();
          if (this.onInspectInventoryItem) this.onInspectInventoryItem(item);
        });
      } else {
        slot.disabled = true;
        slot.textContent = 'Empty';
      }
      invEl.appendChild(slot);
    }

    this.hintSystem.update(snapshot);
    this.syncHudTopInset();
  }
}
