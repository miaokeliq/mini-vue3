import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { shallowReadonly, proxyRefs } from "@guide-mini-vue/reactivity";
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
    next: null,
    isMounted: false,
    subTree: {},
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance) {
  // 初始化 props
  initProps(instance, instance.vnode.props);
  // 初始化 slots
  initSlots(instance, instance.vnode.children); //把虚拟节点的slots赋值给children

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
    const setupResult = setup(shallowReadonly({ raw: instance.props }), {
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
    instance.setupState = proxyRefs(setupResult); // 通过 proxyRefs 包裹可以直接使例如 this.name = name.value  就不用再 .value 了
  }

  // 需要保证组件的render有值
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;

  if (compiler && !Component.render) {
    // 如果用户先写了 render 函数的话则优先级最高
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }

  instance.render = Component.render;
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}

let compiler;

export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
