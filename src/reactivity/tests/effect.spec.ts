import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  // reactivity 最核心的代码流程
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    // update
    user.age++;
    // 当响应式的值发生改变了，effect包裹的里面的值也会更新
    expect(nextAge).toBe(12);
  });

  it("should return runner when call effect", () => {
    // 1. 调用 effect 后返回一个 function(runner) ,如果再次调用这个function的话就会执行 fn  , 并且会拿到内部 fn 返回出来的值

    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});
