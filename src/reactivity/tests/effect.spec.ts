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
});
