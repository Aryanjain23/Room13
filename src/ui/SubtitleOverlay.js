export class SubtitleOverlay {
  constructor() {
    this.visible = false;
    this.el = document.createElement('div');
    this.el.id = 'subtitle-overlay';
    this.el.className = 'subtitle-overlay';
    this.el.setAttribute('role', 'region');
    this.el.setAttribute('aria-live', 'polite');
    this.el.setAttribute('aria-label', 'Live voiceover subtitles');
    this.el.hidden = true;

    this.el.innerHTML = `
      <div class="subtitle-box" id="subtitle-box">
        <div class="subtitle-speaker" id="subtitle-speaker">NARRATOR</div>
        <div class="subtitle-text" id="subtitle-text"></div>
      </div>
    `;

    this.speakerEl = this.el.querySelector('#subtitle-speaker');
    this.textEl = this.el.querySelector('#subtitle-text');
    this.hideTimer = 0;
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  setDockLayout(mode = 'room') {
    // 'room' places subtitles cleanly above the bottom HUD bar; 'cinematic' places near bottom center
    this.el.classList.toggle('cinematic-pos', mode === 'cinematic');
  }

  show(speaker = 'NARRATOR', text = '') {
    if (!text) return;
    clearTimeout(this.hideTimer);

    const normalizedSpeaker = String(speaker || 'NARRATOR').toUpperCase();
    this.speakerEl.textContent = normalizedSpeaker;
    this.speakerEl.className = `subtitle-speaker speaker-${normalizedSpeaker.toLowerCase()}`;
    this.textEl.textContent = text;

    this.el.hidden = false;
    // Force reflow so fade-in transition triggers reliably
    void this.el.offsetWidth;
    this.el.classList.add('visible');
    this.visible = true;
  }

  hide() {
    if (!this.visible && this.el.hidden) return;
    this.visible = false;
    this.el.classList.remove('visible');
    clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      if (!this.visible) {
        this.el.hidden = true;
      }
    }, 240);
  }

  clearImmediate() {
    clearTimeout(this.hideTimer);
    this.visible = false;
    this.el.classList.remove('visible');
    this.el.hidden = true;
    this.textEl.textContent = '';
  }
}
