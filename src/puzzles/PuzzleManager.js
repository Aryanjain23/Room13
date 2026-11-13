import { ClueSystem } from './ClueSystem.js';
import { DrawerPuzzle } from './DrawerPuzzle.js';
import { DoorPuzzle } from './DoorPuzzle.js';
import { getDifficultyConfig } from '../data/puzzleData.js';

export class PuzzleManager {
  constructor(inventoryManager) {
    this.inventory = inventoryManager;
    this.difficulty = 'easy';
    this.clues = new ClueSystem(this.difficulty);
    this.drawer = new DrawerPuzzle();
    this.door = new DoorPuzzle();

    // Navigation phase: 'menu' | 'difficulty' | 'intro' | 'playing' | 'caught' | 'victory'
    this.phase = 'menu';
    // Authoritative game-ending state: 'playing' | 'escaped' | 'caught'
    this.outcome = 'playing';

    // Persistent progression flags for current playthrough
    this.drawerUnlocked = false;
    this.drawerOpened = false;
    this.drawerPhysicallyOpen = false;
    this.finalNoteCollected = false;
    this.finalDoorUnlocked = false;
    this.noteCollected = false;

    this.hintsUsed = 0;
    this.maxHints = 2;
    this.configuredDurationSeconds = getDifficultyConfig(this.difficulty).defaultDurationSeconds || 600;
    this.elapsedSeconds = 0;
    this.countdownSeconds = this.configuredDurationSeconds;
    this.soundEnabled = true;
    this.wardrobeOpen = false;
    this.roommateTalkedTopics = new Set();
    this.listeners = new Set();
  }

  get gameEnded() {
    return this.outcome !== 'playing';
  }

  get escaped() {
    return this.outcome === 'escaped';
  }

  get caught() {
    return this.outcome === 'caught';
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  setDifficulty(modeId, nextPhase = null, customDurationSeconds = null) {
    const cfg = getDifficultyConfig(modeId);
    this.difficulty = cfg.id;
    this.clues.setDifficulty(this.difficulty);
    if (Number.isFinite(customDurationSeconds) && customDurationSeconds > 0) {
      this.configuredDurationSeconds = Math.max(1, Math.round(customDurationSeconds));
    } else {
      this.configuredDurationSeconds = cfg.defaultDurationSeconds || 600;
    }
    this.reset(nextPhase === 'playing');
    if (nextPhase) {
      this.phase = nextPhase;
      this.notify();
    }
  }

  setConfiguredDuration(durationSeconds) {
    if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
      this.configuredDurationSeconds = Math.max(1, Math.round(durationSeconds));
      this.countdownSeconds = this.configuredDurationSeconds;
      this.notify();
    }
  }

  reset(startPlaying = false) {
    this.clues.setDifficulty(this.difficulty);
    this.drawer.reset();
    this.door.reset();
    this.inventory.reset();

    this.outcome = 'playing';
    this.drawerUnlocked = false;
    this.drawerOpened = false;
    this.drawerPhysicallyOpen = false;
    this.finalNoteCollected = false;
    this.finalDoorUnlocked = false;
    this.noteCollected = false;

    this.hintsUsed = 0;
    this.elapsedSeconds = 0;
    this.countdownSeconds = this.configuredDurationSeconds;
    this.wardrobeOpen = false;
    this.roommateTalkedTopics.clear();
    this.phase = startPlaying ? 'playing' : 'menu';
    this.notify();
  }

  startGame() {
    this.outcome = 'playing';
    this.phase = 'playing';
    this.notify();
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = Boolean(enabled);
    this.notify();
  }

  tickSecond() {
    if (this.phase !== 'playing' || this.outcome !== 'playing') return false;
    this.elapsedSeconds += 1;
    if (this.countdownSeconds > 0) {
      this.countdownSeconds -= 1;
    }
    if (this.countdownSeconds <= 0) {
      this.triggerWardenEnding();
      return true;
    }
    this.notify();
    return false;
  }

  triggerWardenEnding() {
    // Mutually exclusive: never catch player if game already ended or escaped
    if (this.outcome !== 'playing' || this.finalDoorUnlocked) {
      return false;
    }
    this.outcome = 'caught';
    this.phase = 'caught';
    this.notify();
    return true;
  }

  inspectObject(objectId) {
    if (this.outcome !== 'playing') return null;
    const firstInspect = !this.clues.hasInspected(objectId);
    const newClue = this.clues.recordInspection(objectId);
    if (newClue) {
      this.inventory.addItem(newClue);
    }
    if (objectId === 'wardrobe' && firstInspect) {
      this.wardrobeOpen = true;
    }
    this.notify();
    return newClue;
  }

