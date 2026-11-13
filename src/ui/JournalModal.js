export class JournalModal {
  constructor({ sound, onInspectEntry, onClose }) {
    this.sound = sound;
    this.onInspectEntry = onInspectEntry;
    this.onClose = onClose;

    this.el = document.createElement('div');
    this.el.id = 'journal-modal';
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

  open(snapshot) {
    this.render(snapshot);
    this.el.hidden = false;
  }

  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    if (this.onClose) this.onClose();
  }

  render(snapshot) {
    const entries = snapshot.journalEntries || [];
    const total = snapshot.totalCluesCount || 5;
    const undiscoveredCount = Math.max(0, total - entries.length);

    this.el.innerHTML = `
      <div class="r13-modal-card journal-card" role="dialog" aria-modal="true" aria-labelledby="journal-title">
        <div class="journal-head">
          <div>
            <h2 id="journal-title">Clue Journal</h2>
            <div class="journal-sub">${snapshot.difficultyLabel || 'Easy'} Mode · Discovered Clues: ${entries.length} of ${total}</div>
          </div>
          <button id="journal-close-btn" type="button" class="r13-icon-btn">Close</button>
        </div>

        <div class="journal-list" id="journal-list-slot"></div>
      </div>
    `;

    const listEl = this.el.querySelector('#journal-list-slot');

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'journal-empty';
      empty.textContent =
        'No clues recorded yet. Inspect ordinary objects around Room 13 or talk with your roommate.';
      listEl.appendChild(empty);
    } else {
      entries.forEach((entry) => {
        const card = document.createElement('div');
        card.className = `journal-entry ${entry.used ? 'used' : 'active'}`;
        card.innerHTML = `
          <div class="journal-entry-top">
            <span class="journal-source">${entry.source}</span>
            <span class="journal-status ${entry.used ? 'used' : 'unused'}">
              ${entry.used ? 'Used' : 'Unused'}
            </span>
          </div>
          <div class="journal-value">Observed Detail: <strong>${entry.discoveredValue}</strong></div>
          <p class="journal-text"></p>
        `;
        card.querySelector('.journal-text').textContent = entry.content;

        if (this.onInspectEntry && entry.item) {
          card.style.cursor = 'pointer';
          card.title = `Inspect ${entry.name}`;
          card.addEventListener('click', () => {
            this.sound.playClick();
            this.close();
            this.onInspectEntry(entry.item);
          });
        }
        listEl.appendChild(card);
      });
    }

    for (let i = 0; i < undiscoveredCount; i += 1) {
      const lockedSlot = document.createElement('div');
      lockedSlot.className = 'journal-entry locked';
      lockedSlot.innerHTML = `
        <div class="journal-entry-top">
          <span class="journal-source">Undiscovered Clue</span>
          <span class="journal-status locked">Unexplored</span>
        </div>
        <div class="journal-locked-note">Continue exploring Room 13 to uncover this clue.</div>
      `;
      listEl.appendChild(lockedSlot);
    }

    const closeBtn = this.el.querySelector('#journal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.close();
      });
    }
  }
}
