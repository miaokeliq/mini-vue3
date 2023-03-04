import { NodeTypes } from "./ast";
export function baseParse(content: string) {
  const context = createParserContext(content); // 创建一个全局上下文对象

  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];

  let node;
  if (context.source.startsWith("{{")) {
    node = parseInterpolation(context);
  }

  nodes.push(node);
  return nodes;
}

// 解析插值
function parseInterpolation(context) {
  // {{message}}

  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  ); // 9

  advanceBy(context, openDelimiter.length);

  const rawContentLength = closeIndex - openDelimiter.length; // 7

  const rawContent = context.source.slice(0, rawContentLength); // message
  // 去除空格 避免 {{ message }} 的情况
  const content = rawContent.trim();

  // 解析完后就删除掉 ，继续往后面的字符串解析

  advanceBy(context, rawContentLength + closeDelimiter.length);

  // 把处理完的string 变成一个对象
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
  // 把所有的string处理完后就会形成一个树， ast 抽象语法树
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}
function createParserContext(content: string): any {
  return {
    source: content,
  };
}
