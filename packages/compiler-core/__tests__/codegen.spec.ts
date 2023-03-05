import { baseParse } from "../src/parse";

import { describe, it, expect } from "vitest";
import { generate } from "../src/codegen";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformElement } from "../src/transforms/transformElement";
import { transformText } from "../src/transforms/transformText";
describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");

    transform(ast);
    const { code } = generate(ast);

    // 快照(string)测试: 给当前的code拍个照片，
    // 然后进行对比
    // 1. 抓bug
    // 2. 有意（更新快照）
    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");

    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");

    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    });

    // console.log("ast--------", ast.codegenNode.children);
    const { code } = generate(ast);

    expect(code).toMatchSnapshot();
  });
});
