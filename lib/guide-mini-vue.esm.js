const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        component: null,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // children
    if (typeof children === "string") {
        // 位运算
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */; // vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 + children object   这才是插槽
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    console.log(slot);
    if (slot) {
        //function
        //
        if (typeof slot === "function") {
            // children 是不可以有array
            // 只需要把 children 里面的所有节点渲染出来
            // console.log(slot(props));
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
// 判断 set value 后 value 的值是否改变
const hasChanged = (val, newValue) => {
    // Object.is 方法判断两个值是否为同一个值
    return !Object.is(val, newValue);
};
const isString = (value) => typeof value === "string";
const hasOwn = (val, key) => {
    return Object.prototype.hasOwnProperty.call(val, key);
};
// 转换为驼峰命名格式
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
// 将首字母变成大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// event 前面加上 "on"
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props, //  i 是组件实例对象
};
// App.js 中的 render 里面的 this 指向的是代理对象
const PublicInstanceProxyHandlers = {
    //  key 是 App.js 里的this.msg
    get({ _: instance }, key) {
        //setupState
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // attrs
}

function initSlots(instance, children) {
    // children object
    // instance.slots = Array.isArray(children) ? children : [children];
    // 检测是否需要 slot 的处理
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    // scheduler? 的问号表示 这个参数是可选的 public 这样就能让外界访问到
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 证明当前的 effect 是正在执行的状态
        // 1. 会收集依赖
        //    shouldTrack 来做区分
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        // active 参数能够避免性能问题，如果active = false，就不用再删除了，这样以后就不会多次删除
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// 依赖收集
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // 收集依赖的容器
    // target -> key -> dep
    // 先通过 target 获取 对应的依赖容器
    let depsMap = targetMap.get(target);
    // 初始化，如果depsMap没有的话
    if (!depsMap) {
        // 也是 Map  target.key -> value
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // 再通过key获取容器里对应这个key的依赖
    let dep = depsMap.get(key);
    // 如果容器里没有依赖dep，则创建一个
    if (!dep) {
        dep = new Set();
        // 保存创建的dep
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 将 fn,也就是正在触发的依赖 放入指定key的依赖的容器
    if (dep.has(activeEffect))
        return; // 避免重复收集
    dep.add(activeEffect);
    // 反向存储，以便读取
    activeEffect.deps.push(dep);
}
// 正在收集中的状态
//
// 就是判断是否有 收集到的依赖
function isTracking() {
    /* // 如果没有effect，就不用执行下面的操作，就修复了 reactive 的 happy path 单测
    if (!activeEffect) return;
    if (!shouldTrack) return; */
    return shouldTrack && activeEffect !== undefined;
}
// 基于 target 和 key 取出 dep 对象， 然后调用所有之前收集到的 fn,也就是依赖
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
// 抽离 调用所有的依赖的逻辑
function triggerEffects(dep) {
    // 调用所有的依赖
    for (let effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    // fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // options
    // extend
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

// 初始化的时候就创建 get，set 这样不用每次创建多个 get，set了，优化j
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        // 看看 res 是不是 object
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 因为readonly不会被set，也就不会触发依赖，所以也就不用再去收集依赖了,从而提高性能
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败 ， 因为 target 时readonly 的`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

function emit(instance, event, ...args) {
    console.log("emit", event);
    // instance.props -> event
    const { props } = instance;
    // TPP
    // 先去写一个特定的行为 ——》 重构成通用的行为
    //
    // add -> Add
    // add-foo -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

/**
 *    因为一般 ref 包裹的都是单值，比如： 1 true "1"
 *    问题就是怎么知道值被 get 或者被 set 了
 *    这样利用之前的 proxy 就不行了, 因为 proxy 只针对于对象，而包裹的是值类型
 *    解决方法： 通过对象进行包裹，也就是 RefImpl , 这个 类里面有 value 值，然后给类写 get set，这样就能知道什么时候触发 set 和 get ，就可以做依赖收集和触发依赖了
 *
 * */
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        // 如果传过来的是对象，需要把value转换成reactive包裹之后的结果，因为所有对象都需要reactive处理
        // 1. 看看 value 是不是 对象j
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 一定先去修改了 value 的值，再触发依赖
        // 判断是否set相同的值，如果相同就不触发依赖
        // hasChanged
        // 对比的时候 object , 如果 _value 是对象，则就对比被 reactive 之前的 值 -> _rawValue
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            // 触发依赖
            triggerEffects(this.dep);
        }
    }
}
// convert->转换j
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        // 做依赖收集的动作
        trackEffects(ref.dep);
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    // !!两个 感叹号就转换为 boolean
    return !!ref.__v_isRef;
}
function unRef(ref) {
    // 看看是不是 ref -> ref.value
    // 反之就直接 返回 refj
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    // 怎么能知道调用 get set  那就用proxyj
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 调用 get ，如果 age 是 ref ，那么就给他返回 .value
            // 如果不是 ref , 就直接返回值
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            // set -> 如果 ref 修改.value
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

function createComponentInstance(vnode, parent) {
    console.log("createComponentInstance", parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        next: null,
        isMounted: false,
        subTree: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // 初始化 props
    initProps(instance, instance.vnode.props);
    // 初始化 slots
    initSlots(instance, instance.vnode.children);
    // 调用 setup, 拿到对应的返回值 最终设置 render
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 先获取组件，然后获取里面的setup
    const Component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        //  可能返回function Object
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    //  TODO function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult); // 通过 proxyRefs 包裹可以直接使例如 this.name = name.value  就不用再 .value 了
    }
    // 需要保证组件的render有值
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        // 如果用户先写了 render 函数的话则优先级最高
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    // 存
    // getCurrentInstance 只能在 setup 中使用
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // init 初始化的时候才可以执行
        // 当自己的provides 等于 父级的 provides 时说明还没有更改过，则就把父级的provides更改为 自己 provides的原型，这样就不会产生 自己调用 provides时覆盖 父级 provides的问题,这样孩子调用inject时，如果父级没有想要的属性,则根据原型链上面搜索，直到找到想要的
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        // 如果 inject 有，就调父级的，如果没有，就给默认值j
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            // 判断设置默认的 inject 为函数，则调用后返回
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

//
//
//
function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先把所有东西转换层 v-node ，后续所有逻辑操作 都会基于 vnode 做处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }, // 接收根容器， 后续把所有元素渲染出来以后添加到根容器里面
        };
    };
}

// 微任务 队列
const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
// 把函数的执行时间推到微任务里面  // 执行一个微任务，给你返回一个 Promise
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
// 每次加入一个job，都会创建一个 promise ，这是完全没有必要的，则通过 isFlushPending 来控制
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush(); // 执行微任务队列
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    console.log(queue);
    while ((job = queue.shift())) {
        job && job();
    }
}
/**
*
*在上述代码中，isFlushPending 变量用来控制是否已经有一个 flush 微任务（即执行队列中的所有任务）正在等待执行。如果当前已经有一个 flush 微任务在等待执行，那么就不需要再添加另一个 flush 微任务。

这是因为在 JavaScript 中，如果已经有一个微任务在等待执行，那么在当前微任务执行结束前添加的其他微任务会被放在队列的末尾，等待下一次微任务循环执行。因此，为了避免不必要的微任务的创建和执行，我们可以使用 isFlushPending 变量来控制是否已经有一个 flush 微任务在等待执行。
*
*
*
* */

// 闭包
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    // render 函数 返回想要渲染的虚拟节点
    function render(vnode, container) {
        // patch
        // 后续需要递归调用
        patch(null, vnode, container, null, null);
    }
    // n1 -> 老的虚拟节点   n2 -> 新的虚拟节点
    // 如果 n1 不存在， 那就是初始化 ，否则就是更新
    function patch(n1, n2, container, parentComponent, anchor) {
        // 去处理组件
        // 判断 是不是 element 类型
        // 是 element 那么就应该处理 element
        // ShapeFlags 描述当前虚拟节点的类型
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                // Fragment -> 只渲染 children
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        //
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 分为 初始化 和 更新
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("patchElement");
        console.log("n1", n1);
        console.log("n2", n2);
        // 对比 props
        // 三种场景：
        // 1. 如果老的prop是 foo:foo 新的是 foo:new-foo , 也就是 foo 之前的值和现在的值不一样了，则修改
        // 2. 如果新的是 undefined || null，则删除
        // 3. 如果 foo 这个属性在新的里面没有了，则删除
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ; // 如果没有就设置为 {}
        const el = (n2.el = n1.el); // 下次更新时n2没有el, 这时就需要把 el 赋值给 n2 的, 这样下次更新时 n2就是 n1,这时就有 el 了
        // 对比 children
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        // 当前新的节点是 text
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 老的节点是 数组
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1. 把老的children 清空
                unmountChildern(n1.children);
            }
            if (c1 !== c2) {
                // 判断 text 变 text，同时也是 数组 变 text 的第二步
                // 2. 设置 text  , 其实也是一个渲染接口
                hostSetElementText(container, c2);
            }
        }
        else {
            // 肯定确认新的是数组了
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        // 设置 3 个指针
        let i = 0;
        let e1 = c1.length - 1; // 因为是索引从0开始， 所以要减1 ，  e1指向c1的最后一个元素
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            // type
            //  key
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // 判断 n1 和 n2 是否一样
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor); // 如果 n1 和 n2 一样，就递归地调用patch进行对比两个的孩子节点
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 3. 新的比老的多  需要创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null; // 判断是创建在左边还是右边，如果是右边就为null，因为null的话默认是添加到尾部
                while (i <= e2) {
                    // 可能要添加多个
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            //乱序的部分
            //中间对比
            //
            // --- 删除的逻辑--- //
            //
            // 其中的一个面试问题： key 有什么用？
            //                      有了key后在diff算法中新老节点对比时可以通过设置的key来建立key和节点的映射Map
            //                      有了这个map后就可以快速地通过key来查找新节点里存不存在老节点，不用再循环遍历，降低时间负责度从 O(n) 为 O(1)
            //
            //
            //
            let s1 = i; // 标识老节点开始部分
            let s2 = i;
            // 总共需要 patch 的节点数量
            const toBePatched = e2 - s2 + 1; // 新节点需要patch 的数量
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0; //目前记录的最大值
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0; // 初始化，0代表还没建立映射关系
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i]; // 拿到当前节点
                // 如果新节点patch完后老节点还剩得有没patch 的，就可以把没patch的老节点都删除掉
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 只要不等于 null 和 undefined ，就说明之前的child有key，就可以用key做对比
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果没有 key，就只有遍历
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            // 判断两个节点是否相等
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 说明当前节点在新的节点里面不存在
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    //  - s2 的作用是把索引归为0
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; // + 1 是避免最后i为0的问题，因为之前初始化把map都为0是表示映射不存在，如果还为0就表示需要新建节点，+1就能避免这个问题
                    patch(prevChild, c2[newIndex], container, parentComponent, null); // 如果节点存在，就对比孩子节点
                    patched++; // patch 完一个说明处理完一个新的节点，则用 patched 记录加1
                }
            }
            // --- 删除的逻辑--- //
            // --- 移动的逻辑--- //
            // 涉及 最长递增子序列的 概念  ，要理解最长递增子序列在 diff 算法里做了哪些事
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 求出当前要处理的节点
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 中间对比，在老的里面不存在，新的里面存在
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--; // 不需要去移动
                    }
                }
            }
            // --- 移动的逻辑 --- //
        }
    }
    function unmountChildern(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el; // 先拿到真实的dom元素
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 不一样才对比， �样的话就不用对比了
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 场景三
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 给 el.textContent = 'hi mini-vue'
        //
        // el.setAttribute("id", "root")
        //
        // document.body.append(el)
        // string array
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (let key in props) {
            let val = props[key];
            hostPatchProp(el, key, null, val); // 初始化的时候没有之前的值，可以给 null
        }
        // container.append(el);
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        // vnode
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 挂载 组件
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            // 通过检测组件的 props  是否改变来判断是否需要更新
            instance.next = n2; // next 表示下次要更新的虚拟节点
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 创建组件实例
        // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // element 更新流程
        // 利用 effect 做依赖收集，来包裹当前的render函数
        // 当调用 instance.render 时会触发依赖收集, 触发响应式对象的get ，当响应式对象值改变，会触发这里的依赖
        // 然后再次调用render函数，生成全新的 subTree
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log("init");
                // 取出代理对象
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy, proxy)); // 也就是 return 出来的 h  // subTree 就是虚拟节点树 // instance.subTree 作用是把subTree保存下来
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // 在所有的element都处理完成了
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log("update");
                // 更新组件的 props
                // 需要一个更新完成之后的 vnode
                const { next, vnode } = instance; // vnode 指向的是更新之前的虚拟节点 // next 是下次要更新的虚拟节点
                if (next) {
                    next.el = vnode.el; // 更新 el
                    // 更新组件的属性
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy); // 获取当前的subTree
                const prevSubTree = instance.subTree; // 获取之前的subTree
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log("update - scheduler");
                // 防止每次同步任务时都要更新一次， 则使用事件循环机制将 update 放在微任务里
                // 视图更新就从同步任务变成了异步任务
                queueJobs(instance.update);
            },
        });
    }
    return {
        createApp: createAppApi(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preVal, nextVal) {
    // 正则表达式
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
// anchor, 锚点，指定添加到元素的哪个位置
function insert(child, parent, anchor) {
    // parent.append(el);
    parent.insertBefore(child, anchor || null); // 指定child添加到anchor的前面，如果 anchor为空，则默认添加到后面
}
// 删除子节点
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        // 如果有 父节点 就调用 父节点的dom api 删除
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

// 只负责根据 ast 生成代码
function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    // 处理函数导入逻辑
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    push(`function ${functionName}(${signature}){`);
    push(`return `);
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code,
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBining = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(", ")}} = ${VueBining}`);
    }
    push("\n");
    push("return ");
}
function createCodegenContext() {
    const context = {
        code: "",
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
    // text
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    console.log(children);
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context);
    push(")");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
function genNullable(args) {
    return args.map((arg) => arg || "null");
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(")");
}

function baseParse(content) {
    const context = createParserContext(content); // 创建一个全局上下文对象
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (s.startsWith("{{")) {
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
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
function parseText(context) {
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
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 2. 推进
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    // 一.需要判断当什么情况下需要当成 element 解析
    // 二.通过正则把tag拿出来
    // 三.把所有处理完的代码删除掉
    // 1. 解析 tag
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        // 判断开始标签跟结束标签是否相等
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2. 删除处理完成的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
// 解析插值
function parseInterpolation(context) {
    // {{message}}
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length); // 9
    advanceBy(context, openDelimiter.length);
    const rawContentLength = closeIndex - openDelimiter.length; // 7
    const rawContent = parseTextData(context, rawContentLength); // message
    // 去除空格 避免 {{ message }} 的情况
    const content = rawContent.trim();
    // 解析完后就删除掉 ，继续往后面的字符串解析
    advanceBy(context, closeDelimiter.length);
    // 把处理完的string 变成一个对象
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        },
    };
    // 把所有的string处理完后就会形成一个树， ast 抽象语法树
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

/*
 *  我们的 transform 就是需要把 ast 树做增删改查，方便我们去生成最终的代码
 *  全部是服务于codegen模块的
 *
 *
 *
 * **/
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先搜索
    traverseNode(root, context);
    createRootCodegen(root);
    // ast 生成代码时需要使用来判断不同类型需要导入 Vue 的什么函数
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context); // element 和 root 才有children
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

// 将相邻的 文字节点 和 插值节点 组合成一个 复合节点，复合节点的 content就为 文字+插值
// // 例如： hi，       {{message}}   变成   hi,+{{message}}
function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
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
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            // 删除了该节点后面的节点就会补上来，这时就需要修复 j 指针的指向
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// mini-vue 出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
