import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type, // type 就是 App
    setupState: {},
    props: {},
    emit: () => {},
  };

  component.emit = emit.bind(null, component) as any;

  return component;
}

export function setupComponent(instance) {
  // 初始化 propsj
  initProps(instance, instance.vnode.props);
  // 初始化 slotsj
  // initSlots()

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
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });

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
