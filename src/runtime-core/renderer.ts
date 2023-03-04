import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppApi } from "./createApp";
import { effect } from "../reactivity/effect";
import { EMPTY_OBJ } from "../shared";

// 闭包
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  // render 函数 返回想要渲染的虚拟节点
  function render(vnode, container) {
    // patch

    // 后续需要递归调用
    patch(null, vnode, container, null, null);
  }

  // n1 -> 老的虚拟节点   n2 -> 新的虚拟节点
  // 如果 n1 不存在， 那就是初始化 ，否则就是更新
  function patch(n1, n2, container, parentComponent, anchor) {
    // 去处理组件

    // 判断 是不是 element 类型
    // 是 element 那么就应该处理 element

    // ShapeFlags 描述当前虚拟节点的类型
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;

      case Text:
        processText(n1, n2, container);
        break;
      default:
        // Fragment -> 只渲染 children
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processText(n1, n2, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));

    container.append(textNode);
  }

  function processFragment(
    n1,
    n2,
    container: any,
    parentComponent: any,
    anchor
  ) {
    //
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    // 分为 初始化 和 更新
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);

    // 对比 props
    // 三种场景：
    // 1. 如果老的prop是 foo:foo 新的是 foo:new-foo , 也就是 foo 之前的值和现在的值不一样了，则修改
    // 2. 如果新的是 undefined || null，则删除
    // 3. 如果 foo 这个属性在新的里面没有了，则删除
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ; // 如果没有就设置为 {}
    const el = (n2.el = n1.el); // 下次更新时n2没有el, 这时就需要把 el 赋值给 n2 的, 这样下次更新时 n2就是 n1,这时就有 el 了

    // 对比 children
    patchChildren(n1, n2, el, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    // 当前新的节点是 text
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的节点是 数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 把老的children 清空
        unmountChildern(n1.children);
      }
      if (c1 !== c2) {
        // 判断 text 变 text，同时也是 数组 变 text 的第二步
        // 2. 设置 text  , 其实也是一个渲染接口
        hostSetElementText(container, c2);
      }
    } else {
      // 肯定确认新的是数组了
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array diff array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length;
    // 设置 3 个指针
    let i = 0;
    let e1 = c1.length - 1; // 因为是索引从0开始， 所以要减1 ，  e1指向c1的最后一个元素
    let e2 = l2 - 1;

    function isSomeVNodeType(n1, n2) {
      // type
      //  key
      return n1.type === n2.type && n1.key === n2.key;
    }
    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      // 判断 n1 和 n2 是否一样
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor); // 如果 n1 和 n2 一样，就递归地调用patch进行对比两个的孩子节点
      } else {
        break;
      }
      i++;
    }

    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 3. 新的比老的多  需要创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null; // 判断是创建在左边还是右边，如果是右边就为null，因为null的话默认是添加到尾部
        while (i <= e2) {
          // 可能要添加多个
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      //乱序的部分
    }
  }

  function unmountChildern(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el; // 先拿到真实的dom元素
      // remove
      hostRemove(el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // 不一样才对比， �样的话就不用对比了
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];

        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp);
        }
      }

      // 场景三
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(vnode, container, parentComponent, anchor) {
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
      mountChildren(vnode.children, el, parentComponent, anchor);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
      let val = props[key];

      hostPatchProp(el, key, null, val); // 初始化的时候没有之前的值，可以给 null
    }

    // container.append(el);
    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    // vnode
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(n1, n2, container: any, parentComponent, anchor) {
    // 挂载 组件
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 创建组件实例
    // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
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
        patch(null, subTree, container, instance, anchor);

        // 在所有的element都处理完成了
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        console.log("update");
        const { proxy } = instance;
        const subTree = instance.render.call(proxy); // 获取当前的subTree
        const prevSubTree = instance.subTree; // 获取之前的subTree

        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppApi(render),
  };
}
