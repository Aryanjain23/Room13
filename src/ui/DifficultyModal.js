import { DIFFICULTY_MODES, TIMER_PRESET_MINUTES, getDifficultyConfig } from '../data/puzzleData.js';

function formatTimerPreview(seconds) {
  const safe = Math.max(1, Math.round(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class DifficultyModal {
  constructor({ sound, onSelect, onBack }) {
    this.sound = sound;
    this.onSelect = onSelect;
    this.onBack = onBack;

    this.selectedDifficulty = 'easy';
    this.timerMode = 'default'; // 'default' | 'preset' | 'custom'
    this.presetMinutes = 1;
    this.customMinutesValue = '1';
    this.errorMsg = '';

    this.el = document.createElement('div');
    this.el.id = 'difficulty-modal';
    this.el.className = 'r13-modal-backdrop';
    this.el.hidden = true;
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  isOpen() {
    return !this.el.hidden;
  }

  open(initialDifficulty = 'easy') {
    this.selectedDifficulty = DIFFICULTY_MODES[initialDifficulty] ? initialDifficulty : 'easy';
    this.timerMode = 'default';
    this.errorMsg = '';
    this.render();
    this.el.hidden = false;
  }

  close() {
    this.el.hidden = true;
  }

  getResolvedDurationSeconds() {
    const cfg = getDifficultyConfig(this.selectedDifficulty);
    if (this.timerMode === 'default') {
      return cfg.defaultDurationSeconds || 600;
    }
    if (this.timerMode === 'preset') {
      return Math.round(this.presetMinutes * 60);
    }
    const parsed = Number(this.customMinutesValue);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 120) {
      return null;
    }
    return Math.round(parsed * 60);
  }

  render() {
    const modes = ['easy', 'moderate', 'hard'].map((id) => DIFFICULTY_MODES[id]);
    const activeCfg = getDifficultyConfig(this.selectedDifficulty);
    const defaultMin = Math.round((activeCfg.defaultDurationSeconds || 600) / 60);
    const resolvedSec = this.getResolvedDurationSeconds();

    this.el.innerHTML = `
      <div class="r13-modal-card difficulty-card" role="dialog" aria-modal="true" aria-labelledby="diff-title">
        <div class="journal-head">
          <div>
            <h2 id="diff-title">Game Setup</h2>
            <div class="journal-sub">Choose difficulty mode and curfew countdown timer</div>
          </div>
          <button id="diff-back-btn" type="button" class="r13-icon-btn">Back</button>
        </div>

        <div class="difficulty-grid" id="diff-grid-slot"></div>

        <div class="timer-setup-box">
          <div class="timer-setup-head">
            <span class="timer-setup-title">Countdown Timer</span>
            <span id="timer-preview-pill" class="timer-preview-badge">
              Starts at ${resolvedSec ? formatTimerPreview(resolvedSec) : '--:--'}
            </span>
          </div>

          <div class="timer-preset-grid" id="timer-preset-slot">
            <button type="button" class="timer-chip${this.timerMode === 'default' ? ' active' : ''}" data-timer="default">
              Default (${defaultMin}m)
            </button>
            ${TIMER_PRESET_MINUTES.map(
              (m) => `
              <button type="button" class="timer-chip${
                this.timerMode === 'preset' && this.presetMinutes === m ? ' active' : ''
              }" data-timer="preset" data-minutes="${m}">
                ${m} min
              </button>
            `
            ).join('')}
            <button type="button" class="timer-chip${this.timerMode === 'custom' ? ' active' : ''}" data-timer="custom">
              Custom
            </button>
          </div>

          <div class="timer-custom-row">
            <label for="custom-timer-input">Custom duration (minutes):</label>
            <div class="timer-custom-input-wrap">
              <input
                id="custom-timer-input"
                type="number"
                min="1"
                max="120"
                step="any"
                inputmode="decimal"
                value="${this.customMinutesValue}"
                aria-label="Custom countdown duration in minutes"
              />
              <span>min</span>
            </div>
          </div>
          ${this.errorMsg ? `<div class="puzzle-feedback error" id="timer-error-msg">${this.errorMsg}</div>` : ''}
        </div>

        <button id="diff-start-btn" type="button" class="r13-btn primary" style="width:100%;">
          Start ${activeCfg.label} Mode (${resolvedSec ? formatTimerPreview(resolvedSec) : '01:00'})
        </button>
      </div>
    `;

    const grid = this.el.querySelector('#diff-grid-slot');
    modes.forEach((mode) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = mode.id === this.selectedDifficulty;
      const modeDefaultMin = Math.round((mode.defaultDurationSeconds || 600) / 60);
      btn.className = `difficulty-option${isSelected ? ' selected' : ''}`;
      btn.dataset.difficulty = mode.id;
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.innerHTML = `
        <div class="difficulty-option-top">
          <strong>${mode.label}</strong>
          <span>${Object.keys(mode.clues).length} Clues · 2 Hints · ${modeDefaultMin} min default</span>
        </div>
        <div class="difficulty-option-desc">${mode.summary}</div>
      `;
      btn.addEventListener('click', () => {
        this.sound.playClick();
        if (this.selectedDifficulty !== mode.id) {
          this.selectedDifficulty = mode.id;
          // Changing difficulty resets to that difficulty's default timer
          this.timerMode = 'default';
          this.errorMsg = '';
        }
        this.render();
      });
      grid.appendChild(btn);
    });

    const presetButtons = this.el.querySelectorAll('.timer-chip');
    presetButtons.forEach((chip) => {
      chip.addEventListener('click', () => {
        this.sound.playClick();
        const kind = chip.dataset.timer;
        this.errorMsg = '';
        if (kind === 'default') {
          this.timerMode = 'default';
        } else if (kind === 'preset') {
          this.timerMode = 'preset';
          this.presetMinutes = Number(chip.dataset.minutes) || 1;
        } else {
          this.timerMode = 'custom';
        }
        this.render();
        if (kind === 'custom') {
          const input = this.el.querySelector('#custom-timer-input');
          if (input) {
            input.focus();
            input.select();
          }
        }
      });
    });

    const customInput = this.el.querySelector('#custom-timer-input');
    const syncCustomLive = () => {
      this.timerMode = 'custom';
      this.customMinutesValue = customInput.value;
      this.errorMsg = '';
      const sec = this.getResolvedDurationSeconds();
      const previewEl = this.el.querySelector('#timer-preview-pill');
      const startBtn = this.el.querySelector('#diff-start-btn');
      const customChip = this.el.querySelector('.timer-chip[data-timer="custom"]');

      this.el.querySelectorAll('.timer-chip').forEach((c) => c.classList.remove('active'));
      if (customChip) customChip.classList.add('active');

      if (previewEl) {
        previewEl.textContent = sec ? `Starts at ${formatTimerPreview(sec)}` : 'Enter 1–120 min';
      }
      if (startBtn) {
        startBtn.textContent = sec
          ? `Start ${activeCfg.label} Mode (${formatTimerPreview(sec)})`
          : `Start ${activeCfg.label} Mode`;
      }
    };

    customInput.addEventListener('focus', syncCustomLive);
    customInput.addEventListener('input', syncCustomLive);

    this.el.querySelector('#diff-start-btn').addEventListener('click', () => {
      this.sound.init();
      this.sound.playClick();
      const durationSeconds = this.getResolvedDurationSeconds();
      if (!durationSeconds || durationSeconds < 10) {
        this.errorMsg = 'Enter a valid duration between 1 and 120 minutes.';
        this.render();
        return;
      }
      this.close();
      if (this.onSelect) this.onSelect(this.selectedDifficulty, durationSeconds);
    });

    this.el.querySelector('#diff-back-btn').addEventListener('click', () => {
      this.sound.playClick();
      this.close();
      if (this.onBack) this.onBack();
    });
  }
}
