改进老代码
========

学会新的异步操作之后，我们自然希望改造之前的异步回调代码。下面我就带领大家来试一试。

## 将回调包装成 Promise

这是最常见的应用。它有两个显而易见的好处：

1. 可读性更好
2. 返回的结果可以加入任何 Promise 队列
3. 可以使用 Await/Async

我们就拿读取文件来举个例子。

```javascript
// FileSystem.js
const fs = require('fs');

module.exports = {
  readFile: function (path, options) {
    return new Promise( resolve => {
      fs.readFile(path, options, (err, content) => {
        if (err) {
          throw err;
        }
        resolve(content);
      });
    });
  }
};

// a.js
const fs = require('./FileSystem');

fs.readFile('../README.md', 'utf-8')
  .then(content => {
    console.log(content);
  });
```

## 将任何异步操作都包装成 Promise

不止回调，其实我们可以把任意异步操作都包装城 Promise。我们假设需求：

1. 弹出确认窗口，用户点击确认再继续，点击取消就中断
2. 由于样式的关系，不能使用 `window.confirm()`

之前我们的处理方式通常是：

```javascript
something.on('done', function () { // 先做一些处理
  popup = openConfirmPopup('确定么'); // 弹出确认窗口
  popup.on('confirm', function goOn () { // 用户确认后继续处理
    // 继续处理
  });
});
```

如今，借助 Promise 的力量，我们可以把弹窗封装成 Promise，然后就可以将其融入队列，或者简单的使用 Async 等待操作完成。

```javascript
function openConfirmPopup(msg) {
  let popup = createPopup(msg);
  return new Promise( (resolve, reject) => {
    popup.confirmButton.onclick = resolve;
    popup.cancelButton.onclick = reject;
  });
}

// pure promise
doSomething()
  .then(() => {
    return openConfirmPopup('确定么')
  })
  .then( () => {
    // 继续处理
  });

// async/await
await doSomething();
if (await openConfirmPopup('确定么')) {
  // 继续处理
}
```

## jQuery

jQuery 已经实现了 Promise，不过名字不太一样，叫 [Deferred 对象](http://api.jquery.com/category/deferred-object/)。实现也不太一样，因为 jQuery 1.5 之后就开始这方面的尝试，所以和最终规范肯定有出入。不过 [3.0](http://blog.meathill.com/tech/js/jquery/jquery-3-0-beta-released.html) 之后，它就完全遵守规范，并且也通过了测试。所以如果使用新版本，我们大可以按照之前的教程来操作，只是 jQuery 需要使用工厂方法来创建 Promise 实例，与规范略有区别：

```javascript
$.deferred(function (resolve) {
  // 执行异步操作吧
})
  .then( response => {
    // 继续下一步
  });
```

另外，jQuery 的 [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR) 对象也是 Promise 对象，所以完全可以用 `.then()` 方法操作：

```javascript
$.ajax(url, {
  dataType: 'json'
})
  .then(json => {
    // 做后续操作
  });
```

## IE

遗憾的是，除了 Edge 版本，IE 都不支持原生的 Promise。但好在 Promise 不需要新的语言元素，所以我们完全可以用独立类库来补足。这里推荐 [Q](https://github.com/kriskowal/q) 和 [Bluebird](http://bluebirdjs.com/)，因为它们都完全兼容最新的规范，也就是可以完全使用之前介绍的方法。

当然如果你不是非要 `new Promise()` 不可，用 jQuery 也完全可以。