// 导出出口文件

export { createApp } from "./createApp";

// h 其实就是调用 createVNode ,额外封装了一层
export { h } from "./h";

export { renderSlots } from "./helpers/renderSlots";

export { createTextVNode } from "./vnode";

export { getCurrentInstance } from "./component";

export { provide, inject } from "./apiInject";
