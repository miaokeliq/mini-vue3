import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, preVal, nextVal) {
  // 正则表达式
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextVal);
  } else {
    if (nextVal === undefined || nextVal === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextVal);
    }
  }
}

// anchor, 锚点，指定添加到元素的哪个位置
function insert(child, parent, anchor) {
  // parent.append(el);
  parent.insertBefore(child, anchor || null); // 指定child添加到anchor的前面，如果 anchor为空，则默认添加到后面
}

// 删除子节点
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    // 如果有 父节点 就调用 父节点的dom api 删除
    parent.removeChild(child);
  }
}

function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";
