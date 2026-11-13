import { getDifficultyConfig } from '../data/puzzleData.js';

export class IntroSequence {
  constructor({ sound, onComplete }) {
    this.sound = sound;
    this.onComplete = onComplete;
    this.timers = [];
    this.active = false;

    this.el = document.createElement('div');
    this.el.id = 'intro-overlay';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="intro-scrim" id="intro-scrim"></div>
      <div class="intro-content">
        <div class="intro-stamp" id="intro-stamp">BLOCK B · 10:47 PM · EASY MODE</div>
        <h2 class="intro-title" id="intro-title">ROOM 13: CURFEW</h2>
        <p class="intro-copy" id="intro-copy"></p>
      </div>
      <button id="intro-skip-btn" type="button" class="r13-icon-btn intro-skip">Skip Intro</button>
    `;

    this.el.querySelector('#intro-skip-btn').addEventListener('click', () => {
      this.sound.playClick();
      this.finish();
    });
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  clearTimers() {
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
  }

  start(difficultyId = 'easy') {
    this.clearTimers();
    this.active = true;
    const cfg = getDifficultyConfig(difficultyId);

    this.el.querySelector('#intro-stamp').textContent = `BLOCK B · 10:47 PM · ${cfg.badge} MODE`;
    this.el.querySelector('#intro-copy').textContent = cfg.introText;

    this.el.className = '';
    this.el.hidden = false;

    this.sound.playWardenFootsteps();

    this.timers.push(
      window.setTimeout(() => {
        if (!this.active) return;
        this.el.classList.add('phase-title');
      }, 500)
    );

    this.timers.push(
      window.setTimeout(() => {
        if (!this.active) return;
        this.el.classList.add('phase-room');
      }, 2100)
    );

    this.timers.push(
      window.setTimeout(() => {
        if (!this.active) return;
        this.el.classList.add('phase-brief');
      }, 2900)
    );

    this.timers.push(
      window.setTimeout(() => {
        if (!this.active) return;
        this.finish();
      }, 6500)
    );
  }

  finish() {
    if (!this.active) return;
    this.active = false;
    this.clearTimers();
    this.el.hidden = true;
    if (this.onComplete) this.onComplete();
  }
}
