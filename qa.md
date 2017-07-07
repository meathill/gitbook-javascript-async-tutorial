2017-07-05 GitChat 答疑交流
========

## 1. 异步函数在 gulp 里的应用？

**答：**

我们知道，gulp 在需要顺序执行的时候，有三个方式：

1. 调用 callback
2. 返回一个 stream 或者 vinyl file
3. 返回一个 Promise 对象

所以这个时候，应用异步函数再合适不过

```javascript
gulp.task('task', async () => {
  let readFile = util.promisify(fs.readFile);
  let content = await readFile('sfbj.txt');
  content = content.replace('old', 'new');
  return content;
});
```

## 2. 异步函数在 H5 项目中的应用？

**答：**

H5 项目中，动画的比重很大，有些动画有顺序要求，这个时候，用 Promise 来处理就非常合适。

这里提供一个我写的函数供大家参考：

```javascript
function isTransition(dom) {
  let style = getComputedStyle(dom).getPropertyValue('transition');
  return style !== 'all 0s ease 0s';
}

export function next(dom) {
  let eventName = isTransition(dom) ? 'transitionend' : 'animationend';
  return new Promise(resolve => {
    dom.addEventListener(eventName, function handler(event) {
      dom.removeEventListener(eventName, handler);
      resolve(event);
    }, false);
  });
}
```

这个函数会根据元素的样式判定是使用 `transition` 动画还是 `animation` 动画，然后侦听响应事件，在事件结束后，执行下一步。

使用的时候，可以先把写好的动画样式绑上去，然后侦听：

```javascript
this.actions = next(loading)
  .then(() => {
    el.classList.remove('enter');
  })
  .then(() => {
    wukong.classList.add('in');
    wukong.style.transform = 'translate3d(0,0,0)';
    return next(wukong);
  })
  .then(() => {
    let bufu = this.queue.getResult('bufu');
    bufu.className = 'bufu fadeInUp animated';
    el.appendChild(bufu);
    return next(bufu);
  })
  .then(() => {
    let faxing = this.queue.getResult('faxing');
    faxing.className = 'faxing fadeInUp animated';
    el.appendChild(faxing);
    return next(faxing);
  })
  .then(() => {
    let bg = this.queue.getResult('homepage');
    bg.className = 'bg fadeIn animated';
    el.insertBefore(bg, el.firstChild);
    return next(bg);
  });
```

在这种场景，使用 Promise 会比使用异步函数更方便维护。

## 3. promise有什么缺陷，await是怎么解决的？

**答：**

Promise 的特性之一，便是：不增加新的语言元素，在现有语言框架下解决问题。

所以，Promise 只能解决代码不好阅读，不易维护的问题，面对语言本身的问题，它也无能为力。

这个问题，就是异步回调在执行的时候，会切断前后栈的联系。

在文章的第一章，第二小节，对这个问题有很具体的描述。

(摘原文)

异步函数（await/async）是新的语法，改变了运行时，所以可以继续检索堆栈，完全不会有这方面的问题。

## 4. 异步编程在前后端分离的场景下，主要有哪些作用？前后端分离下的API该如何管理才合理？

这个问题我有点懵，在我看来，尤其是前后端分离的场景，几乎都必须要用异步编程来处理，Promise 和异步函数在这里都能发挥巨大的作用。

比如，一个后台，用户打开后，应该判断用户的登录状态，然后取用户的设置、用户的消息、用户的代办事项等，写成伪代码就是：

```javascript
let user = new User();
async function onLoad() {
  let info = await checkUserStatus();
  if (info) {
    user.info = info;
  } else {
    router.go('/login');
    user.info = await login();
  }
  user.settings = await getUserSettings();
  user.messages = await getUserMessages();
  user.todos = await getUserTodos();
  ....
}

onLoad();
```

## 5. 有了Async还有无必要学习Generator？

坦白说，我认为，没有。我还没遇到非用 Generator 才能解决的问题，也没有遇到过用 generator 能解决的更漂亮的问题

如果你现在时间比较紧张，我建议先从 Promise -> 异步函数学起。将来有时间再学不迟。

## 6. 初始化数据库时, 需要队列来保证代码按照步骤执行, 期间也需要捕获错误, 请问老师, 这个场景Async还是Promise较好呢？

这个问题我觉得比较好，哈哈。

不过回答这个问题比较困难，还是要看场景。我们不妨再对比一下 Promise 和异步函数的优劣（第3章第二节）：

Promise 的优势：**身为队列，可以向任何地方传递。**

异步函数的优势：**好写好读，方便调试。**

所以我认为这里是，如果你会有后续操作，比如在建立数据库连接的时候允许用户操作，那么 Promise 队列可能更合适，因为你可以把用户操作追加在队列后面，很方便，不需要你管理连接的状态；否则的话，可能异步函数更合适，少写就是力量。

## 7. （问题3）请问老师，这里的“启用一个新栈”，可以理解为eventloop么？JS引擎返回的回调函数的结果，不会push到原程序运行的栈内么？

很好的问题，切中本质。

首先，不能理解成 eventloop，eventloop 其实是方便用户操作设计的，它是“等待消息，处理消息”两者的循环往复，和 Node.js 里的时间回调有很大不同。后者更接近的模型是 jQuery 的 jsonp。我们要把 Node.js 看成两部分：V8 和其它，所以这里的异步回调是把回调函数的引用丢给 V8，然后“其它”完成操作后，要求 V8 调用之前注册的回调函数。

然后我们又要回归栈的本质：先进后出。比如下面这段代码：

```javascript
function b() {
  doAsync(); // 异步函数
  let abc = 123;
  return abc;
}
function a() {
  b();
  return 123;
}
a();
```

如果我们要保证异步的执行，即 `let abc = 123` 及之后的执行，就必须正常让函数 `doAsync` 出栈，然后 `b` 出栈，然后 `a` 出栈。所以回调函数的结果，是很难直接 push 到原先的栈中的。

当然现在问题解决了，不过我没有去看里面的实现，将来有机会看了再分享一次。