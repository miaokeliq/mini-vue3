import { isReadonly, shallowReadonly } from "../src/reactive";

import { describe, it, expect, vi } from "vitest";
describe("shallowReadonly", () => {
  it("should not make non-reactive properties reactive", () => {
    const props = shallowReadonly({ raw: { n: { foo: 1 } } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });

  it("warn then call set", () => {
    // console.warn()
    // mock 通过这个构造一个假的警告方法
    console.warn = vi.fn();
    const user = shallowReadonly({
      raw: {
        age: 10,
      },
    });

    user.age = 11;

    expect(console.warn).toBeCalled();
  });
});
