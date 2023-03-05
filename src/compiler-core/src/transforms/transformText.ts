import { NodeTypes } from "../ast";
import { isText } from "../utils";
// 将相邻的 文字节点 和 插值节点 组合成一个 复合节点，复合节点的 content就为 文字+插值
// // 例如： hi，       {{message}}   变成   hi,+{{message}}
export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;

      let currentContainer;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        // 判断是否时 文字 或者 插值 节点，如果是，就可以判断相邻孩子是不是
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                // 收集
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(" + ");
              currentContainer.children.push(next);
              children.splice(j, 1);
              // 删除了该节点后面的节点就会补上来，这时就需要修复 j 指针的指向
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
