function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class VictoryScreen {
  constructor(onPlayAgain, onChangeDifficulty) {
    this.onPlayAgain = onPlayAgain;
    this.onChangeDifficulty = onChangeDifficulty;
    this.el = document.createElement('div');
    this.el.id = 'victory-screen';
    this.el.className = 'r13-modal-backdrop';
    this.el.hidden = true;
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  show(snapshot) {
    const finalResult =
      snapshot.hintsUsed === 0 ? 'Clean Escape (No Hints)' : 'Escaped Before Curfew';
    this.el.innerHTML = `
      <div class="r13-modal-card" role="dialog" aria-modal="true" aria-labelledby="victory-title">
        <h2 id="victory-title">YOU ESCAPED!</h2>
        <p style="margin:0;font-size:18px;color:#efe6d4;">Room 13 is finally behind you. (${snapshot.difficultyLabel || 'Easy'} Mode)</p>
        <div class="victory-stats">
          <div class="victory-stat">
            <span>Completion Time</span>
            <strong>${formatTime(snapshot.elapsedSeconds)}</strong>
          </div>
          <div class="victory-stat">
            <span>Puzzles Solved</span>
            <strong>${snapshot.solvedCount}/3</strong>
          </div>
          <div class="victory-stat">
            <span>Hints Used</span>
            <strong>${snapshot.hintsUsed}/2</strong>
          </div>
        </div>
        <div class="victory-result-row">
          <span>Final Result</span>
          <strong>${finalResult}</strong>
        </div>
        <div class="victory-actions">
          <button id="play-again-btn" type="button" class="r13-btn primary">Play Again</button>
          <button id="change-diff-btn" type="button" class="r13-btn">Change Difficulty</button>
        </div>
      </div>
    `;
    this.el.hidden = false;
    const playBtn = this.el.querySelector('#play-again-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.hide();
        if (this.onPlayAgain) this.onPlayAgain();
      });
    }
    const diffBtn = this.el.querySelector('#change-diff-btn');
    if (diffBtn) {
      diffBtn.addEventListener('click', () => {
        this.hide();
        if (this.onChangeDifficulty) this.onChangeDifficulty();
      });
    }
  }

  hide() {
    this.el.hidden = true;
  }
}
