import { getCurrentInstance } from "./component";

export function provide(key, value) {
  // 存
  // getCurrentInstance 只能在 setup 中使用
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    let { provides } = currentInstance;

    const parentProvides = currentInstance.parent.provides;

    // init 初始化的时候才可以执行
    // 当自己的provides 等于 父级的 provides 时说明还没有更改过，则就把父级的provides更改为 自己 provides的原型，这样就不会产生 自己调用 provides时覆盖 父级 provides的问题,这样孩子调用inject时，如果父级没有想要的属性,则根据原型链上面搜索，直到找到想要的
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;

    // 如果 inject 有，就调父级的，如果没有，就给默认值j
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      // 判断设置默认的 inject 为函数，则调用后返回
      if (typeof defaultValue === "function") {
        return defaultValue();
      }
      return defaultValue;
    }
  }
}
