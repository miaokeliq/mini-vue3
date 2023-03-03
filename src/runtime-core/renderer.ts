import { createComponentInstance, setupComponent } from "./component";
import { isObject } from "../shared";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
// render 函数 返回想要渲染的虚拟节点
export function render(vnode, container) {
  // patch

  // 后续需要递归调用
  patch(vnode, container);
}

function patch(vnode, container) {
  // 去处理组件

  // 判断 是不是 element 类型
  // 是 element 那么就应该处理 element

  // ShapeFlags 描述当前虚拟节点的类型
  const { type, shapeFlag } = vnode;
  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;

    case Text:
      processText(vnode, container);
      break;
    default:
      // Fragment -> 只渲染 children
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
      }
      break;
  }
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));

  container.append(textNode);
}

function processFragment(vnode: any, container: any) {
  //
  mountChildren(vnode, container);
}

function processElement(vnode, container) {
  // 分为 初始化 和 更新
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.type));

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
    mountChildren(vnode, el);
  }
  // props
  const { props } = vnode;
  for (let key in props) {
    let val = props[key];

    // 正则表达式
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
}

function mountChildren(vnode, container) {
  // vnode
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

function processComponent(vnode: any, container: any) {
  // 挂载 组件
  mountComponent(vnode, container);
}

function mountComponent(initialVNode, container) {
  // 创建组件实例
  // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
  const instance = createComponentInstance(initialVNode);

  setupComponent(instance);

  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance: any, initialVNode, container) {
  // 取出代理对象
  const { proxy } = instance;
  const subTree = instance.render.call(proxy); // 也就是 return 出来的 h

  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);

  // 在所有的element都处理完成了
  initialVNode.el = subTree.el;
}