  recordRoommateTopic(topicId) {
    if (this.outcome !== 'playing') return;
    if (topicId) {
      this.roommateTalkedTopics.add(topicId);
      this.notify();
    }
  }

  toggleWardrobe() {
    if (this.outcome !== 'playing') return this.wardrobeOpen;
    this.wardrobeOpen = !this.wardrobeOpen;
    this.notify();
    return this.wardrobeOpen;
  }

  setWardrobeOpen(open) {
    this.wardrobeOpen = Boolean(open);
    this.notify();
  }

  toggleDrawerOpen() {
    if (!this.drawerUnlocked || this.outcome !== 'playing') return this.drawerPhysicallyOpen;
    this.drawerPhysicallyOpen = !this.drawerPhysicallyOpen;
    this.notify();
    return this.drawerPhysicallyOpen;
  }

  setDrawerPhysicallyOpen(open) {
    if (!this.drawerUnlocked) return;
    this.drawerPhysicallyOpen = Boolean(open);
    if (this.drawerPhysicallyOpen) {
      this.drawerOpened = true;
    }
    this.notify();
  }

  stepDrawerDigit(index, delta) {
    if (this.outcome !== 'playing' || this.drawerUnlocked) return;
    this.drawer.stepDigit(index, delta);
    this.notify();
  }

  setDrawerDigit(index, value) {
    if (this.outcome !== 'playing' || this.drawerUnlocked) return;
    this.drawer.setDigit(index, value);
    this.notify();
  }

  clearDrawerDigits() {
    if (this.outcome !== 'playing' || this.drawerUnlocked) return;
    this.drawer.clear();
    this.notify();
  }

  submitDrawerCode() {
    if (this.outcome !== 'playing') {
      return { success: false, gameEnded: true, message: 'The round has already ended.' };
    }
    if (this.drawerUnlocked) {
      return { success: true, alreadyUnlocked: true, code: this.drawer.getCode() };
    }
    const cfg = getDifficultyConfig(this.difficulty);
    const result = this.drawer.submit(cfg.answers.drawer);
    if (result.success && !result.alreadyUnlocked) {
      this.drawerUnlocked = true;
      this.drawerOpened = true;
      this.drawerPhysicallyOpen = true;
      const tornNote = this.clues.unlockTornNote();
      if (tornNote) {
        this.inventory.addItem(tornNote);
      }
      this.finalNoteCollected = true;
      this.noteCollected = true;
    }
    this.notify();
    return result;
  }

  collectDrawerNote() {
    if (!this.drawerUnlocked) return null;
    const tornNote = this.clues.unlockTornNote();
    if (tornNote) {
      this.inventory.addItem(tornNote);
    }
    this.finalNoteCollected = true;
    this.noteCollected = true;
    this.notify();
    return this.inventory.getItem('tornNote');
  }

  pressDoorDigit(digit) {
    if (this.outcome !== 'playing' || this.finalDoorUnlocked) return;
    this.door.pressDigit(digit);
    this.notify();
  }

  backspaceDoorDigit() {
    if (this.outcome !== 'playing' || this.finalDoorUnlocked) return;
    this.door.backspace();
    this.notify();
  }

  clearDoorInput() {
    if (this.outcome !== 'playing' || this.finalDoorUnlocked) return;
    this.door.clear();
    this.notify();
  }

  canUnlockExitDoor() {
    // Persistent check: only requires that the drawer was unlocked and note collected.
    // Never depends on whether drawer is physically open or whether every unrelated clue was clicked.
    return Boolean(this.drawerUnlocked && this.finalNoteCollected);
  }

  submitDoorCode() {
    if (this.outcome === 'caught') {
      return {
        success: false,
        gameEnded: true,
        message: 'Too late — the warden has already caught you.',
      };
    }
    if (this.outcome === 'escaped' || this.finalDoorUnlocked) {
      return { success: true, alreadyUnlocked: true, code: this.door.input };
    }

    const cfg = getDifficultyConfig(this.difficulty);
    const prerequisitesMet = this.canUnlockExitDoor();
    const missingMsg = !this.drawerUnlocked
      ? 'Security interlock active: unlock the desk drawer first to verify the exit protocol.'
      : 'Collect the physical note from inside the unlocked desk drawer first.';

    const result = this.door.submit(
      prerequisitesMet,
      cfg.answers.door,
      cfg.doorFailHint,
      missingMsg
    );

    if (result.success && !result.alreadyUnlocked) {
      this.finalDoorUnlocked = true;
      this.outcome = 'escaped';
      this.phase = 'victory';
    }
    this.notify();
    return result;
  }

