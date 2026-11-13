export class InventoryManager {
  constructor() {
    this.items = [];
  }

  reset() {
    this.items = [];
  }

  addItem(item) {
    if (!item || this.items.some((existing) => existing.id === item.id)) {
      return false;
    }
    this.items.push(item);
    return true;
  }

  hasItem(id) {
    return this.items.some((item) => item.id === id);
  }

  getItem(id) {
    return this.items.find((item) => item.id === id) || null;
  }

  getItems() {
    return [...this.items];
  }
}
