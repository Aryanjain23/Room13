const SPEAKER_VOICE_PROFILE = {
  NARRATOR: { rate: 0.94, pitch: 0.94 },
  ROOMMATE: { rate: 0.99, pitch: 1.03 },
  WARDEN: { rate: 0.9, pitch: 0.82 },
  PLAYER: { rate: 1.02, pitch: 1.0 },
};

export const NARRATOR_SCRIPTS = {
  gameStart:
    "Welcome to Room 13: Curfew. You're trapped inside a hostel room, and the warden is expected to arrive soon. Explore your surroundings, uncover hidden clues and find a way to escape before time runs out.",
  difficulty: {
    easy: 'Easy mode selected. Clues around Room 13 point directly to the lock numbers, and your roommate Rohan offers clear guidance.',
    moderate:
      'Moderate mode selected. Clues are spread across different corners of the room, requiring you to connect the clock, wardrobe, and notices.',
    hard: 'Hard mode selected. No single object holds a complete code. You must combine details from multiple clues using arithmetic.',
  },
  objects: {
    clock: 'An old wall clock. Take a closer look. Its time may be more important than it appears.',
    notice: 'A hostel notice board. Pay attention to the information posted here.',
    bed: 'There may be something hidden around or underneath the bed.',
    notebook: 'This notebook might contain instructions that help you connect the clues.',
    drawerLocked: "A locked drawer. You'll need to discover its combination.",
    drawerUnlocked: 'The desk drawer is already unlocked.',
    doorLocked: 'The exit is locked. Find the clues that reveal its access code.',
    doorUnlocked: 'The exit door is unlocked.',
    table:
      'A wooden hostel study table with stacked textbooks, an open notebook, and a locked brass drawer.',
    wardrobeClosed: 'A tall wooden wardrobe with doors slightly ajar. Open it to check inside.',
    wardrobeOpen: 'The wardrobe doors are open, revealing folded sweaters and the upper shelf.',
    window:
      "A barred courtyard window overlooking the dark hostel block. There's no way out through here.",
    mug: 'A steel mug of lukewarm chai left on the study table. Nothing hidden here.',
    switchboard: 'An ordinary hostel wall switchboard beside the door.',
  },
  journalOpened:
    "Your clue journal keeps track of everything you've discovered. Review your clues and look for connections.",
  noHintsLeft: "You've used both available hints. There are no more official hints remaining.",
  wrongPassword: 'That combination is incorrect. Re-examine the clues and try again.',
  drawerUnlocked:
    "Success! The drawer is unlocked. There's something inside that may help you escape.",
  finalNoteCollected:
    'The note reveals another part of the mystery. Combine its information with the clues around the room.',
  doorUnlocked: "The combination is correct! The exit is unlocked. You've found your way out.",
  victory: 'You escaped Room 13! You solved the clues and made it out before the warden arrived.',
  timer60: 'One minute remains. The warden could arrive at any moment.',
  timer20: 'Time is running out. You need to find the exit code.',
  timer10: 'Ten seconds! Hurry! The warden is almost here!',
  wardenCaughtNarration: 'You were caught before escaping Room 13.',
};

