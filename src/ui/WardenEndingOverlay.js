function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WARDEN_LINES = [
  {
    speaker: 'Warden',
    narratorSpeaker: 'WARDEN',
    text: "So... this is what you've been doing instead of preparing for inspection?",
  },
  {
    speaker: 'You',
    narratorSpeaker: 'PLAYER',
    text: 'Sir, I can explain!',
  },
  {
    speaker: 'Warden',
    narratorSpeaker: 'WARDEN',
    text: "Too late. Curfew is over. You're coming with me.",
  },
];

export class WardenEndingOverlay {
  constructor({ sound, narrator = null, onRetry, onMainMenu }) {
    this.sound = sound;
    this.narrator = narrator;
    this.onRetry = onRetry;
    this.onMainMenu = onMainMenu;

    this.active = false;
    this.timers = [];
    this.snapshot = null;
    this.lineIndex = -1;

    this.el = document.createElement('div');
    this.el.id = 'warden-ending-root';
    this.el.hidden = true;
    this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.el.addEventListener('pointerup', (e) => e.stopPropagation());
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  clearTimers() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
  }

  start(snapshot) {
    if (this.active) return;
    this.active = true;
    this.snapshot = snapshot;
    this.lineIndex = -1;
    this.clearTimers();

    if (this.narrator) {
      this.narrator.stopAll();
      if (this.narrator.subtitleOverlay) {
        this.narrator.subtitleOverlay.setDockLayout('cinematic');
      }
    }

    this.el.hidden = false;
    this.renderCinematicWaiting();

    // Sync dialogue beats with door handle turn (0.0-0.8s), door swing + warden entry (0.8-2.3s), notice player (2.4s+)
    this.timers.push(window.setTimeout(() => this.showDialogueStep(0), 2300));
    this.timers.push(window.setTimeout(() => this.showDialogueStep(1), 5800));
    this.timers.push(window.setTimeout(() => this.showDialogueStep(2), 8400));
    this.timers.push(window.setTimeout(() => this.showGameOver(), 11600));
  }

  renderCinematicWaiting() {
    this.el.innerHTML = `
      <div class="warden-dialogue-banner compact-top" role="status" aria-live="polite">
        <div class="warden-speaker">CURFEW EXPIRED</div>
        <div class="warden-line">Footsteps stop outside Room 13... the brass handle turns.</div>
      </div>
    `;
  }

  showDialogueStep(idx) {
    if (!this.active || idx <= this.lineIndex) return;
    this.lineIndex = idx;
    const entry = WARDEN_LINES[idx];
    if (!entry) {
      this.showGameOver();
      return;
    }

    if (this.narrator) {
      this.narrator.narrateWardenLine(entry.narratorSpeaker, entry.text);
    }

    const subtitlesShowing = Boolean(this.narrator && this.narrator.subtitlesEnabled);

    if (subtitlesShowing) {
      // Single unified subtitle box is rendered by SubtitleOverlay — keep only a sleek non-overlapping control bar
      this.el.innerHTML = `
        <div class="warden-dialogue-banner compact-top" role="dialog" aria-live="off">
          <div class="warden-dialogue-top">
            <span class="warden-speaker ${entry.speaker === 'Warden' ? 'warden-tag' : 'player-tag'}">
              WARDEN INSPECTION · ${entry.speaker} Speaking
            </span>
            <button id="warden-next-btn" type="button" class="r13-icon-btn">
              ${idx < WARDEN_LINES.length - 1 ? 'Next' : 'Continue'}
            </button>
          </div>
        </div>
      `;
    } else {
      this.el.innerHTML = `
        <div class="warden-dialogue-banner" role="dialog" aria-live="polite">
          <div class="warden-dialogue-top">
            <span class="warden-speaker ${entry.speaker === 'Warden' ? 'warden-tag' : 'player-tag'}">${entry.speaker}</span>
            <button id="warden-next-btn" type="button" class="r13-icon-btn">
              ${idx < WARDEN_LINES.length - 1 ? 'Next' : 'Continue'}
            </button>
          </div>
          <div class="warden-line">"${entry.text}"</div>
        </div>
      `;
    }

    const nextBtn = this.el.querySelector('#warden-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.sound) this.sound.playClick();
        this.clearTimers();
        if (idx + 1 < WARDEN_LINES.length) {
          this.showDialogueStep(idx + 1);
          this.timers.push(
            window.setTimeout(() => {
              if (idx + 1 === WARDEN_LINES.length - 1) {
                this.showGameOver();
              } else {
                this.showDialogueStep(idx + 2);
              }
            }, 3000)
          );
        } else {
          this.showGameOver();
        }
      });
    }
  }

  showGameOver() {
    if (!this.active) return;
    this.clearTimers();
    if (this.narrator && this.narrator.subtitleOverlay) {
      this.narrator.subtitleOverlay.setDockLayout('room');
    }
    if (this.sound) {
      this.sound.playWardenFailureCue();
    }
    if (this.narrator) {
      this.narrator.narrateWardenCaught();
    }
    const snap = this.snapshot || {};

    this.el.innerHTML = `
      <div class="r13-modal-backdrop">
        <div class="r13-modal-card warden-gameover-card" role="dialog" aria-modal="true" aria-labelledby="warden-gameover-title">
          <div class="warden-over-kicker">GAME OVER</div>
          <h2 id="warden-gameover-title" class="warden-over-title">CAUGHT BY THE WARDEN</h2>
          <p class="warden-over-sub">You ran out of time before escaping Room 13.</p>

          <div class="warden-stats">
            <div class="victory-stat">
              <span>Difficulty</span>
              <strong>${snap.difficultyLabel || 'Easy'}</strong>
            </div>
            <div class="victory-stat">
              <span>Time Survived</span>
              <strong>${formatTime(snap.elapsedSeconds ?? 0)}</strong>
            </div>
            <div class="victory-stat">
              <span>Clues Found</span>
              <strong>${snap.cluesCollectedCount || 0}/${snap.totalCluesCount || 5}</strong>
            </div>
            <div class="victory-stat">
              <span>Hints Used</span>
              <strong>${snap.hintsUsed || 0}/2</strong>
            </div>
          </div>

          <div class="victory-actions">
            <button id="warden-retry-btn" type="button" class="r13-btn primary">Retry</button>
            <button id="warden-menu-btn" type="button" class="r13-btn">Main Menu</button>
          </div>
        </div>
      </div>
    `;

    this.el.querySelector('#warden-retry-btn').addEventListener('click', () => {
      if (this.sound) this.sound.playClick();
      this.hide();
      if (this.onRetry) this.onRetry();
    });

    this.el.querySelector('#warden-menu-btn').addEventListener('click', () => {
      if (this.sound) this.sound.playClick();
      this.hide();
      if (this.onMainMenu) this.onMainMenu();
    });
  }

  hide() {
    this.clearTimers();
    this.active = false;
    this.lineIndex = -1;
    this.snapshot = null;
    this.el.hidden = true;
    this.el.innerHTML = '';
    if (this.narrator && this.narrator.subtitleOverlay) {
      this.narrator.subtitleOverlay.setDockLayout('room');
    }
  }
}
