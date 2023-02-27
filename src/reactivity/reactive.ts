import { track, trigger } from "./effect";
export function reactive(raw: any) {
  return new Proxy(raw, {
    /*
     * target: 指向当前获取的对象
     * ket: 指向用户访问的key
     * */
    get(target, key) {
      // { foo : 1}
      //
      const res = Reflect.get(target, key);

      // 依赖收集
      track(target, key);
      return res;
    },

    set(target, key, value) {
      const res = Reflect.set(target, key, value);

      // 触发依赖
      trigger(target, key);
      return res;
    },
  });
}
