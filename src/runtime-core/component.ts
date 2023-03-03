export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type, // type 就是 App
    setupState: {},
  };

  return component;
}

export function setupComponent(instance) {
  // 初始化 propsj
  // initProps()
  // 初始化 slotsj
  // initSlots()

  // 调用 setup, 拿到对应的返回值 最终设置 render
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  // 先获取组件，然后获取里面的setup
  const Component = instance.type;

  // ctx
  instance.proxy = new Proxy(
    {},
    {
      //  key 是 App.js 里的this.msg
      get(target, key) {
        //setupState
        const { setupState } = instance;
        if (key in setupState) {
          return setupState[key];
        }
      },
    }
  );

  const { setup } = Component;

  if (setup) {
    //  可能返回function Object
    const setupResult = setup();

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
