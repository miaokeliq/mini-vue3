import { extend } from "../shared";
class ReactiveEffect {
  private _fn: any;
  deps = [];
  active = true;
  onStop?: () => void;
  // scheduler? 的问号表示 这个参数是可选的 public 这样就能让外界访问到
  constructor(fn: any, public scheduler?) {
    this._fn = fn;
  }
  run() {
    // 证明当前的 effect 是正在执行的状态
    activeEffect = this;
    return this._fn();
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

function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

// 依赖收集
const targetMap = new Map();
export function track(target, key) {
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

  // 将 fn,也就是正在触发的依赖 放入指定key的依赖的容器
  dep.add(activeEffect);

  // 反向存储，以便读取
  activeEffect.deps.push(dep);
}

// 基于 target 和 key 取出 dep 对象， 然后调用所有之前收集到的 fn,也就是依赖
export function trigger(target: any, key: any) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  // 调用所有的依赖
  for (let effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect: any;
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
