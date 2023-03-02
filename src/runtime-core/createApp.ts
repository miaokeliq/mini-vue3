import { createVNode } from "./vnode";
import { render } from "./renderer";
export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 先把所有东西转换层 v-node ，后续所有逻辑操作 都会基于 vnode 做处理
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    }, // 接收根容器， 后续把所有元素渲染出来以后添加到根容器里面
  };
}
