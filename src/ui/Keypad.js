export class Keypad {
  constructor({ puzzleManager, sound, onDrawerSolved, onDoorSolved, onDoorError, onWrongPassword }) {
    this.puzzleManager = puzzleManager;
    this.sound = sound;
    this.onDrawerSolved = onDrawerSolved;
    this.onDoorSolved = onDoorSolved;
    this.onDoorError = onDoorError;
    this.onWrongPassword = onWrongPassword;
    this.feedback = null;
    this.activeType = null; // 'drawer' | 'door' | null
  }

  clearFeedback() {
    this.feedback = null;
  }

  renderDrawerLock(snapshot) {
    this.activeType = 'drawer';
    const box = document.createElement('div');
    box.className = 'lock-box';

    if (snapshot.drawerUnlocked) {
      const msg = document.createElement('div');
      msg.className = 'puzzle-feedback success';
      msg.textContent = 'Drawer Unlocked. Physical note added to your inventory.';
      box.appendChild(msg);
      return box;
    }

    const title = document.createElement('div');
    title.style.fontSize = '14px';
    title.style.color = '#a8a090';
    title.textContent = '3-Digit Brass Combination Lock · Adjust each dial';
    box.appendChild(title);

    const currentDisplay = document.createElement('div');
    currentDisplay.className = 'keypad-display';
    currentDisplay.id = 'drawer-combination-display';
    currentDisplay.setAttribute('aria-live', 'polite');
    currentDisplay.textContent = snapshot.drawerDigits.join(' ');
    box.appendChild(currentDisplay);

    const dialRow = document.createElement('div');
    dialRow.className = 'dial-row';

    snapshot.drawerDigits.forEach((digit, idx) => {
      const col = document.createElement('div');
      col.className = 'dial-col';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'dial-step-btn';
      upBtn.textContent = '+';
      upBtn.setAttribute('aria-label', `Increase dial ${idx + 1}`);
      upBtn.addEventListener('click', () => {
        this.sound.playDialTick();
        this.feedback = null;
        this.puzzleManager.stepDrawerDigit(idx, 1);
      });

      const val = document.createElement('div');
      val.className = 'dial-value';
      val.dataset.dialIndex = String(idx);
      val.textContent = String(digit);

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'dial-step-btn';
      downBtn.textContent = '-';
      downBtn.setAttribute('aria-label', `Decrease dial ${idx + 1}`);
      downBtn.addEventListener('click', () => {
        this.sound.playDialTick();
        this.feedback = null;
        this.puzzleManager.stepDrawerDigit(idx, -1);
      });

      col.append(upBtn, val, downBtn);
      dialRow.appendChild(col);
    });

    box.appendChild(dialRow);

    const actionRow = document.createElement('div');
    actionRow.style.display = 'grid';
    actionRow.style.gridTemplateColumns = '1fr 1.6fr';
    actionRow.style.gap = '8px';

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.id = 'drawer-clear-btn';
    clearBtn.className = 'r13-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.feedback = null;
      this.puzzleManager.clearDrawerDigits();
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.id = 'drawer-submit-btn';
    submitBtn.className = 'r13-btn primary';
    submitBtn.textContent = 'Enter';
    submitBtn.addEventListener('click', () => {
      const res = this.puzzleManager.submitDrawerCode();
      if (res.success) {
        this.sound.playDrawerUnlock();
        this.feedback = { type: 'success', text: res.message };
        if (this.onDrawerSolved) this.onDrawerSolved(res);
      } else {
        this.sound.playError();
        this.feedback = { type: 'error', text: res.message };
        if (this.onWrongPassword && !res.gameEnded) {
          this.onWrongPassword({ type: 'drawer', result: res });
        }
      }
      this.puzzleManager.notify();
    });

    actionRow.append(clearBtn, submitBtn);
    box.appendChild(actionRow);

    if (this.feedback) {
      const fb = document.createElement('div');
      fb.className = `puzzle-feedback ${this.feedback.type}`;
      fb.textContent = this.feedback.text;
      box.appendChild(fb);
    }

    return box;
  }

  renderDoorKeypad(snapshot) {
    this.activeType = 'door';
    const box = document.createElement('div');
    box.className = 'lock-box';

    if (snapshot.doorUnlocked) {
      const msg = document.createElement('div');
      msg.className = 'puzzle-feedback success';
      msg.textContent = 'Door Unlocked! Opening corridor...';
      box.appendChild(msg);
      return box;
    }

    const label = document.createElement('div');
    label.style.fontSize = '14px';
    label.style.color = '#a8a090';
    label.textContent = '4-Digit Curfew Keypad · Enter digits (keys 0–9 supported)';
    box.appendChild(label);

    const display = document.createElement('div');
    display.className = 'keypad-display';
    display.id = 'door-keypad-display';
    const padded = snapshot.doorInput.padEnd(4, '_');
    display.textContent = padded.split('').join(' ');
    box.appendChild(display);

    const grid = document.createElement('div');
    grid.className = 'keypad-grid';

    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((d) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'keypad-key';
      btn.textContent = d;
      btn.addEventListener('click', () => {
        this.sound.playKeypadBeep(d);
        this.feedback = null;
        this.puzzleManager.pressDoorDigit(d);
      });
      grid.appendChild(btn);
    });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.id = 'door-clear-btn';
    clearBtn.className = 'keypad-key action';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.feedback = null;
      this.puzzleManager.clearDoorInput();
    });

    const zeroBtn = document.createElement('button');
    zeroBtn.type = 'button';
    zeroBtn.className = 'keypad-key';
    zeroBtn.textContent = '0';
    zeroBtn.addEventListener('click', () => {
      this.sound.playKeypadBeep('0');
      this.feedback = null;
      this.puzzleManager.pressDoorDigit('0');
    });

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.id = 'door-back-btn';
    backBtn.className = 'keypad-key action';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => {
      this.sound.playClick();
      this.feedback = null;
      this.puzzleManager.backspaceDoorDigit();
    });

    grid.append(clearBtn, zeroBtn, backBtn);
    box.appendChild(grid);

    const enterBtn = document.createElement('button');
    enterBtn.type = 'button';
    enterBtn.id = 'door-enter-btn';
    enterBtn.className = 'r13-btn primary';
    enterBtn.textContent = 'Enter';
    enterBtn.addEventListener('click', () => {
      this.submitDoor();
    });
    box.appendChild(enterBtn);

    if (this.feedback) {
      const fb = document.createElement('div');
      fb.className = `puzzle-feedback ${this.feedback.type}`;
      fb.textContent = this.feedback.text;
      box.appendChild(fb);
    }

    return box;
  }

  submitDoor() {
    const res = this.puzzleManager.submitDoorCode();
    if (res.success) {
      this.sound.playDoorUnlock();
      this.feedback = { type: 'success', text: res.message };
      if (this.onDoorSolved) this.onDoorSolved(res);
    } else {
      this.sound.playError();
      this.feedback = { type: 'error', text: res.message };
      if (this.onDoorError) this.onDoorError();
      if (this.onWrongPassword && !res.gameEnded) {
        this.onWrongPassword({ type: 'door', result: res });
      }
    }
    this.puzzleManager.notify();
  }
}
