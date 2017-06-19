改进老代码
========

学会新的异步操作之后，我们自然希望改造之前的异步回调代码。下面我就带领大家来试一试。

## 将回调包装成 Promise

这是最常见的应用。它有两个显而易见的好处：

1. 可读性更好
2. 返回的结果可以加入任何 Promise 队列
3. 可以使用 Await/Async

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

