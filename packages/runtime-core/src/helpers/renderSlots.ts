import { createVNode, Fragment } from "../vnode";
export function renderSlots(slots, name, props) {
  const slot = slots[name];
  console.log(slot);

  if (slot) {
    //function
    //

    if (typeof slot === "function") {
      // children 是不可以有array
      // 只需要把 children 里面的所有节点渲染出来
      // console.log(slot(props));
      return createVNode(Fragment, {}, slot(props));
    }
  }
}
