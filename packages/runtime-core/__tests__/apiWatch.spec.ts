import { reactive } from "@guide-mini-vue/reactivity";
import { nextTick } from "../src/scheduler";
import { vi } from "vitest";
import { watchEffect } from "../src/apiWatch";

describe("api: watch", () => {
  it("effect", async () => {
    const state = reactive({ count: 0 });
    let dummy;
    watchEffect(() => {
      dummy = state.count;
    });
    expect(dummy).toBe(0);

    state.count++;
    // 改变需要放到组件渲染之前，await nextTick() 就是等待它，因为组件渲染在 promise 里面，也就是微任务里面，就要等待执行完才能够进行验证
    await nextTick();
    expect(dummy).toBe(1);
  });

  it("stopping the watcher (effect)", async () => {
    const state = reactive({ count: 0 });
    let dummy;
    const stop: any = watchEffect(() => {
      dummy = state.count;
    });
    expect(dummy).toBe(0);
    stop(); // 清空依赖
    state.count++;
    await nextTick();
    // should not update
    expect(dummy).toBe(0);
  });

  it("cleanup registration (effect)", async () => {
    const state = reactive({ count: 0 });
    const cleanup = vi.fn();
    let dummy;
    const stop: any = watchEffect((onCleanup) => {
      // 在下一次更新函数之前调用它
      onCleanup(cleanup); // 传过去的 fn 在初始化的时候是不能调用的，要在后面响应式对象发生改变时再调用
      dummy = state.count;
    });
    expect(dummy).toBe(0);

    state.count++;
    await nextTick();
    expect(cleanup).toHaveBeenCalledTimes(1); // 初始化的时候不调用。以后的时候再调用
    expect(dummy).toBe(1);

    stop();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
