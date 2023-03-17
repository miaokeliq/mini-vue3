# effect

## stop()

实现 stop()的时候，能阻止`obj.a = 1`这样的 set 操作，因为这时候依赖都已经被清空了，
但是有一种情况就会出问题，就是`obj.a++`的时候，因为这个操作实际上是`obj.a = obj.a + 1`,
右边有`obj.a`时，就会调用这个属性的`set`操作，又会重新收集依赖。

解决方案： 添加一个变量`shouldTrack`来决定是否收集依赖

## computed()

当依赖的响应式对象的值发生改变的时候，computed(getter())，中的 getter 调用两次，
因为 getter 是个 effect， 依赖的响应式对象的值发生改变的时候会触发依赖，这时调用
一次 getter，然后 computed 里 get 里的 getter 也调用了一次，这就调用两次。

解决方法： 给 getter 设置 scheduler，这样不会主动触发依赖，之后后续调用 computed.value
时才会触发 effect
