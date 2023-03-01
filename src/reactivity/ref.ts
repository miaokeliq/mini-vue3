import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
class RefImpl {
  private _value: any;
  public dep; // 保存依赖的  只有一个dep ，因为只有一个_value

  private _rawValue: any;
  constructor(value) {
    this._rawValue = value;
    this._value = isObject(value) ? reactive(value) : value;

    // 如果传过来的是对象，需要把value转换成reactive包裹之后的结果，因为所有对象都需要reactive处理
    // 1. 看看 value 是不是 对象j

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
    // 对比的时候 object , 如果 _value 是对象，则就对比被 reactive 之前的 值 -> _rawValue
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;

      this._value = isObject(newValue) ? reactive(newValue) : newValue;
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
