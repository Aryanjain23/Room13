import { getRoomObjectMeta } from './data/roomObjects.js';
import { InventoryManager } from './inventory/InventoryManager.js';
import { PuzzleManager } from './puzzles/PuzzleManager.js';
import { SoundManager } from './game/SoundManager.js';
import { NarratorManager } from './game/NarratorManager.js';
import { GameScene } from './game/GameScene.js';
import { HintSystem } from './ui/HintSystem.js';
import { Keypad } from './ui/Keypad.js';
import { InspectionPanel } from './ui/InspectionPanel.js';
import { HUD } from './ui/HUD.js';
import { JournalModal } from './ui/JournalModal.js';
import { SettingsModal } from './ui/SettingsModal.js';
import { DifficultyModal } from './ui/DifficultyModal.js';
import { RoommateDialog } from './ui/RoommateDialog.js';
import { IntroSequence } from './ui/IntroSequence.js';
import { VictoryScreen } from './ui/VictoryScreen.js';
import { WardenEndingOverlay } from './ui/WardenEndingOverlay.js';
import { SubtitleOverlay } from './ui/SubtitleOverlay.js';

export function bootRoom13Game(rootElement) {
  if (!rootElement) return () => {};

  rootElement.innerHTML = `
    <div id="app-shell">
      <div id="canvas-mount"></div>
      <div class="vignette-overlay"></div>

      <div id="menu-screen">
        <h1 class="menu-logo">ROOM 13</h1>
        <div class="menu-sub">CURFEW</div>
        <p class="menu-tag">One hostel room. Hidden clues. One sleepy roommate. Two hints. Escape before curfew inspection.</p>
        <div class="menu-actions">
          <button id="menu-play-btn" type="button" class="r13-btn primary">Play</button>
          <button id="menu-how-btn" type="button" class="r13-btn">How to play</button>
          <button id="menu-audio-btn" type="button" class="r13-btn">Audio Settings</button>
          <button id="menu-sound-btn" type="button" class="r13-btn">Sound: On</button>
        </div>
        <div class="menu-footer">Block B · 10:47 PM · All data is fictional</div>
      </div>

      <div id="how-modal" class="r13-modal-backdrop" hidden>
        <div class="r13-modal-card" role="dialog" aria-modal="true" aria-labelledby="how-title">
          <h2 id="how-title">How to Play</h2>
          <ul style="padding-left:20px;margin:0 0 18px;line-height:1.55;color:#efe6d4;">
            <li><strong>Look around:</strong> Drag with the mouse or swipe on touchscreens to turn 360°.</li>
            <li><strong>Walk:</strong> Use <strong>WASD</strong> or <strong>Arrow keys</strong> on desktop, or the bottom-left touch joystick on mobile.</li>
            <li><strong>Investigate naturally:</strong> Click or tap any ordinary object in the room to inspect it up close—nothing glows or flashes, so explore carefully.</li>
            <li><strong>Talk to Rohan:</strong> Click your roommate on the bed anytime to ask questions without using up hints.</li>
            <li><strong>Clue Journal:</strong> Press <strong>J</strong> or tap <strong>Journal</strong> to review discovered clues and their values.</li>
            <li><strong>Hints:</strong> You have exactly <strong>2 official hints</strong> per run. Use them wisely.</li>
          </ul>
          <button id="how-close-btn" type="button" class="r13-btn primary" style="width:100%;">Got it</button>
        </div>
      </div>

      <div id="webgl-fallback" class="r13-modal-backdrop" hidden>
        <div class="r13-modal-card">
          <h2>3D Graphics Paused</h2>
          <p style="margin:0 0 16px;">Your browser paused the WebGL 3D context. Reload the page to restore the 3D hostel room.</p>
          <button id="reload-webgl-btn" type="button" class="r13-btn primary">Reload</button>
        </div>
      </div>
    </div>
  `;

  const shell = rootElement.querySelector('#app-shell');
  const canvasMount = rootElement.querySelector('#canvas-mount');
  const menuScreen = rootElement.querySelector('#menu-screen');
  const howModal = rootElement.querySelector('#how-modal');
  const webglFallback = rootElement.querySelector('#webgl-fallback');
  const menuSoundBtn = rootElement.querySelector('#menu-sound-btn');

  const inventory = new InventoryManager();
  const puzzleManager = new PuzzleManager(inventory);
  const sound = new SoundManager();
  const subtitleOverlay = new SubtitleOverlay();
  subtitleOverlay.mount(shell);
  const narrator = new NarratorManager({ subtitleOverlay, sound });

  let gameScene = null;
  let hud = null;
  let inspectionPanel = null;
  let roommateDialog = null;
  let journalModal = null;
  let settingsModal = null;
  let difficultyModal = null;
  let victoryScreen = null;
  let wardenEnding = null;
  let victoryTimer = 0;
  let victoryMusicTimer = 0;

  const closeAllRoomOverlays = () => {
    if (inspectionPanel && inspectionPanel.isOpen()) inspectionPanel.close();
    if (roommateDialog && roommateDialog.isOpen()) roommateDialog.close();
    if (journalModal && journalModal.isOpen()) journalModal.close();
  };

  const hintSystem = new HintSystem(
    puzzleManager,
    (msg, ms) => hud && hud.showToast(msg, ms),
    () => sound.playClick(),
    (res) => narrator.narrateHint(res)
  );

  const keypad = new Keypad({
    puzzleManager,
    sound,
    onDrawerSolved: () => {
      sound.playDrawerUnlock();
      sound.playClueFound();
      hud.showToast('Drawer unlocked! Torn Drawer Note added to your inventory.', 4500);
      narrator.narrateDrawerUnlocked();
      if (inspectionPanel && inspectionPanel.isOpen()) {
        inspectionPanel.render(puzzleManager.getSnapshot());
      }
    },
    onDoorSolved: () => {
      const snap = puzzleManager.getSnapshot();
      // Mutually exclusive: victory never triggers if player was already caught
      if (snap.caught || !snap.escaped) return;
      if (wardenEnding) wardenEnding.hide();
      if (inspectionPanel) inspectionPanel.close();
      if (roommateDialog) roommateDialog.close();
      sound.stopGameplayMusic(0.12);
      sound.playDoorUnlock();
      hud.showToast('Exit unlocked! Opening Room 13...', 3200);
      narrator.narrateDoorUnlocked();
      gameScene.syncState(snap);
      clearTimeout(victoryMusicTimer);
      clearTimeout(victoryTimer);
      victoryMusicTimer = window.setTimeout(() => {
        if (!puzzleManager.escaped) return;
        sound.playVictoryMusic();
      }, 650);
      victoryTimer = window.setTimeout(() => {
        if (!puzzleManager.escaped) return;
        victoryScreen.show(puzzleManager.getSnapshot());
        narrator.narrateVictory();
      }, 2150);
    },
    onDoorError: () => {
      if (gameScene) gameScene.flashKeypadError();
    },
    onWrongPassword: ({ result }) => {
      const reason = result && result.lockedByProgress ? result.message : null;
      narrator.narrateWrongPassword(reason);
    },
  });

  inspectionPanel = new InspectionPanel({
    puzzleManager,
    keypad,
    sound,
    onTryDoorHandle: () => {
      if (gameScene) gameScene.triggerHandleRattle();
    },
    onClose: () => {
      if (gameScene) gameScene.closeObjectView();
    },
  });
  inspectionPanel.mount(shell);

  roommateDialog = new RoommateDialog({
    puzzleManager,
    sound,
    onSpeakLine: (line, topicId) => {
      narrator.narrateRoommateLine(line, topicId);
    },
    onClose: () => {
      if (gameScene) gameScene.closeObjectView();
    },
  });
  roommateDialog.mount(shell);

  journalModal = new JournalModal({
    sound,
    onInspectEntry: (item) => {
      if (puzzleManager.gameEnded) return;
      if (roommateDialog && roommateDialog.isOpen()) roommateDialog.close();
      inspectionPanel.openInventoryItem(item);
    },
  });
  journalModal.mount(shell);

  const introSequence = new IntroSequence({
    sound,
    onComplete: () => {
      puzzleManager.startGame();
      sound.startGameplayMusic();
      subtitleOverlay.setDockLayout('room');
      hud.setVisible(true);
      const snap = puzzleManager.getSnapshot();
      hud.showToast(
        `${snap.difficultyLabel} Mode active. Inspect objects around Room 13 or talk to Rohan.`,
        5000
      );
      narrator.narrateGameStart();
    },
  });
  introSequence.mount(shell);

  difficultyModal = new DifficultyModal({
    sound,
    narrator,
    onDifficultyPreview: (modeId) => {
      narrator.narrateDifficulty(modeId);
    },
    onSelect: (modeId, durationSeconds) => {
      clearTimeout(victoryTimer);
      clearTimeout(victoryMusicTimer);
      if (wardenEnding) wardenEnding.hide();
      if (victoryScreen) victoryScreen.hide();
      closeAllRoomOverlays();
      hud.setVisible(false);
      sound.stopAllGameAudio(0.08);
      narrator.stopAll();
      puzzleManager.setDifficulty(modeId, 'intro', durationSeconds);
      if (gameScene) {
        gameScene.resetWarden();
        gameScene.resetCameraView();
        gameScene.syncState(puzzleManager.getSnapshot());
      }
      introSequence.start(modeId);
    },
    onBack: () => {
      narrator.stopAll();
      puzzleManager.phase = 'menu';
      puzzleManager.notify();
      menuScreen.classList.remove('off');
    },
  });
  difficultyModal.mount(shell);

  const openDifficultySelector = () => {
    clearTimeout(victoryTimer);
    clearTimeout(victoryMusicTimer);
    if (wardenEnding) wardenEnding.hide();
    if (victoryScreen) victoryScreen.hide();
    closeAllRoomOverlays();
    if (settingsModal && settingsModal.isOpen()) settingsModal.close();
    sound.stopAllGameAudio(0.1);
    narrator.stopAll();
    hud.setVisible(false);
    puzzleManager.reset(false);
    puzzleManager.phase = 'difficulty';
    puzzleManager.notify();
    if (gameScene) {
      gameScene.resetWarden();
      gameScene.syncState(puzzleManager.getSnapshot());
    }
    difficultyModal.open(puzzleManager.difficulty);
  };

  settingsModal = new SettingsModal({
    sound,
    narrator,
    puzzleManager,
    onPauseChange: (paused) => {
      if (puzzleManager.phase === 'playing' && !puzzleManager.gameEnded) {
        sound.setPaused(paused);
        narrator.setPaused(paused);
      }
    },
    onResetView: () => {
      if (gameScene) gameScene.resetCameraView();
      hud.showToast('Camera view reset.', 1600);
    },
    onOpenHow: () => {
      howModal.hidden = false;
    },
    onChangeDifficulty: openDifficultySelector,
    onReturnMenu: () => {
      clearTimeout(victoryTimer);
      clearTimeout(victoryMusicTimer);
      if (wardenEnding) wardenEnding.hide();
      if (victoryScreen) victoryScreen.hide();
      closeAllRoomOverlays();
      sound.stopAllGameAudio(0.1);
      narrator.stopAll();
      puzzleManager.reset(false);
      hud.setVisible(false);
      menuScreen.classList.remove('off');
    },
  });
  settingsModal.mount(shell);

  victoryScreen = new VictoryScreen(
    () => {
      sound.playClick();
      clearTimeout(victoryTimer);
      clearTimeout(victoryMusicTimer);
      if (wardenEnding) wardenEnding.hide();
      closeAllRoomOverlays();
      if (settingsModal && settingsModal.isOpen()) settingsModal.close();
      sound.stopAllGameAudio(0.08);
      narrator.stopAll();
      puzzleManager.reset(true);
      sound.startGameplayMusic();
      subtitleOverlay.setDockLayout('room');
      if (gameScene) {
        gameScene.resetWarden();
        gameScene.resetCameraView();
        gameScene.syncState(puzzleManager.getSnapshot());
      }
      hud.setVisible(true);
      hud.showToast(
        `New ${puzzleManager.getSnapshot().difficultyLabel} Mode attempt started.`,
        3500
      );
      narrator.narrateGameStart();
    },
    () => {
      sound.playClick();
      openDifficultySelector();
    }
  );
  victoryScreen.mount(shell);

  wardenEnding = new WardenEndingOverlay({
    sound,
    narrator,
    onRetry: () => {
      clearTimeout(victoryTimer);
      clearTimeout(victoryMusicTimer);
      closeAllRoomOverlays();
      if (settingsModal && settingsModal.isOpen()) settingsModal.close();
      sound.stopAllGameAudio(0.08);
      narrator.stopAll();
      puzzleManager.reset(true);
      sound.startGameplayMusic();
      subtitleOverlay.setDockLayout('room');
      if (gameScene) {
        gameScene.resetWarden();
        gameScene.resetCameraView();
        gameScene.syncState(puzzleManager.getSnapshot());
      }
      hud.setVisible(true);
      hud.showToast(
        `New ${puzzleManager.getSnapshot().difficultyLabel} Mode attempt started.`,
        3500
      );
      narrator.narrateGameStart();
    },
    onMainMenu: () => {
      clearTimeout(victoryTimer);
      clearTimeout(victoryMusicTimer);
      closeAllRoomOverlays();
      if (settingsModal && settingsModal.isOpen()) settingsModal.close();
      sound.stopAllGameAudio(0.08);
      narrator.stopAll();
      puzzleManager.reset(false);
      if (gameScene) {
        gameScene.resetWarden();
        gameScene.syncState(puzzleManager.getSnapshot());
      }
      hud.setVisible(false);
      menuScreen.classList.remove('off');
    },
  });
  wardenEnding.mount(shell);

  const toggleQuickSound = () => {
    sound.init();
    const next = !puzzleManager.soundEnabled;
    if (next) {
      if (!sound.musicEnabled && !sound.sfxEnabled) {
        sound.setMusicEnabled(true);
        sound.setSfxEnabled(true);
      }
      if (sound.masterVolume <= 0) {
        sound.setMasterVolume(0.85);
      }
    }
    sound.setEnabled(next);
    puzzleManager.setSoundEnabled(next);
    if (next) sound.playClick();
  };

  hud = new HUD({
    puzzleManager,
    hintSystem,
    sound,
    onToggleSound: toggleQuickSound,
    onOpenJournal: () => {
      if (puzzleManager.gameEnded) return;
      if (inspectionPanel && inspectionPanel.isOpen()) inspectionPanel.close();
      if (roommateDialog && roommateDialog.isOpen()) roommateDialog.close();
      journalModal.open(puzzleManager.getSnapshot());
      narrator.narrateJournalOpened();
    },
    onOpenSettings: () => {
      if (puzzleManager.gameEnded) return;
      closeAllRoomOverlays();
      settingsModal.open();
    },
    onResetView: () => {
      if (gameScene && !puzzleManager.gameEnded) gameScene.resetCameraView();
    },
    onInspectInventoryItem: (item) => {
      if (puzzleManager.gameEnded) return;
      if (roommateDialog && roommateDialog.isOpen()) roommateDialog.close();
      inspectionPanel.openInventoryItem(item);
    },
    onJoystickInput: (x, y) => {
      if (gameScene) gameScene.setJoystickInput(x, y);
    },
  });
  hud.mount(shell);

  gameScene = new GameScene(canvasMount, {
    onSelectObject: (objectId) => {
      const snap = puzzleManager.getSnapshot();
      if (snap.phase !== 'playing' || snap.gameEnded) return;
      if (journalModal.isOpen() || settingsModal.isOpen() || difficultyModal.isOpen()) return;
      const objMeta = getRoomObjectMeta(objectId, snap.difficulty);
      if (!objMeta) return;

      sound.init();

      if (objectId === 'roommate') {
        if (inspectionPanel && inspectionPanel.isOpen()) inspectionPanel.close();
        sound.playClick();
        gameScene.inspectObjectView(objMeta);
        roommateDialog.open(snap);
        return;
      }

      if (roommateDialog && roommateDialog.isOpen()) roommateDialog.close();

      const newlyFound = puzzleManager.inspectObject(objectId);
      if (objectId === 'notebook') {
        sound.playPageTurn();
      }
      if (newlyFound) {
        sound.playClueFound();
        hud.showToast(`Clue noted: ${newlyFound.name}`, 3600);
      } else if (objectId !== 'notebook') {
        sound.playClick();
      }

      const postSnap = puzzleManager.getSnapshot();
      narrator.narrateObjectInspection(objectId, postSnap);
      if (newlyFound) {
        narrator.narrateClueDiscovered(newlyFound);
      }

      gameScene.inspectObjectView(objMeta);
      inspectionPanel.openObject(objectId);
    },
    onContextLost: () => {
      webglFallback.hidden = false;
    },
  });

  const triggerCaughtSequence = (snapshot) => {
    if (wardenEnding.active || snapshot.escaped) return;
    clearTimeout(victoryTimer);
    clearTimeout(victoryMusicTimer);
    closeAllRoomOverlays();
    if (settingsModal && settingsModal.isOpen()) settingsModal.close();
    if (howModal && !howModal.hidden) howModal.hidden = true;
    hud.setVisible(false);
    sound.playWardenEntranceSequence();
    if (gameScene) {
      gameScene.startWardenSequence();
    }
    wardenEnding.start(snapshot);
  };

  // Subscribe UI & 3D scene to central PuzzleManager state
  const unsubscribe = puzzleManager.subscribe((snapshot) => {
    hud.update(snapshot);
    menuSoundBtn.textContent = `Sound: ${snapshot.soundEnabled ? 'On' : 'Off'}`;
    if (snapshot.caught && !wardenEnding.active) {
      triggerCaughtSequence(snapshot);
    }
    if (!snapshot.gameEnded) {
      if (inspectionPanel && inspectionPanel.isOpen()) {
        inspectionPanel.render(snapshot);
      }
      if (roommateDialog && roommateDialog.isOpen()) {
        roommateDialog.render(snapshot);
      }
      if (journalModal && journalModal.isOpen()) {
        journalModal.render(snapshot);
      }
    }
    if (gameScene) {
      gameScene.syncState(snapshot);
    }
  });

  // Main menu handlers
  rootElement.querySelector('#menu-play-btn').addEventListener('click', () => {
    sound.init();
    sound.playClick();
    menuScreen.classList.add('off');
    openDifficultySelector();
  });

  rootElement.querySelector('#menu-how-btn').addEventListener('click', () => {
    sound.init();
    sound.playClick();
    howModal.hidden = false;
  });

  rootElement.querySelector('#how-close-btn').addEventListener('click', () => {
    sound.playClick();
    howModal.hidden = true;
  });

  howModal.addEventListener('click', (e) => {
    if (e.target === howModal) howModal.hidden = true;
  });

  rootElement.querySelector('#menu-audio-btn').addEventListener('click', () => {
    sound.init();
    sound.playClick();
    settingsModal.open();
  });

  menuSoundBtn.addEventListener('click', toggleQuickSound);

  rootElement.querySelector('#reload-webgl-btn').addEventListener('click', () => {
    window.location.reload();
  });

  // Keyboard shortcuts & puzzle accessibility
  const onKeyDown = (e) => {
    if (introSequence.active) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        sound.playClick();
        introSequence.finish();
      }
      return;
    }

    const snap = puzzleManager.getSnapshot();
    if (snap.gameEnded) return;

    if (e.key === 'Escape') {
      if (!howModal.hidden) {
        howModal.hidden = true;
        return;
      }
      if (difficultyModal && difficultyModal.isOpen()) {
        sound.playClick();
        difficultyModal.close();
        puzzleManager.phase = 'menu';
        puzzleManager.notify();
        menuScreen.classList.remove('off');
        return;
      }
      if (journalModal && journalModal.isOpen()) {
        sound.playClick();
        journalModal.close();
        return;
      }
      if (roommateDialog && roommateDialog.isOpen()) {
        sound.playClick();
        roommateDialog.close();
        return;
      }
      if (inspectionPanel && inspectionPanel.isOpen()) {
        sound.playClick();
        inspectionPanel.close();
        return;
      }
      if (snap.phase === 'playing') {
        sound.playClick();
        if (settingsModal.isOpen()) {
          settingsModal.close();
        } else {
          settingsModal.open();
        }
      }
      return;
    }

    if (snap.phase !== 'playing' || settingsModal.isOpen() || difficultyModal.isOpen()) return;
    if (roommateDialog && roommateDialog.isOpen()) return;

    if (inspectionPanel && inspectionPanel.isOpen()) {
      if (inspectionPanel.activeObjectId === 'door' && !snap.doorUnlocked) {
        if (/^[0-9]$/.test(e.key)) {
          sound.playKeypadBeep(e.key);
          keypad.clearFeedback();
          puzzleManager.pressDoorDigit(e.key);
        } else if (e.key === 'Backspace') {
          sound.playClick();
          keypad.clearFeedback();
          puzzleManager.backspaceDoorDigit();
        } else if (e.key === 'Enter') {
          keypad.submitDoor();
        }
      } else if (inspectionPanel.activeObjectId === 'drawer' && !snap.drawerUnlocked && e.key === 'Enter') {
        const submitBtn = rootElement.querySelector('#drawer-submit-btn');
        if (submitBtn) submitBtn.click();
      }
      return;
    }

    if (e.key === 'j' || e.key === 'J') {
      sound.playClick();
      if (journalModal.isOpen()) {
        journalModal.close();
      } else {
        journalModal.open(snap);
        narrator.narrateJournalOpened();
      }
    } else if (!journalModal.isOpen() && (e.key === 'r' || e.key === 'R')) {
      sound.playClick();
      gameScene.resetCameraView();
      hud.showToast('Camera view reset.', 1600);
    } else if (!journalModal.isOpen() && (e.key === 'h' || e.key === 'H')) {
      hintSystem.requestHint();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  // Suspense timer, dynamic tension soundtrack, footsteps, narrator warnings & warden arrival at 0:00
  const secondInterval = window.setInterval(() => {
    const snap = puzzleManager.getSnapshot();
    if (snap.phase !== 'playing' || snap.gameEnded || settingsModal.isOpen()) return;

    const triggeredTimeout = puzzleManager.tickSecond();
    if (triggeredTimeout) return;

    const updated = puzzleManager.getSnapshot();
    const total = updated.totalDurationSeconds || 600;
    const remaining = updated.countdownSeconds;
    sound.updateCountdownMusic(remaining, total);

    const midPoint = Math.floor(total / 2);
    if (total >= 90 && remaining === midPoint) {
      sound.playWardenFootsteps();
      hud.showToast('Distant footsteps echo down the Block B corridor...', 4000);
    }

    if (remaining === 60 && total > 60) {
      sound.playWardenFootsteps();
      hud.showToast('One minute remaining! The warden could arrive any moment.', 4000);
      narrator.narrateTimerWarning(60);
    } else if (remaining === 20) {
      sound.playWardenFootsteps();
      hud.showToast('20 seconds left! The warden’s flashlight sweeps near the stairs.', 3800);
      narrator.narrateTimerWarning(20);
    } else if (remaining === 10) {
      narrator.narrateTimerWarning(10);
    } else if (remaining === 5) {
      sound.playWardenFootsteps();
      hud.showToast('Footsteps stop outside Room 13. Unlock the door now!', 4200);
    }
  }, 1000);

  // Initial sync
  puzzleManager.notify();

  return () => {
    clearInterval(secondInterval);
    clearTimeout(victoryTimer);
    clearTimeout(victoryMusicTimer);
    sound.stopAllGameAudio(0.05);
    narrator.stopAll();
    introSequence.clearTimers();
    wardenEnding.hide();
    window.removeEventListener('keydown', onKeyDown);
    unsubscribe();
    if (gameScene) gameScene.dispose();
  };
}
