export default class ObjectPool {
  constructor(createFn, resetFn = null) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.free = [];
    this.active = new Set();
  }

  acquire(...args) {
    const instance = this.free.pop() ?? this.createFn(...args);
    this.active.add(instance);
    return instance;
  }

  release(instance) {
    if (!this.active.has(instance)) return;
    if (this.resetFn) {
      this.resetFn(instance);
    }
    this.active.delete(instance);
    this.free.push(instance);
  }

  releaseAll() {
    [...this.active].forEach((instance) => this.release(instance));
  }

  get activeCount() {
    return this.active.size;
  }
}
