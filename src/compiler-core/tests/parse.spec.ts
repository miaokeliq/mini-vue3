import { baseParse } from "../src/parse";

// TDD
// 让单测赶快通过 称为 伪实现
//
//
//
describe("Parse", () => {
  describe("interpolation", () => {
    test("simple interpolation", () => {
      const ast = baseParse("{{message}}");

      // root
      expect(ast.children[0]).toStrictEqual({
        type: "interpolation",
        content: {
          type: "simple_expression",
          content: "message",
        },
      });
    });
  });
});
