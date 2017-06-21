一起实战吧
========

学会新的异步操作之后，我们自然希望改造之前的异步回调代码。下面我就带领大家来试一试。

## 将回调包装成 Promise

这是最常见的应用。它有三个显而易见的好处：

1. 可读性更好
2. 返回的结果可以加入任何 Promise 队列
3. 可以使用 Async Functions

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

## 将任何异步操作包装成 Promise

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

// async functions
await doSomething();
if (await openConfirmPopup('确定么')) {
  // 继续处理
}
```

## Node.js 8 的新方法

Node.js 8 于今年5月底正式发布，带来了[很多新特性](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V8.md#8.0.0)。其中，`util.promisify()`，尤其值得我们注意。

为保证向下兼容，Node.js 里海量的异步回调函数自然都会保留，如果我们把每个函数都封装一遍，那真是齁麻烦齁麻烦，比齁还麻烦。

所以 Node.js 8 就提供了 `util.promisify()` ——“Promise 化”方法，方便我们把原来的异步回调方法瞬间改造成支持 Promise 的方法。接下来，想继续 `.then().then().then()` 搞队列，还是 Await 就看实际需要了。

> [Bluebird](http://bluebirdjs.com/) 也提供了类似的方法，不妨看下它的[文档](http://bluebirdjs.com/docs/features.html#promisification-on-steroids)。

我们看下官方范例。已知读取目录文件状态的 `fs.stat`，想得到支持 Promise 的版本，只需要这样做：

```javascript
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.')
  .then((stats) => {
    // Do something with `stats`
  })
  .catch((error) => {
    // Handle the error.
  });
```

怎么样，很简单吧？按照文档的说法，只要符合 Node.js 的回调风格，所有函数都可以这样转换。也就是说，只要满足下面两个条件，无论是不是原生方法，都可以：

1. 最后一个参数是回调函数
2. 回调函数的参数为 `(err, result)`，前面是可能的错误，后面是正常的结果

### 结合 Async Functions 使用

同样是上面的例子，如果想要结合 Async Functions，可以这样使用：

```javascript
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
async function readStats(dir) {
  try {
    let stats = await stat(dir);
    // Do something with `stats`
  } catch (err) { // Handle the error.
    console.log(err);
  }
}
readStats('.');
```

### 自定义 Promise 化处理函数

那如果现有的使用回调的函数不符合这个风格，还能用 `util.promisify()` 么？答案也是肯定的。我们只要给函数增加一个属性 `util.promisify.custom`，指定一个函数作为 Promise 化处理函数，即可。请看下面的代码：

```javascript
const util = require('util');

// 这就是要处理的使用回调的函数
function doSomething(foo, callback) {
  // ...
}

// 给它增加一个方法，用来在 Promise 化时调用
doSomething[util.promisify.custom] = function(foo) {
  // 自定义生成 Promise 的逻辑
  return getPromiseSomehow();
};

const promisified = util.promisify(doSomething);
console.log(promisified === doSomething[util.promisify.custom]);
// prints 'true'
```

如此一来，任何时候我们对目标函数 doSomething 进行 Promise 化处理，都会得到之前定义的函数。运行它，就会按照我们设计的特定逻辑返回 Promise 对象。

有了 `util.promisify`，升级异步回到函数，使用 Promise 或者 Async 真的方便了很多。