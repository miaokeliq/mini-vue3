# mini-vue3

剔除了Vue3源码中的大多数边际case，实现vue3的核心逻辑。

附带项目学习笔记，配合笔记实用更佳，如有疑问可以在相关issues下进行提问。

# 实现模块
## runtime-core
- [x] 支持组件类型
- [x] 支持 element 类型
- [x] 初始化 props
- [x] setup 可获取 props 和 context
- [x] 支持 component emit
- [x] 支持 proxy
- [x] 可以在 render 函数中获取 setup 返回的对象
- [x] nextTick 的实现
- [x] 支持 getCurrentInstance
- [x] 支持 provide/inject
- [x] 支持最基础的 slots
- [x] 支持 Text 类型节点
- [x] 支持 $el api
- [x] 支持 watchEffect

## reactivity
目标是用自己的 reactivity 支持现有的 demo 运行
- [x] [reactive 的实现](https://github.com/miaokeliq/mini-vue3/issues/1)
- [x] [ref 的实现](https://github.com/miaokeliq/mini-vue3/issues/3)
- [x] readonly 的实现
- [x] computed 的实现
- [x] track 依赖收集
- [x] trigger 触发依赖
- [x] [支持 isReactive](https://github.com/miaokeliq/mini-vue3/issues/2)
- [x] 支持嵌套 reactive
- [x] 支持 toRaw
- [x] 支持 effect.scheduler
- [x] 支持 effect.stop
- [x] [支持 isReadonly](https://github.com/miaokeliq/mini-vue3/issues/2)
- [x] 支持 isProxy
- [x] 支持 shallowReadonly
- [x] 支持 proxyRefs

## compiler-core
- [x] 解析插值
- [x] 解析 element
- [x] 解析 text
## runtime-dom
- [x] 支持 custom renderer
## runtime-test
- [x] 支持测试 runtime-core 的逻辑

## infrastructure
- [x] support monorepo with pnpm

# build
```
pnpm build
```


# example
通过 server 的方式打开 packages/vue/example/* 下的 index.html 即可

 推荐使用 Live Server

