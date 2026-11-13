import { ROOMMATE_PROFILE, ROOMMATE_DIALOGUE } from '../data/roommateData.js';

export class RoommateDialog {
  constructor({ puzzleManager, sound, onClose }) {
    this.puzzleManager = puzzleManager;
    this.sound = sound;
    this.onClose = onClose;

    this.currentLine = '';
    this.activeTopicId = null;

    this.el = document.createElement('aside');
    this.el.id = 'roommate-dialog';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-modal', 'false');
    this.el.setAttribute('aria-labelledby', 'roommate-name');
    this.el.hidden = true;
    this.el.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.el.addEventListener('pointerup', (e) => e.stopPropagation());
  }

  mount(parentEl) {
    parentEl.appendChild(this.el);
  }

  isOpen() {
    return !this.el.hidden;
  }

  open(snapshot) {
    const dlg = ROOMMATE_DIALOGUE[snapshot.difficulty] || ROOMMATE_DIALOGUE.easy;
    this.activeTopicId = null;
    this.currentLine = dlg.greeting;
    this.render(snapshot);
    this.el.hidden = false;
  }

  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.activeTopicId = null;
    if (this.onClose) this.onClose();
  }

  render(snapshot) {
    const dlg = ROOMMATE_DIALOGUE[snapshot.difficulty] || ROOMMATE_DIALOGUE.easy;
    const talked = new Set(snapshot.roommateTalkedTopics || []);

    this.el.innerHTML = `
      <div class="inspect-head">
        <div>
          <h3 class="inspect-title" id="roommate-name">${ROOMMATE_PROFILE.name}</h3>
          <div class="inspect-sub">${ROOMMATE_PROFILE.subtitle} · ${snapshot.difficultyLabel} Mode</div>
        </div>
        <button id="roommate-close-btn" type="button" class="r13-icon-btn">Return to Room</button>
      </div>

      <div class="roommate-speech" id="roommate-speech-box"></div>

      <div class="roommate-topics-label">Ask Rohan:</div>
      <div class="roommate-topics" id="roommate-topics-slot"></div>
    `;

    this.el.querySelector('#roommate-speech-box').textContent = `"${this.currentLine}"`;

    const topicsEl = this.el.querySelector('#roommate-topics-slot');
    dlg.topics.forEach((topic) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = this.activeTopicId === topic.id;
      const seen = talked.has(topic.id);
      btn.className = `roommate-topic-btn${isActive ? ' active' : ''}${seen ? ' seen' : ''}`;
      btn.textContent = topic.label;
      btn.addEventListener('click', () => {
        this.sound.playClick();
        this.activeTopicId = topic.id;
        this.currentLine = topic.line;
        this.puzzleManager.recordRoommateTopic(topic.id);
      });
      topicsEl.appendChild(btn);
    });

    this.el.querySelector('#roommate-close-btn').addEventListener('click', () => {
      this.sound.playClick();
      this.close();
    });
  }
}
