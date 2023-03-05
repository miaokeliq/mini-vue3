import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";

// 只负责根据 ast 生成代码
export function generate(ast) {
  const context = createCodegenContext();
  const { push } = context;

  // 处理函数导入逻辑
  genFunctionPreamble(ast, context);
  const functionName = "render";

  const args = ["_ctx", "_cache"];

  const signature = args.join(",");

  push(`function ${functionName}(${signature}){`);

  push(`return `);

  genNode(ast.codegenNode, context);

  push("}");
  return {
    code: context.code,
  };
}

function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBining = "Vue";

  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(", ")}} = ${VueBining}`);
  }
  push("\n");
  push("return ");
}

function createCodegenContext(): any {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };

  return context;
}

function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
    default:
      break;
  }

  // text
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}")`);
}

function genExpression(node, context) {
  const { push } = context;
  push(`${node.content}`);
}

function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  const { push, helper } = context;

  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(")");
}
