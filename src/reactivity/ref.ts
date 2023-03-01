import { hasChanged } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";

class RefImpl {
  private _value: any;
  public dep; // 保存依赖的  只有一个dep ，因为只有一个_value
  constructor(value) {
    this._value = value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 一定先去修改了 value 的值，再触发依赖

    // 判断是否set相同的值，如果相同就不触发依赖
    // hasChanged
    if (hasChanged(newValue, this._value)) {
      this._value = newValue;

      // 触发依赖
      triggerEffects(this.dep);
    }
  }
}

function trackRefValue(ref) {
  if (isTracking()) {
    // 做依赖收集的动作
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}
