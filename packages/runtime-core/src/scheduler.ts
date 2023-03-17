// 微任务 队列
const queue: any[] = [];
// 之前的 队列
const activePreFlushCbs: any[] = [];

let isFlushPending = false;
const p = Promise.resolve();
// 把函数的执行时间推到微任务里面  // 执行一个微任务，给你返回一个 Promise
export function nextTick(fn?) {
  return fn ? p.then(fn) : p;
}
// 每次加入一个job，都会创建一个 promise ，这是完全没有必要的，则通过 isFlushPending 来控制
export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush(); // 执行微任务队列
}

export function queuePreFlushCb(job) {
  activePreFlushCbs.push(job);

  //要调用这个函数，因为这个函数才会最终触发 flushJobs
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;

  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
  isFlushPending = false;

  // watchEffect 需要在组件渲染之前调用，所以就将 watchEffect 的调用逻辑放在这里，也就是组件渲染之前
  flushPreFlushCbs();

  // 这里是组件渲染之前
  // 组件渲染的时候是在 job 里面去执行的
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++) {
    activePreFlushCbs[i]();
  }
}

/**
*
*在上述代码中，isFlushPending 变量用来控制是否已经有一个 flush 微任务（即执行队列中的所有任务）正
在等待执行。如果当前已经有一个 flush 微任务在等待执行，那么就不需要再添加另一个 flush 微任务。

这是因为在 JavaScript 中，如果已经有一个微任务在等待执行，那么在当前微任务执行结束前添加的其他微任务会被放在队列的
末尾，等待下一次微任务循环执行。因此，为了避免不必要的微任务的创建和执行，我们可以使用 isFlushPending 
变量来控制是否已经有一个 flush 微任务在等待执行。
*
*
*
* */
