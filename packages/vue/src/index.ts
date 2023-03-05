// mini-vue 出口

export * from "@guide-mini-vue/runtime-dom";

import { baseCompile } from "@guide-mini-vue/compiler-core";
import * as runtimeDom from "@guide-mini-vue/runtime-dom";
import { registerRuntimeCompiler } from "@guide-mini-vue/runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  // 把编译好的render函数给到它，把运行时对象传给它
  const render = new Function("Vue", code)(runtimeDom);

  return render;
}

// 将 runtime 模块 和 compiler 模块进行解耦，通过该函数来进行注入
registerRuntimeCompiler(compileToFunction);
