import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive(raw: any) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw: any) {
  return createActiveObject(raw, readonlyHandlers);
}

// 初步实现
export function isReactive(value) {
  return value["is_reactive"];
}

function createActiveObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}
