import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppApi } from "./createApp";
import { effect } from "../reactivity/effect";

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
    patch(null, vnode, container, null);
  }

  // n1 -> 老的虚拟节点   n2 -> 新的虚拟节点
  // 如果 n1 不存在， 那就是初始化 ，否则就是更新
  function patch(n1, n2, container, parentComponent) {
    // 去处理组件

    // 判断 是不是 element 类型
    // 是 element 那么就应该处理 element

    // ShapeFlags 描述当前虚拟节点的类型
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;

      case Text:
        processText(n1, n2, container);
        break;
      default:
        // Fragment -> 只渲染 children
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processText(n1, n2, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));

    container.append(textNode);
  }

  function processFragment(n1, n2, container: any, parentComponent: any) {
    //
    mountChildren(n2, container, parentComponent);
  }

  function processElement(n1, n2, container, parentComponent) {
    // 分为 初始化 和 更新
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function patchElement(n1, n2, container) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    // 对比 props
    // 对比 children
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
      patch(null, v, container, parentComponent);
    });
  }

  function processComponent(n1, n2, container: any, parentComponent) {
    // 挂载 组件
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initialVNode, container, parentComponent) {
    // 创建组件实例
    // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    // element 更新流程
    // 利用 effect 做依赖收集，来包裹当前的render函数
    // 当调用 instance.render 时会触发依赖收集, 触发响应式对象的get ，当响应式对象值改变，会触发这里的依赖
    // 然后再次调用render函数，生成全新的 subTree

    effect(() => {
      if (!instance.isMounted) {
        console.log("init");
        // 取出代理对象
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy)); // 也就是 return 出来的 h  // subTree 就是虚拟节点树 // instance.subTree 作用是把subTree保存下来
        // vnode -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance);

        // 在所有的element都处理完成了
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy); // 获取当前的subTree
        const prevSubTree = instance.subTree; // 获取之前的subTree

        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppApi(render),
  };
}
