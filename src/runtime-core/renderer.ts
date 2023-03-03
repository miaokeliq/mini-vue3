import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppApi } from "./createApp";

// 闭包
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;

  // render 函数 返回想要渲染的虚拟节点
  function render(vnode, container) {
    // patch

    // 后续需要递归调用
    patch(vnode, container, null);
  }

  function patch(vnode, container, parentComponent) {
    // 去处理组件

    // 判断 是不是 element 类型
    // 是 element 那么就应该处理 element

    // ShapeFlags 描述当前虚拟节点的类型
    const { type, shapeFlag } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent);
        break;

      case Text:
        processText(vnode, container);
        break;
      default:
        // Fragment -> 只渲染 children
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent);
        }
        break;
    }
  }

  function processText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));

    container.append(textNode);
  }

  function processFragment(vnode: any, container: any, parentComponent: any) {
    //
    mountChildren(vnode, container, parentComponent);
  }

  function processElement(vnode, container, parentComponent) {
    // 分为 初始化 和 更新
    mountElement(vnode, container, parentComponent);
  }

  function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));

    // 给 el.textContent = 'hi mini-vue'
    //
    // el.setAttribute("id", "root")
    //
    // document.body.append(el)

    // string array
    const { children, shapeFlag } = vnode;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
      let val = props[key];

      hostPatchProp(el, key, val);
    }

    // container.append(el);
    hostInsert(el, container);
  }

  function mountChildren(vnode, container, parentComponent) {
    // vnode
    vnode.children.forEach((v) => {
      patch(v, container, parentComponent);
    });
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    // 挂载 组件
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(initialVNode, container, parentComponent) {
    // 创建组件实例
    // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    // 取出代理对象
    const { proxy } = instance;
    const subTree = instance.render.call(proxy); // 也就是 return 出来的 h

    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container, instance);

    // 在所有的element都处理完成了
    initialVNode.el = subTree.el;
  }

  return {
    createApp: createAppApi(render),
  };
}
