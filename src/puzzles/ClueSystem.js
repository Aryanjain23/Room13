import { getDifficultyConfig } from '../data/puzzleData.js';

export class ClueSystem {
  constructor(difficulty = 'easy') {
    this.difficulty = difficulty;
    this.discovered = new Set();
    this.inspectedObjects = new Set();
    this.doorPlaqueSeen = false;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty || 'easy';
    this.reset();
  }

  reset() {
    this.discovered.clear();
    this.inspectedObjects.clear();
    this.doorPlaqueSeen = false;
  }

  recordInspection(objectId) {
    this.inspectedObjects.add(objectId);
    const cfg = getDifficultyConfig(this.difficulty);
    const clue = cfg.clues[objectId];
    let newlyDiscoveredClue = null;

    if (clue && objectId !== 'tornNote' && !this.discovered.has(objectId)) {
      this.discovered.add(objectId);
      newlyDiscoveredClue = clue;
    } else if (objectId === 'door') {
      this.doorPlaqueSeen = true;
    }

    return newlyDiscoveredClue;
  }

  unlockTornNote() {
    const cfg = getDifficultyConfig(this.difficulty);
    if (!this.discovered.has('tornNote') && cfg.clues.tornNote) {
      this.discovered.add('tornNote');
      return cfg.clues.tornNote;
    }
    return null;
  }

  getDrawerClueIds() {
    const cfg = getDifficultyConfig(this.difficulty);
    return cfg.drawerClueIds || ['clock', 'notice', 'bed'];
  }

  getNumberCluesCount() {
    const ids = this.getDrawerClueIds();
    return ids.reduce((acc, id) => acc + (this.discovered.has(id) ? 1 : 0), 0);
  }

  areAllThreeNumbersFound() {
    const ids = this.getDrawerClueIds();
    return ids.every((id) => this.discovered.has(id));
  }

  hasDiscovered(clueId) {
    return this.discovered.has(clueId);
  }

  hasInspected(objectId) {
    return this.inspectedObjects.has(objectId);
  }
}
