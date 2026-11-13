export class SettingsModal {
  constructor({
    sound,
    narrator = null,
    puzzleManager,
    onResetView,
    onOpenHow,
    onChangeDifficulty,
    onReturnMenu,
    onPauseChange,
  }) {
    this.sound = sound;
    this.narrator = narrator;
    this.puzzleManager = puzzleManager;
    this.onResetView = onResetView;
    this.onOpenHow = onOpenHow;
    this.onChangeDifficulty = onChangeDifficulty;
    this.onReturnMenu = onReturnMenu;
    this.onPauseChange = onPauseChange;

    this.el = document.createElement('div');
    this.el.id = 'settings-modal';
    this.el.className = 'r13-modal-backdrop';
    this.el.hidden = true;

    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) {
        this.sound.playClick();
        this.close();
      }
    });
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  isOpen() {
    return !this.el.hidden;
  }

  open() {
    this.render();
    this.el.hidden = false;
    if (this.onPauseChange) this.onPauseChange(true);
  }

  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    if (this.onPauseChange) this.onPauseChange(false);
  }

  render() {
    const masterPct = Math.round((this.sound.masterVolume ?? 0.85) * 100);
    const musicPct = Math.round(this.sound.musicVolume * 100);
    const sfxPct = Math.round(this.sound.sfxVolume * 100);
    const narratorPct = Math.round((this.narrator ? this.narrator.narratorVolume : 0.9) * 100);

    const musicOn = this.sound.enabled && this.sound.musicEnabled;
    const sfxOn = this.sound.enabled && this.sound.sfxEnabled;
    const narratorOn = this.narrator ? this.narrator.narratorEnabled : false;
    const subtitlesOn = this.narrator ? this.narrator.subtitlesEnabled : false;
    const presentationOn = this.narrator ? this.narrator.presentationMode : false;

    const snap = this.puzzleManager.getSnapshot();
    const inGame = snap.phase === 'playing';

    this.el.innerHTML = `
      <div class="r13-modal-card settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="journal-head">
          <div>
            <h2 id="settings-title">${inGame ? 'Paused & Settings' : 'Audio & Settings'}</h2>
            <div class="journal-sub">${inGame ? `Room 13 · ${snap.difficultyLabel} Mode` : 'Room 13 · Curfew'}</div>
          </div>
          <button id="settings-resume-top" type="button" class="r13-icon-btn">${inGame ? 'Resume' : 'Close'}</button>
        </div>

        <div class="settings-section">
          <div class="audio-toggle-row">
            <button id="settings-narrator-toggle" type="button" class="r13-btn audio-toggle-btn${narratorOn ? ' active' : ''}" aria-pressed="${narratorOn}">
              Narrator: ${narratorOn ? 'ON' : 'OFF'}
            </button>
            <button id="settings-subtitles-toggle" type="button" class="r13-btn audio-toggle-btn${subtitlesOn ? ' active' : ''}" aria-pressed="${subtitlesOn}">
              Subtitles: ${subtitlesOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div class="audio-toggle-row">
            <button id="settings-music-toggle" type="button" class="r13-btn audio-toggle-btn${musicOn ? ' active' : ''}" aria-pressed="${musicOn}">
              Music: ${musicOn ? 'ON' : 'OFF'}
            </button>
            <button id="settings-sfx-toggle" type="button" class="r13-btn audio-toggle-btn${sfxOn ? ' active' : ''}" aria-pressed="${sfxOn}">
              Sound Effects: ${sfxOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <label class="slider-row" for="narrator-vol-slider">
            <span>Narrator Volume</span>
            <strong id="narrator-vol-val">${narratorPct}%</strong>
          </label>
          <input id="narrator-vol-slider" type="range" min="0" max="100" value="${narratorPct}" class="r13-slider" />

          <label class="slider-row" for="music-vol-slider">
            <span>Music Volume</span>
            <strong id="music-vol-val">${musicPct}%</strong>
          </label>
          <input id="music-vol-slider" type="range" min="0" max="100" value="${musicPct}" class="r13-slider" />

          <label class="slider-row" for="sfx-vol-slider">
            <span>Sound Effects Volume</span>
            <strong id="sfx-vol-val">${sfxPct}%</strong>
          </label>
          <input id="sfx-vol-slider" type="range" min="0" max="100" value="${sfxPct}" class="r13-slider" />

          <label class="slider-row" for="master-vol-slider">
            <span>Master Volume</span>
            <strong id="master-vol-val">${masterPct}%</strong>
          </label>
          <input id="master-vol-slider" type="range" min="0" max="100" value="${masterPct}" class="r13-slider" />
        </div>

        <div class="settings-section presentation-box">
          <div class="presentation-row">
            <div>
              <div style="font-weight:700;color:#ffe4b5;font-size:15px;">Presentation Mode</div>
              <div style="font-size:13px;color:#a8a090;">Clean HUD & readable clues for screen recording</div>
            </div>
            <button id="settings-presentation-toggle" type="button" class="r13-btn audio-toggle-btn${presentationOn ? ' active' : ''}" aria-pressed="${presentationOn}">
              ${presentationOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div class="settings-actions" ${inGame ? '' : 'hidden'}>
          <button id="settings-reset-view" type="button" class="r13-btn">Reset Camera View</button>
          <button id="settings-how-btn" type="button" class="r13-btn">How to Play</button>
          <button id="settings-diff-btn" type="button" class="r13-btn">Change Difficulty</button>
          <button id="settings-menu-btn" type="button" class="r13-btn">Main Menu</button>
        </div>
        <button id="settings-resume-btn" type="button" class="r13-btn primary" style="width:100%;">${inGame ? 'Resume Game' : 'Done'}</button>
      </div>
    `;

    const syncPuzzleSoundFlag = () => {
      const anyActive = (this.sound.musicEnabled || this.sound.sfxEnabled) && this.sound.masterVolume > 0;
      this.sound.setEnabled(anyActive);
      this.puzzleManager.setSoundEnabled(anyActive);
    };

    this.el.querySelector('#settings-narrator-toggle').addEventListener('click', () => {
      this.sound.init();
      this.sound.playClick();
      if (this.narrator) {
        this.narrator.setNarratorEnabled(!this.narrator.narratorEnabled);
      }
      this.render();
    });

    this.el.querySelector('#settings-subtitles-toggle').addEventListener('click', () => {
      this.sound.init();
      this.sound.playClick();
      if (this.narrator) {
        this.narrator.setSubtitlesEnabled(!this.narrator.subtitlesEnabled);
      }
      this.render();
    });

    this.el.querySelector('#settings-music-toggle').addEventListener('click', () => {
      this.sound.init();
      const next = !(this.sound.enabled && this.sound.musicEnabled);
      if (next && !this.sound.enabled) {
        this.sound.setEnabled(true);
        if (!this.sound.sfxEnabled) this.sound.setSfxEnabled(false);
      }
      this.sound.setMusicEnabled(next);
      syncPuzzleSoundFlag();
      this.sound.playClick();
      this.render();
    });

    this.el.querySelector('#settings-sfx-toggle').addEventListener('click', () => {
      this.sound.init();
      const next = !(this.sound.enabled && this.sound.sfxEnabled);
      if (next && !this.sound.enabled) {
        this.sound.setEnabled(true);
        if (!this.sound.musicEnabled) this.sound.setMusicEnabled(false);
      }
      this.sound.setSfxEnabled(next);
      syncPuzzleSoundFlag();
      if (next) this.sound.playClick();
      this.render();
    });

    const narratorSlider = this.el.querySelector('#narrator-vol-slider');
    const narratorLabel = this.el.querySelector('#narrator-vol-val');
    narratorSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      narratorLabel.textContent = `${val}%`;
      if (this.narrator) this.narrator.setNarratorVolume(val / 100);
    });

    const musicSlider = this.el.querySelector('#music-vol-slider');
    const musicLabel = this.el.querySelector('#music-vol-val');
    musicSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      musicLabel.textContent = `${val}%`;
      this.sound.init();
      this.sound.setMusicVolume(val / 100);
    });

    const sfxSlider = this.el.querySelector('#sfx-vol-slider');
    const sfxLabel = this.el.querySelector('#sfx-vol-val');
    sfxSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      sfxLabel.textContent = `${val}%`;
      this.sound.init();
      this.sound.setSfxVolume(val / 100);
    });
    sfxSlider.addEventListener('change', () => this.sound.playClick());

    const masterSlider = this.el.querySelector('#master-vol-slider');
    const masterLabel = this.el.querySelector('#master-vol-val');
    masterSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      masterLabel.textContent = `${val}%`;
      this.sound.init();
      this.sound.setMasterVolume(val / 100);
      syncPuzzleSoundFlag();
    });

    this.el.querySelector('#settings-presentation-toggle').addEventListener('click', () => {
      this.sound.init();
      this.sound.playClick();
      if (this.narrator) {
        this.narrator.setPresentationMode(!this.narrator.presentationMode);
      }
      this.render();
    });

    this.el.querySelector('#settings-reset-view').addEventListener('click', () => {
      this.sound.playClick();
      this.close();
      if (this.onResetView) this.onResetView();
    });

    this.el.querySelector('#settings-how-btn').addEventListener('click', () => {
      this.sound.playClick();
      if (this.onOpenHow) this.onOpenHow();
    });

    this.el.querySelector('#settings-diff-btn').addEventListener('click', () => {
      this.sound.playClick();
      this.el.hidden = true;
      if (this.onPauseChange) this.onPauseChange(false);
      if (this.onChangeDifficulty) this.onChangeDifficulty();
    });

    this.el.querySelector('#settings-menu-btn').addEventListener('click', () => {
      this.sound.playClick();
      this.el.hidden = true;
      if (this.onPauseChange) this.onPauseChange(false);
      if (this.onReturnMenu) this.onReturnMenu();
    });

    this.el.querySelector('#settings-resume-btn').addEventListener('click', () => {
      this.sound.playClick();
      this.close();
    });

    this.el.querySelector('#settings-resume-top').addEventListener('click', () => {
      this.sound.playClick();
      this.close();
    });
  }
}
