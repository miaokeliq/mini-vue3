import { h } from "../lib/guide-mini-vue.esm.js";
export const App = {
  // 假设必须要写 render
  render() {
    // ui
    return h("div", "hi," + this.msg);
  },

  setup() {
    return {
      msg: "mini-vue",
    };
  },
};
