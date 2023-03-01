export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

// 判断 set value 后 value 的值是否改变
export const hasChanged = (val, newValue) => {
  // Object.is 方法判断两个值是否为同一个值
  return !Object.is(val, newValue);
};
