import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

import { isObject } from "@guide-mini-vue/shared";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw: any) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
  return createActiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

// 初步实现
export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE]; // 有可能是undefined，此时使用!!转化为boolean值
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

// isProxy
export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createActiveObject(target: any, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target ${target} 必须是一个对象`);
    return target;
  }

  return new Proxy(target, baseHandlers);
}
