'use strict';

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type, // type 就是 App
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

// render 函数 返回想要渲染的虚拟节点
function render(vnode, container) {
    // patch
    // 后续需要递归调用
    patch(vnode);
}
function patch(vnode, container) {
    // 去处理组件
    // 判断 是不是 element 类型
    // 是 element 那么就应该处理 element
    // processElement();
    processComponent(vnode);
}
function processComponent(vnode, container) {
    // 挂载 组件
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    // 组件本身有自己的一些属性，比如props，插槽，这样可以抽离出成对象来表示组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render(); // 也就是 return 出来的 h
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先把所有东西转换层 v-node ，后续所有逻辑操作 都会基于 vnode 做处理
            const vnode = createVNode(rootComponent);
            render(vnode);
        }, // 接收根容器， 后续把所有元素渲染出来以后添加到根容器里面
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
