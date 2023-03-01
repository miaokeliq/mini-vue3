import { ref, isRef, unRef, proxyRefs } from "../ref";
import { reactive } from "../reactive";
import { effect } from "../effect";
describe("ref", () => {
  // only 表示只会执行当前这个测试
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("should be reactive", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const a = ref({
      count: 1,
    });

    let dummy;
    effect(() => {
      dummy = a.value.count;
    });

    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  // isRef 判断响应式对象是不是一个 Ref 类型  unRef 返回 ref.value的值
  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(user)).toBe(false);
  });

  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "xiaohong",
    };
    // proxyRefs 可以让 ref 后面不用再加上 ".value" 来读取值
    // 调用 get ，如果 age 是 ref ，那么就给他返回 .value
    // 如果不是 ref , 就直接返回值
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("xiaohong");

    // set
    proxyUser.age = 20;

    // set -> 如果ref   修改.value
    //
    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);

    // 给 ref 的话那就是替换
    proxyUser.age = ref(10);
    expect(proxyUser.age).toBe(10);
    expect(user.age.value).toBe(10);
  });
});
