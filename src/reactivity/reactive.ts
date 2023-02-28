import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export function reactive(raw: any) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
  return createActiveObject(raw, readonlyHandlers);
}

// 初步实现
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

function createActiveObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
