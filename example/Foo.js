import { h } from "../lib/guide-mini-vue.esm.js";
export const Foo = {
  // 接收传过来的 props
  setup(props) {
    // 1. props.count
    console.log(props);

    // 3. props不可修改
  },
  render() {
    return h("div", {}, "foo: " + this.count); //2. 通过 this 可以访问到 props里面某个属性的值
  },
};
