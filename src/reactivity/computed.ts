import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _getter: any;
  private _dirty: boolean = true;

  private _value: any;
  private _effect: any;
  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    // get
    // 当依赖的响应式对象的值发生改变的时候， this_dirty = true
    // 可以引入 effect 把它收集起来
    if (this._dirty) {
      this._dirty = false; // 把getter锁上，这样 getter只能调用一次，以后都是直接调 this._value
      this._value = this._effect.run();
    }

    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
