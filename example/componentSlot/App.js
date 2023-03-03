import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");

    // object key 这样通过key就能获取到指定的元素了j
    const foo = h(
      Foo,
      {},
      {
        // 转换成函数是因为 需要实现作用域插槽 ，这样好把值给 传过来
        header: ({ age }) => h("p", {}, "header" + age),
        footer: () => h("p", {}, "footer"),
      }
    );
    // const foo = h(Foo, {}, h("p", {}, "123"));

    return h("div", {}, [app, foo]);
  },

  setup() {
    return {};
  },
};
