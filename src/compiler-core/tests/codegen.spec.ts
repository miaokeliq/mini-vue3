import { baseParse } from "../src/parse";

import { generate } from "../src/codegen";
import { transform } from "../src/transform";
describe("codegen", () => {
  it.only("string", () => {
    const ast = baseParse("hi");

    transform(ast);
    const { code } = generate(ast);

    // 快照(string)测试: 给当前的code拍个照片，
    // 然后进行对比
    // 1. 抓bug
    // 2. 有意（更新快照）
    expect(code).toMatchSnapshot();
  });
});
