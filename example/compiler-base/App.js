// 最简单的情况
// template 只有一个 interpolation
// export default {
//   template: `{{msg}}`,
//   setup() {
//     return {
//       msg: "vue3 - compiler",
//     };
//   },
// };

// 复杂一点
// template 包含 element 和 interpolation

import { ref } from "../../lib/guide-mini-vue.esm.js";
export const App = {
  name: "App",
  template: `<div>hi,{{count}}</div>`,
  setup() {
    const count = (window.count = ref(1));
    return {
      count,
    };
  },
};
