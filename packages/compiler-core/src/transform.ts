import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

/*
 *  我们的 transform 就是需要把 ast 树做增删改查，方便我们去生成最终的代码
 *  全部是服务于codegen模块的
 *
 *
 *
 * **/

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);

  // 1. 遍历 - 深度优先搜索
  traverseNode(root, context);

  createRootCodegen(root);

  // ast 生成代码时需要使用来判断不同类型需要导入 Vue 的什么函数
  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
  const child = root.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = root.children[0];
  }
}

function createTransformContext(root: any, options: any): any {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };

  return context;
}

function traverseNode(node: any, context) {
  const nodeTransforms = context.nodeTransforms;
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    const onExit = transform(node, context);
    if (onExit) exitFns.push(onExit);
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context); // element 和 root 才有children
      break;
    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node: any, context: any) {
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    traverseNode(node, context);
  }
}
