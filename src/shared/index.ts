export const extend = Object.assign;

export const EMPTY_OBJ = {};

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

// 判断 set value 后 value 的值是否改变
export const hasChanged = (val, newValue) => {
  // Object.is 方法判断两个值是否为同一个值
  return !Object.is(val, newValue);
};

export const hasOwn = (val, key) => {
  return Object.prototype.hasOwnProperty.call(val, key);
};

// 转换为驼峰命名格式
export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};

// 将首字母变成大写
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// event 前面加上 "on"
export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
