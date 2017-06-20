一起实战吧
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

// promise.js
const fs = require('./FileSystem');

fs.readFile('../README.md', 'utf-8')
  .then(content => {
    console.log(content);
  });

// async.js
const fs = require('.FileSystem');

async function read(path) {
  let content = await fs.readFile(path);
  console.log(content);
}
read();
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

