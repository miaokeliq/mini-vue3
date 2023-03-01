import { isTracking, trackEffects, triggerEffects } from "./effect";

class RefImpl {
  private _value: any;
  public dep; // 保存依赖的  只有一个dep ，因为只有一个_value
  constructor(value) {
    this._value = value;
    this.dep = new Set();
  }

  get value() {
    if (isTracking()) {
      // 做依赖收集的动作
      trackEffects(this.dep);
    }

    return this._value;
  }

  set value(newValue) {
    // 一定先去修改了 value 的值，再触发依赖

    // 判断是否set相同的值，如果相同就不触发依赖
    // Object.is 方法判断两个值是否为同一个值
    if (Object.is(newValue, this._value)) return;

    this._value = newValue;

    // 触发依赖
    triggerEffects(this.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}
