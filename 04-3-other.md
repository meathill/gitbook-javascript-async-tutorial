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