'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    //  key 是 App.js 里的this.msg
    get({ _: instance }, key) {
        //setupState
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null,
    };
    return component;
}
function setupComponent(instance) {
    // 初始化 propsj
    // initProps()
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
        const setupResult = setup();
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

const isObject = (val) => {
    return val !== null && typeof val === "object";
};

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
    if (typeof vnode.type === "string") {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
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
    const { children } = vnode;
    if (typeof children === "string") {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (let key in props) {
        let val = props[key];
        el.setAttribute(key, val);
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
function mountComponent(vnode, container) {
    // 创建组件实例
    // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    // 取出代理对象
    const { proxy } = instance;
    const subTree = instance.render.call(proxy); // 也就是 return 出来的 h
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 在所有的element都处理完成了
    vnode.el = subTree.el;
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
