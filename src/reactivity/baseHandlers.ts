import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";
// 初始化的时候就创建 get，set 这样不用每次创建多个 get，set了，优化j
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    // 触发依赖
    trigger(target, key);
    return res;
  };
}
export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`key:${key} set 失败 ， 因为 target 时readonly 的`);
    return true;
  },
};