export class NarratorManager {
  constructor({ subtitleOverlay, sound }) {
    this.subtitleOverlay = subtitleOverlay;
    this.sound = sound;

    this.narratorEnabled = true;
    this.subtitlesEnabled = true;
    this.narratorVolume = 0.9;
    this.paused = false;

    this.queue = [];
    this.currentItem = null;
    this.fallbackTimer = 0;
    this.recentKeys = new Map();
    this.selectedVoice = null;
    this.listeners = new Set();

    this.hasSpeechApi =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance === 'function';

    if (this.hasSpeechApi) {
      this.pickPreferredVoice();
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', () => this.pickPreferredVoice());
      } else {
        window.speechSynthesis.onvoiceschanged = () => this.pickPreferredVoice();
      }
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => fn(state));
  }

  getState() {
    return {
      narratorEnabled: this.narratorEnabled,
      subtitlesEnabled: this.subtitlesEnabled,
      narratorVolume: this.narratorVolume,
      speechSupported: this.hasSpeechApi,
      speaking: Boolean(this.currentItem),
      queueLength: this.queue.length,
    };
  }

  pickPreferredVoice() {
    if (!this.hasSpeechApi) return null;
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (!voices.length) return null;
      const englishVoices = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
      const pool = englishVoices.length ? englishVoices : voices;

      // Prefer natural/neural/enhanced English voices over robotic defaults
      const preferredPatterns = [
        /natural/i,
        /neural/i,
        /google us english/i,
        /google uk english male/i,
        /google uk english/i,
        /daniel/i,
        /samantha/i,
        /alex/i,
        /aria/i,
        /guy/i,
        /libby/i,
        /ryan/i,
        /en-GB|en-US/i,
      ];
      for (const rx of preferredPatterns) {
        const match = pool.find((v) => rx.test(v.name) || rx.test(v.lang));
        if (match) {
          this.selectedVoice = match;
          return match;
        }
      }
      this.selectedVoice = pool.find((v) => v.default) || pool[0];
      return this.selectedVoice;
    } catch {
      return null;
    }
  }

  setNarratorEnabled(enabled) {
    this.narratorEnabled = Boolean(enabled);
    if (!this.narratorEnabled && this.hasSpeechApi) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancellation errors
      }
    }
    this.notify();
  }

  setSubtitlesEnabled(enabled) {
    this.subtitlesEnabled = Boolean(enabled);
    if (!this.subtitlesEnabled && this.subtitleOverlay) {
      this.subtitleOverlay.clearImmediate();
    } else if (this.subtitlesEnabled && this.currentItem && this.subtitleOverlay) {
      this.subtitleOverlay.show(this.currentItem.speaker, this.currentItem.text);
    }
    this.notify();
  }

  setNarratorVolume(val) {
    this.narratorVolume = Math.max(0, Math.min(1, Number(val)));
    this.notify();
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (this.hasSpeechApi) {
      try {
        if (this.paused) {
          window.speechSynthesis.pause();
        } else {
          window.speechSynthesis.resume();
        }
      } catch {
        // Ignore pause/resume errors in browsers without support
      }
    }
  }

  estimateDurationMs(text) {
    return Math.max(2500, Math.min(9000, text.length * 64 + 1250));
  }

  speak({ speaker = 'NARRATOR', text, interrupt = false, clearQueue = false, deduplicateKey = null, deduplicateMs = 3500 }) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return;

    // Avoid repeating identical narration if clicked rapidly
    if (deduplicateKey) {
      const now = Date.now();
      const prev = this.recentKeys.get(deduplicateKey);
      if (prev && now - prev < deduplicateMs) {
        return;
      }
      this.recentKeys.set(deduplicateKey, now);
    }

    const item = {
      speaker: String(speaker || 'NARRATOR').toUpperCase(),
      text: cleanText,
    };

    if (clearQueue) {
      this.queue = [];
    }

    if (interrupt && this.currentItem) {
      this.cancelCurrentPlaybackOnly();
    }

    // Also skip duplicate tail item already waiting in queue
    const lastQueued = this.queue[this.queue.length - 1];
    if (lastQueued && lastQueued.text === item.text && lastQueued.speaker === item.speaker) {
      return;
    }

    this.queue.push(item);
    if (!this.currentItem) {
      this.playNext();
    }
  }

  cancelCurrentPlaybackOnly() {
    clearTimeout(this.fallbackTimer);
    this.fallbackTimer = 0;
    this.currentItem = null;
    if (this.hasSpeechApi) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  playNext() {
    clearTimeout(this.fallbackTimer);
    this.fallbackTimer = 0;

    if (this.queue.length === 0) {
      this.currentItem = null;
      if (this.subtitleOverlay) {
        this.subtitleOverlay.hide();
      }
      this.notify();
      return;
    }

    const next = this.queue.shift();
    this.currentItem = next;
    this.notify();

    // Show subtitle independently whenever subtitles are ON
    if (this.subtitlesEnabled && this.subtitleOverlay) {
      this.subtitleOverlay.show(next.speaker, next.text);
    } else if (this.subtitleOverlay) {
      this.subtitleOverlay.clearImmediate();
    }

    const fallbackMs = this.estimateDurationMs(next.text);
    const masterEnabled = this.sound ? this.sound.enabled : true;
    const masterVol = this.sound ? this.sound.masterVolume : 1;
    const effectiveVol = masterEnabled ? Math.max(0, Math.min(1, this.narratorVolume * masterVol)) : 0;

    const finishItem = () => {
      if (this.currentItem !== next) return;
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = 0;
      this.currentItem = null;
      this.playNext();
    };

    if (this.hasSpeechApi && this.narratorEnabled && effectiveVol > 0.01) {
      try {
        const utterance = new window.SpeechSynthesisUtterance(next.text);
        if (!this.selectedVoice) this.pickPreferredVoice();
        if (this.selectedVoice) utterance.voice = this.selectedVoice;
        utterance.lang = (this.selectedVoice && this.selectedVoice.lang) || 'en-US';

        const profile = SPEAKER_VOICE_PROFILE[next.speaker] || SPEAKER_VOICE_PROFILE.NARRATOR;
        utterance.rate = profile.rate;
        utterance.pitch = profile.pitch;
        utterance.volume = effectiveVol;

        let settled = false;
        const onSettled = () => {
          if (settled) return;
          settled = true;
          // Slight natural breath pause between queued lines
          window.setTimeout(finishItem, 180);
        };

        utterance.onend = onSettled;
        utterance.onerror = onSettled;

        // Safety watchdog in case a browser speech engine drops onend
        this.fallbackTimer = window.setTimeout(onSettled, fallbackMs + 3500);
        window.speechSynthesis.speak(utterance);
        return;
      } catch {
        // Fall back to timed subtitle display below
      }
    }

    // Fallback (speechSynthesis unavailable, narrator muted, or subtitles-only mode)
    this.fallbackTimer = window.setTimeout(finishItem, fallbackMs);
  }

  stopAll() {
    this.queue = [];
    this.recentKeys.clear();
    this.cancelCurrentPlaybackOnly();
    if (this.subtitleOverlay) {
      this.subtitleOverlay.clearImmediate();
    }
    this.notify();
  }

  // Convenience event methods tied directly to real game state
  narrateGameStart() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.gameStart,
      interrupt: true,
      clearQueue: true,
    });
  }

  narrateDifficulty(difficultyId) {
    const line = NARRATOR_SCRIPTS.difficulty[difficultyId] || NARRATOR_SCRIPTS.difficulty.easy;
    this.speak({
      speaker: 'NARRATOR',
      text: line,
      interrupt: true,
      clearQueue: true,
    });
  }

  narrateObjectInspection(objectId, snapshot) {
    let text = null;
    if (objectId === 'drawer') {
      text = snapshot?.drawerUnlocked
        ? NARRATOR_SCRIPTS.objects.drawerUnlocked
        : NARRATOR_SCRIPTS.objects.drawerLocked;
    } else if (objectId === 'door') {
      text = snapshot?.doorUnlocked
        ? NARRATOR_SCRIPTS.objects.doorUnlocked
        : NARRATOR_SCRIPTS.objects.doorLocked;
    } else if (objectId === 'wardrobe') {
      text = snapshot?.wardrobeOpen
        ? NARRATOR_SCRIPTS.objects.wardrobeOpen
        : NARRATOR_SCRIPTS.objects.wardrobeClosed;
    } else {
      text = NARRATOR_SCRIPTS.objects[objectId] || null;
    }
    if (!text) return;

    this.speak({
      speaker: 'NARRATOR',
      text,
      deduplicateKey: `obj:${objectId}:${snapshot?.drawerUnlocked ? 1 : 0}:${snapshot?.doorUnlocked ? 1 : 0}`,
      deduplicateMs: 4000,
    });
  }

  narrateClueDiscovered(clueItem) {
    if (!clueItem) return;
    this.speak({
      speaker: 'NARRATOR',
      text: `You've discovered a clue: ${clueItem.name}. Make sure to check your journal. Every detail could be important.`,
      deduplicateKey: `clue:${clueItem.id}`,
      deduplicateMs: 10000,
    });
  }

  narrateJournalOpened() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.journalOpened,
      deduplicateKey: 'journal_opened',
      deduplicateMs: 6000,
    });
  }

  narrateHint(hintResult) {
    if (!hintResult) return;
    if (hintResult.available) {
      this.speak({
        speaker: 'NARRATOR',
        text: `Here's a hint: ${hintResult.text}`,
        interrupt: true,
        clearQueue: true,
      });
    } else {
      this.speak({
        speaker: 'NARRATOR',
        text: NARRATOR_SCRIPTS.noHintsLeft,
        interrupt: true,
        clearQueue: true,
      });
    }
  }

  narrateRoommateLine(line, topicId = 'greeting') {
    if (!line) return;
    this.speak({
      speaker: 'ROOMMATE',
      text: line,
      interrupt: true,
      clearQueue: true,
      deduplicateKey: `roommate:${topicId}`,
      deduplicateMs: 1200,
    });
  }

  narrateWrongPassword(customReason = null) {
    this.speak({
      speaker: 'NARRATOR',
      text: customReason || NARRATOR_SCRIPTS.wrongPassword,
      interrupt: true,
      clearQueue: true,
    });
  }

  narrateDrawerUnlocked() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.drawerUnlocked,
      interrupt: true,
      clearQueue: true,
    });
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.finalNoteCollected,
    });
  }

  narrateFinalNoteCollected() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.finalNoteCollected,
      deduplicateKey: 'final_note',
      deduplicateMs: 6000,
    });
  }

  narrateDoorUnlocked() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.doorUnlocked,
      interrupt: true,
      clearQueue: true,
    });
  }

  narrateVictory() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.victory,
    });
  }

  narrateTimerWarning(secondsRemaining) {
    if (secondsRemaining === 60) {
      this.speak({
        speaker: 'NARRATOR',
        text: NARRATOR_SCRIPTS.timer60,
        interrupt: true,
        clearQueue: true,
        deduplicateKey: 'timer:60',
        deduplicateMs: 30000,
      });
    } else if (secondsRemaining === 20) {
      this.speak({
        speaker: 'NARRATOR',
        text: NARRATOR_SCRIPTS.timer20,
        interrupt: true,
        clearQueue: true,
        deduplicateKey: 'timer:20',
        deduplicateMs: 30000,
      });
    } else if (secondsRemaining === 10) {
      this.speak({
        speaker: 'NARRATOR',
        text: NARRATOR_SCRIPTS.timer10,
        interrupt: true,
        clearQueue: true,
        deduplicateKey: 'timer:10',
        deduplicateMs: 30000,
      });
    }
  }

  narrateWardenLine(speaker, text) {
    this.speak({
      speaker: String(speaker || 'WARDEN').toUpperCase(),
      text,
      interrupt: true,
      clearQueue: true,
    });
  }

  narrateWardenCaught() {
    this.speak({
      speaker: 'NARRATOR',
      text: NARRATOR_SCRIPTS.wardenCaughtNarration,
      interrupt: true,
      clearQueue: true,
    });
  }
}
