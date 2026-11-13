export class HintSystem {
  constructor(puzzleManager, onShowToast, onSoundClick) {
    this.puzzleManager = puzzleManager;
    this.onShowToast = onShowToast;
    this.onSoundClick = onSoundClick;
  }

  mount(containerEl) {
    this.containerEl = containerEl;
    this.wrap = document.createElement('div');
    this.wrap.className = 'hint-wrap';

    this.button = document.createElement('button');
    this.button.id = 'hint-btn';
    this.button.type = 'button';
    this.button.className = 'r13-btn primary';

    // Wrapper click ensures clicking when disabled also shows the unavailable message
    this.wrap.addEventListener('click', (e) => {
      if (this.button.disabled) {
        e.preventDefault();
        this.requestHint();
      }
    });

    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.requestHint();
    });

    this.wrap.appendChild(this.button);
    this.containerEl.appendChild(this.wrap);
    this.update(this.puzzleManager.getSnapshot());
  }

  requestHint() {
    if (this.onSoundClick) this.onSoundClick();
    const res = this.puzzleManager.requestHint();
    this.onShowToast(res.text, res.available ? 6200 : 3800);
  }

  update(snapshot) {
    if (!this.button) return;
    if (snapshot.hintsRemaining > 0) {
      this.button.disabled = false;
      this.button.style.pointerEvents = 'auto';
      this.button.textContent = `Hint (${snapshot.hintsRemaining} left)`;
      this.button.setAttribute('aria-label', `Use hint (${snapshot.hintsRemaining} remaining)`);
    } else {
      this.button.disabled = true;
      this.button.style.pointerEvents = 'none';
      this.button.textContent = 'No hints remaining';
      this.button.setAttribute('aria-label', 'No hints remaining');
    }
  }
}
