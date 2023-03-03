import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
export function createComponentInstance(vnode, parent) {
  console.log("createComponentInstance", parent);
  const component = {
    vnode,
    type: vnode.type, // type 就是 App
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance) {
  // 初始化 props
  initProps(instance, instance.vnode.props);
  // 初始化 slots
  initSlots(instance, instance.vnode.children);

  // 调用 setup, 拿到对应的返回值 最终设置 render
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  // 先获取组件，然后获取里面的setup
  const Component = instance.type;

  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    //  可能返回function Object
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });

    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // function Object
  //  TODO function

  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }

  // 需要保证组件的render有值
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;

  instance.render = Component.render;
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}
