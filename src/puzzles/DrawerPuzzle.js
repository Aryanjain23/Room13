export class DrawerPuzzle {
  constructor() {
    this.digits = [0, 0, 0];
    this.unlocked = false;
    this.attempts = 0;
  }

  reset() {
    this.digits = [0, 0, 0];
    this.unlocked = false;
    this.attempts = 0;
  }

  setDigit(index, value) {
    if (index < 0 || index > 2 || this.unlocked) return;
    const normalized = ((value % 10) + 10) % 10;
    this.digits[index] = normalized;
  }

  stepDigit(index, delta) {
    if (index < 0 || index > 2 || this.unlocked) return;
    this.setDigit(index, this.digits[index] + delta);
  }

  clear() {
    if (this.unlocked) return;
    this.digits = [0, 0, 0];
  }

  getCode() {
    return this.digits.join('');
  }

  submit(expectedCode = '427') {
    if (this.unlocked) {
      return { success: true, alreadyUnlocked: true, code: this.getCode() };
    }
    this.attempts += 1;
    const entered = this.getCode();
    if (entered === expectedCode) {
      this.unlocked = true;
      return {
        success: true,
        alreadyUnlocked: false,
        code: entered,
        message: 'Drawer unlocked! A torn physical note lies inside.',
      };
    }
    return {
      success: false,
      code: entered,
      message: 'Incorrect combination. Examine your clues again.',
    };
  }
}
