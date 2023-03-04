export function baseParse(content: string) {
  const context = createParserContext(content); // 创建一个全局上下文对象

  return createRoot(parseChildren(context));
}

function parseChildren(context) {
  const nodes: any = [];

  const node = parseInterpolation(context);

  nodes.push(node);
  return nodes;
}

// 解析插值
function parseInterpolation(context) {
  // {{message}}

  const closeIndex = context.source.indexOf("}}", 2); // 9
  context.source = context.source.slice(2); // context.source == message}}

  const rawContentLength = closeIndex - 2; // 7

  const content = context.source.slice(0, rawContentLength); // message
  // 解析完后就删除掉 ，继续往后面的字符串解析
  context.source = context.source.slice(rawContentLength + 2);
  return {
    type: "interpolation",
    content: {
      type: "simple_expression",
      content: content,
    },
  };
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
