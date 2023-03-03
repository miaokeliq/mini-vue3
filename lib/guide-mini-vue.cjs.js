'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
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
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
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
};
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

// 依赖收集
const targetMap = new Map();
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

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // 初始化 propsj
    initProps(instance, instance.vnode.props);
    // 初始化 slotsj
    // initSlots()
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
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    //  TODO function
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    // 需要保证组件的render有值
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

// render 函数 返回想要渲染的虚拟节点
function render(vnode, container) {
    // patch
    // 后续需要递归调用
    patch(vnode, container);
}
function patch(vnode, container) {
    // 去处理组件
    // 判断 是不是 element 类型
    // 是 element 那么就应该处理 element
    // ShapeFlags 描述当前虚拟节点的类型
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    // 分为 初始化 和 更新
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
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
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
        let val = props[key];
        // 正则表达式
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    // vnode
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    // 挂载 组件
    mountComponent(vnode, container);
}
function mountComponent(initialVNode, container) {
    // 创建组件实例
    // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    // 取出代理对象
    const { proxy } = instance;
    const subTree = instance.render.call(proxy); // 也就是 return 出来的 h
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 在所有的element都处理完成了
    initialVNode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先把所有东西转换层 v-node ，后续所有逻辑操作 都会基于 vnode 做处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        }, // 接收根容器， 后续把所有元素渲染出来以后添加到根容器里面
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
