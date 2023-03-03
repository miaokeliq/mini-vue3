import { h } from "../lib/guide-mini-vue.esm.js";

window.self = null;
export const App = {
  // 假设必须要写 render
  render() {
    window.self = this;
    // ui
    return h(
      "div",
      {
        id: "root",
        class: ["red", "hard"],
      },
      // 方法一
      // 1. setupState 里面获取对应的值
      // 2. thi.$el -> 获取 根节点，也就是 上面的 div
      //
      //
      "hi," + this.msg
      // string
      // "hi, mini-vue"
      // Array
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue")]
    );
  },

  setup() {
    return {
      msg: "mini-vue-haha",
    };
  },
};
