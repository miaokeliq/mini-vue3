# effect & reactive

## happy path

从单测开始入手，以下是`effect`的单测场景：

```javascript
// reactivity 最核心的代码流程
it("happy path", () => {
  const user = reactive({
    age: 10,
  });
  let nextAge: any;
  effect(() => {
    nextAge = user.age + 1;
  });

  expect(nextAge).toBe(11);

  // update
  user.age++;
  // 当响应式的值发生改变了，effect包裹的里面的值也会更新
  expect(nextAge).toBe(12);
});
```

**流程**：

1. 以上单测中`user`是一个响应式对象，它有一个容器，容器里需要收集所有的依赖
   依赖通过`effect`收集，`effect`接收一个`fn`，一上来就会调用`fn`，当调用`fn`时会
   触发响应式对象`user.age`的`get`操作，这次响应式对象就可以在`get`操作里收集依赖，
   以上动作就称为**依赖收集**
2. 接下来当修改`user.age`的值时，会触发`set`操作，这时候就会把之前收集的所有`依赖`
   都拿出来调用一下，这就是**触发依赖**。

## reactive

首先先实现 reactive:  
单测就是 reactive 的核心逻辑：

```javascript
it("happy path", () => {
  const original = { foo: 1 };
  const observed = reactive(original);
  expect(observed).not.toBe(original);
  expect(observed.foo).toBe(1);
});
```

## effect

根据面向对象思想，将`effect`的概念抽出，将`effect`封装成一个类来进行表示，创建`ReactiveEffect`类
时就会调用`fn`,方法，于是创建一个`run()`方法，这个方法可以执行`fn`，所以就需要通过
构造函数把`fn`传进来，并且赋值给`_fn`属性
