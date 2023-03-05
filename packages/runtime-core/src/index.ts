// 导出出口文件

// h 其实就是调用 createVNode ,额外封装了一层
export { h } from "./h";

export { renderSlots } from "./helpers/renderSlots";

export { createTextVNode, createElementVNode } from "./vnode";

export { getCurrentInstance, registerRuntimeCompiler } from "./component";

export { provide, inject } from "./apiInject";

export { createRenderer } from "./renderer";

export { nextTick } from "./scheduler";

export { toDisplayString } from "@guide-mini-vue/shared";

export * from "@guide-mini-vue/reactivity";
