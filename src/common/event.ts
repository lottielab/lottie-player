export type Listener<E> = (event: E) => void;

export class EventEmitter<E = undefined> {
  private listeners: Listener<E>[] = [];

  addListener(listener: (event: E) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (event: E) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  hasListeners() {
    return this.listeners.length > 0;
  }

  removeAllListeners() {
    this.listeners = [];
  }

  emit(event: E) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