  requestHint() {
    if (this.outcome !== 'playing') {
      return {
        available: false,
        text: 'Hints are unavailable after the round ends.',
        remaining: this.maxHints - this.hintsUsed,
      };
    }
    const cfg = getDifficultyConfig(this.difficulty);
    if (this.hintsUsed >= this.maxHints) {
      return {
        available: false,
        text: 'A third hint is unavailable. No hints remaining.',
        remaining: 0,
      };
    }
    const text = cfg.hints[this.hintsUsed];
    this.hintsUsed += 1;
    this.notify();
    return {
      available: true,
      text,
      remaining: this.maxHints - this.hintsUsed,
    };
  }

  getSolvedPuzzlesCount() {
    let solved = 0;
    if (this.clues.areAllThreeNumbersFound()) solved += 1;
    if (this.drawerUnlocked) solved += 1;
    if (this.finalDoorUnlocked) solved += 1;
    return solved;
  }

  getCurrentObjective() {
    if (this.outcome === 'caught') {
      return 'Curfew expired! The warden entered Room 13.';
    }
    if (this.outcome === 'escaped' || this.finalDoorUnlocked) {
      return 'Door unlocked! Escaping Room 13...';
    }
    if (!this.drawerUnlocked) {
      return 'Objective: Explore the room, uncover clues, and unlock the desk drawer.';
    }
    return 'Objective: Deduce the final 4-digit exit combination from your clues.';
  }

  isClueUsed(clueId) {
    if (clueId === 'tornNote') return this.finalDoorUnlocked;
    const cfg = getDifficultyConfig(this.difficulty);
    const clue = cfg.clues[clueId];
    if (!clue) return false;
    if (clue.usedStage === 'door') return this.finalDoorUnlocked;
    if (clue.usedStage === 'drawer') return this.drawerUnlocked;
    return false;
  }

  getJournalEntries() {
    return this.inventory.getItems().map((item) => ({
      id: item.id,
      name: item.name,
      source: item.source,
      content: item.content,
      discoveredValue: item.discoveredValue || item.badge,
      used: this.isClueUsed(item.id),
      item,
    }));
  }

  getSnapshot() {
    const cfg = getDifficultyConfig(this.difficulty);
    const totalCluesCount = Object.keys(cfg.clues).length;
    const drawerCluesTotal = this.clues.getDrawerClueIds().length;

    return {
      phase: this.phase,
      outcome: this.outcome,
      gameEnded: this.gameEnded,
      escaped: this.escaped,
      caught: this.caught,
      difficulty: this.difficulty,
      difficultyLabel: cfg.label,
      difficultyBadge: cfg.badge,
      defaultDurationSeconds: cfg.defaultDurationSeconds || 600,
      totalDurationSeconds: this.configuredDurationSeconds,
      elapsedSeconds: this.elapsedSeconds,
      countdownSeconds: this.countdownSeconds,
      soundEnabled: this.soundEnabled,
      hintsUsed: this.hintsUsed,
      hintsRemaining: this.maxHints - this.hintsUsed,
      numberCluesCount: this.clues.getNumberCluesCount(),
      drawerCluesTotal,
      numbersFound: this.clues.areAllThreeNumbersFound(),
      drawerDigits: [...this.drawer.digits],
      drawerUnlocked: this.drawerUnlocked,
      drawerOpened: this.drawerOpened,
      drawerPhysicallyOpen: this.drawerPhysicallyOpen,
      finalNoteCollected: this.finalNoteCollected,
      noteCollected: this.finalNoteCollected,
      doorInput: this.door.input,
      doorUnlocked: this.finalDoorUnlocked,
      finalDoorUnlocked: this.finalDoorUnlocked,
      canUnlockExit: this.canUnlockExitDoor(),
      solvedCount: this.getSolvedPuzzlesCount(),
      cluesCollectedCount: this.inventory.getItems().length,
      totalCluesCount,
      objective: this.getCurrentObjective(),
      inventory: this.inventory.getItems(),
      journalEntries: this.getJournalEntries(),
      discoveredClues: Array.from(this.clues.discovered),
      inspectedObjects: Array.from(this.clues.inspectedObjects),
      roommateTalkedTopics: Array.from(this.roommateTalkedTopics),
      wardrobeOpen: this.wardrobeOpen,
      wardrobeOpened: this.wardrobeOpen,
    };
  }
}
