import { createComponentInstance, setupComponent } from "./component";

// render 函数 返回想要渲染的虚拟节点
export function render(vnode, container) {
  // patch

  // 后续需要递归调用
  patch(vnode, container);
}

function patch(vnode, container) {
  // 去处理组件

  // 判断 是不是 element 类型
  processComponent(vnode, container);
}

function processComponent(vnode: any, container: any) {
  // 挂载 组件
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  // 创建组件实例
  // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
  const instance = createComponentInstance(vnode);

  setupComponent(instance);

  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render(); // 也就是 return 出来的 h

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
