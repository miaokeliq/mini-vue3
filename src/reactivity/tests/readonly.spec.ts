import { readonly, isReadonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    //not set
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    expect(wrapped.foo).toBe(1);
  });

  // 修改 readonly 的属性时会弹出警告
  it("warn then call set", () => {
    // console.warn()
    // mock 通过这个构造一个假的警告方法
    console.warn = jest.fn();
    const user = readonly({
      age: 10,
    });

    user.age = 11;

    expect(console.warn).toBeCalled();
  });
});
