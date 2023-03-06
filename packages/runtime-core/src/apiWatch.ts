import { ReactiveEffect } from "../../reactivity/src/effect";

import { queuePreFlushCb } from "./scheduler";

export function watchEffect(source) {
  function job() {
    effect.run();
  }

  let cleanup;
  const onCleanup = function (fn) {
    cleanup = effect.onStop = () => {
      // onStop 是 stop 之后的回调，这样就能达成单元测试的最后一个测试了
      fn();
    };
  };

  function getter() {
    if (cleanup) {
      // 如果有值，说明初始化的时候赋值了，这时候就可以直接调用它了
      cleanup();
    }

    source(onCleanup);
  }

  const effect = new ReactiveEffect(getter, () => {
    // fn() 需要添加到组件渲染之前

    queuePreFlushCb(job);
  });

  // watchEffect 一上来就是要进行调用的，所以通过 这个来触发
  effect.run();

  return () => {
    effect.stop();
  };
}
