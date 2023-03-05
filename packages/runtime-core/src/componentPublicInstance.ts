import { hasOwn } from "@guide-mini-vue/shared";
const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props, //  i 是组件实例对象
};
// App.js 中的 render 里面的 this 指向的是代理对象
export const PublicInstanceProxyHandlers = {
  //  key 是 App.js 里的this.msg
  get({ _: instance }, key) {
    //setupState
    const { setupState, props } = instance;

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
