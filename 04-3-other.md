其它场景
========

现在越来越多的库与框架都开始返回 Promise 对象，这里暂列一二。

## Fetch API

Fetch API 是 XMLHttpRequest 的现代化替代方案，它更强大，也更友好。它直接返回一个 Promise 实例，并分两步返回结果。

第一次返回的 `response` 包含了请求的状态，接下来可以调用 `response.json()` 生成新的 Promise 对象，它会在加载完成后返回结果。

```javascript
fetch('some.json')
  .then( response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(response.statusText);
  })
  .then( json => {
    // do something with the json
  })
  .catch( err => {
    console.log(err);
  });
```

除了 `response.json()` 之外，它还有 `.blob()`，`.text()` 等方法，具体可以参考 [MDN 上的文档](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)。

它的浏览器覆盖率请看[这里](http://caniuse.com/#search=fetch)，值得注意的是，iOS 10.2 还不支持，所以现在必须提供兼容方案。

## Gulp

我们知道，gulp 为了提速，默认采用并发异步的方式执行任务。如果一定要顺序执行，有三个方式：

1. 任务完成后调用参数 callback
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

## H5

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

这个函数会根据元素的样式判定是使用 `transition` 动画还是 `animation` 动画，然后侦听相应事件，在事件结束后，`resovle`。

使用的时候，可以先把写好的动画样式绑上去，然后侦听，比如下面：

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