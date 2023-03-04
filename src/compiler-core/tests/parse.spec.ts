import { baseParse } from "../src/parse";
import { NodeTypes } from "../src/ast";
// TDD
// 让单测赶快通过 称为 伪实现
//
//
//
describe("Parse", () => {
  describe("interpolation", () => {
    it("simple interpolation", () => {
      const ast = baseParse("{{message}}");

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("element ", () => {
    it("simple element div", () => {
      const ast = baseParse("<div></div>");

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
      });
    });
  });
});
