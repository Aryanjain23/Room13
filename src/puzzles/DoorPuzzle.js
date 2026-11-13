export class DoorPuzzle {
  constructor() {
    this.input = '';
    this.unlocked = false;
    this.attempts = 0;
  }

  reset() {
    this.input = '';
    this.unlocked = false;
    this.attempts = 0;
  }

  pressDigit(digit) {
    if (this.unlocked) return this.input;
    if (this.input.length < 4 && /^[0-9]$/.test(String(digit))) {
      this.input += String(digit);
    }
    return this.input;
  }

  backspace() {
    if (this.unlocked) return this.input;
    this.input = this.input.slice(0, -1);
    return this.input;
  }

  clear() {
    if (this.unlocked) return this.input;
    this.input = '';
    return this.input;
  }

  submit(
    prerequisitesMet = true,
    expectedCode = '1310',
    failHint = 'Access denied. Examine your clues again.',
    missingPrereqMessage = 'Security interlock active: unlock the desk drawer first to verify the exit protocol.'
  ) {
    if (this.unlocked) {
      return { success: true, alreadyUnlocked: true, code: this.input };
    }

    if (this.input.length < 4) {
      return {
        success: false,
        incomplete: true,
        code: this.input,
        message: 'Enter all 4 digits on the keypad.',
      };
    }

    this.attempts += 1;

    if (this.input !== expectedCode) {
      return {
        success: false,
        code: this.input,
        message: `${failHint} (${this.input})`,
      };
    }

    if (!prerequisitesMet) {
      return {
        success: false,
        lockedByProgress: true,
        code: this.input,
        message: missingPrereqMessage,
      };
    }

    this.unlocked = true;
    return {
      success: true,
      alreadyUnlocked: false,
      code: this.input,
      message: 'Code accepted! Deadbolt disengaged.',
    };
  }
}
