import { extend } from "@guide-mini-vue/shared";

let activeEffect: any;
let shouldTrack: any;
export class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  public scheduler: Function | undefined;
  // scheduler? 的问号表示 这个参数是可选的 public 这样就能让外界访问到
  constructor(fn: any, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 证明当前的 effect 是正在执行的状态
    // 1. 会收集依赖
    //    shouldTrack 来做区分
    if (!this.active) {
      return this._fn();
    }

    shouldTrack = true;
    activeEffect = this;

    const result = this._fn();
    // reset
    shouldTrack = false;
    return result;
  }

  stop() {
    // active 参数能够避免性能问题，如果active = false，就不用再删除了，这样以后就不会多次删除
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect: any) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

// 依赖收集
const targetMap = new Map();
export function track(target, key) {
  if (!isTracking()) return;

  // 收集依赖的容器
  // target -> key -> dep

  // 先通过 target 获取 对应的依赖容器
  let depsMap = targetMap.get(target);

  // 初始化，如果depsMap没有的话
  if (!depsMap) {
    // 也是 Map  target.key -> value
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  // 再通过key获取容器里对应这个key的依赖
  let dep = depsMap.get(key);

  // 如果容器里没有依赖dep，则创建一个
  if (!dep) {
    dep = new Set();
    // 保存创建的dep
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  // 将 fn,也就是正在触发的依赖 放入指定key的依赖的容器
  if (dep.has(activeEffect)) return; // 避免重复收集
  dep.add(activeEffect);

  // 反向存储，以便读取
  activeEffect.deps.push(dep);
}

// 正在收集中的状态
//
// 就是判断是否有 收集到的依赖
export function isTracking() {
  /* // 如果没有effect，就不用执行下面的操作，就修复了 reactive 的 happy path 单测
  if (!activeEffect) return;
  if (!shouldTrack) return; */
  return shouldTrack && activeEffect !== undefined;
}

// 基于 target 和 key 取出 dep 对象， 然后调用所有之前收集到的 fn,也就是依赖
export function trigger(target: any, key: any) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  triggerEffects(dep);
}

// 抽离 调用所有的依赖的逻辑
export function triggerEffects(dep) {
  // 调用所有的依赖
  for (let effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn: any, options: any = {}) {
  // fn
  const _effect = new ReactiveEffect(fn, options.scheduler);

  // options
  // extend
  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
