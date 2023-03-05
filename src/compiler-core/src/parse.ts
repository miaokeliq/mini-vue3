import { NodeTypes } from "./ast";

/**
 *  理解有限状态机的定义
 *  以及有限状态机的图怎么表示,要会画图
 *  还有就是规范
 *
 *
 * */
const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content); // 创建一个全局上下文对象

  return createRoot(parseChildren(context, []));
}

function parseChildren(context, ancestors) {
  const nodes: any = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;
    if (s.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      if (/[a-z]/i.test(s[1])) {
        // 判断 < 符号后第一个字母是否是 a-z，如果是，则是 element类型
        node = parseElement(context, ancestors);
      }
    }
    //
    // 如果 node 没有值，就默认当成 text 来解析
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  const s = context.source;

  // </div>
  if (s.startsWith("</")) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s, tag)) {
        return true;
      }
    }
  }

  // 2. 当遇到结束标签的时候
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true;
  // }
  // 1. source 有值的时候
  return !s;
}

function parseText(context: any) {
  let endIndex = context.source.length;
  let endTokens = ["<", "{{"];

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1 && endIndex > index) {
      // 判断 是否 有 {{ 也就是插值
      endIndex = index;
    }
  }

  // 1. 获取当前 content
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context, length) {
  const content = context.source.slice(0, length);

  // 2. 推进
  advanceBy(context, length);
  return content;
}

function parseElement(context: any, ancestors) {
  // 一.需要判断当什么情况下需要当成 element 解析
  // 二.通过正则把tag拿出来
  // 三.把所有处理完的代码删除掉

  // 1. 解析 tag
  const element: any = parseTag(context, TagType.Start);

  ancestors.push(element);
  element.children = parseChildren(context, ancestors);

  ancestors.pop();
  if (startsWithEndTagOpen(context.source, element.tag)) {
    // 判断开始标签跟结束标签是否相等
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签:${element.tag}`);
  }

  return element;
}

function startsWithEndTagOpen(source, tag) {
  return (
    source.startsWith("</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];

  // 2. 删除处理完成的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
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

  const rawContent = parseTextData(context, rawContentLength); // message
  // 去除空格 避免 {{ message }} 的情况
  const content = rawContent.trim();

  // 解析完后就删除掉 ，继续往后面的字符串解析

  advanceBy(context, closeDelimiter.length);

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
    type: NodeTypes.ROOT,
  };
}
function createParserContext(content: string): any {
  return {
    source: content,
  };
}
