import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
/**
 *    因为一般 ref 包裹的都是单值，比如： 1 true "1"
 *    问题就是怎么知道值被 get 或者被 set 了
 *    这样利用之前的 proxy 就不行了, 因为 proxy 只针对于对象，而包裹的是值类型
 *    解决方法： 通过对象进行包裹，也就是 RefImpl , 这个 类里面有 value 值，然后给类写 get set，这样就能知道什么时候触发 set 和 get ，就可以做依赖收集和触发依赖了
 *
 * */
class RefImpl {
  private _value: any;
  public dep; // 保存依赖的  只有一个dep ，因为只有一个_value

  private _rawValue: any;
  public __v_isRef = true;
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);

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

      this._value = convert(newValue);
      // 触发依赖
      triggerEffects(this.dep);
    }
  }
}
// convert->转换j
function convert(value) {
  return isObject(value) ? reactive(value) : value;
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

export function isRef(ref) {
  // !!两个 感叹号就转换为 boolean
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  // 看看是不是 ref -> ref.value
  // 反之就直接 返回 refj
  return isRef(ref) ? ref.value : ref;
}
