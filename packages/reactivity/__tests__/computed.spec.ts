import { computed } from "../src/computed";
import { reactive } from "../src/reactive";

import { describe, it, expect, vi } from "vitest";
describe("computed", () => {
  it("happy path", () => {
    // ref
    // 1. 缓存
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });

  it("should computed lazily", () => {
    const value = reactive({
      foo: 1,
    });

    const getter = vi.fn(() => {
      return value.foo;
    });

    const cValue = computed(getter);

    // lazy
    // 不调用 cValue.value 的话不会 调用 getter
    expect(getter).not.toHaveBeenCalled();

    expect(cValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    // // // should be compute again   缓存机制
    cValue.value; // get
    expect(getter).toHaveBeenCalledTimes(1);

    // // // should not compute until needed
    value.foo = 2; // trigger
    expect(getter).toHaveBeenCalledTimes(1);

    // // // now it should compute
    expect(cValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
