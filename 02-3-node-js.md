Node.js 8 的新方法
========

Node.js 8 于5月底正式发布，带来了[很多新特性](https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V8.md#8.0.0)。其中，`util.promisify()`，尤其值得我们注意。

## `util.promisify()`

虽然 Promise 已经普及，但是 Node.js 里仍然有大量依赖回调的异步函数，如果我们把每个函数都封装一遍，那真是齁麻烦齁麻烦的，比齁还麻烦。

所以 Node.js 8 就提供了 `util.promisify()` ——“Promise 化”——这个方法，方便我们把原来的异步回调方法改成支持 Promise 的方法。接下来，想继续 `.then().then().then()` 搞队列，还是 Await 就看实际需要了。

我们看下官方范例，让读取目录文件状态的 `fs.stat` 支持 Promise：

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

## 结合 Await/Async 使用

同样是上面的例子，如果想要结合 Await/Async，可以这样使用：

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

## 自定义 Promise 化处理函数

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