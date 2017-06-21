在小程序中使用 Promise
========

国内开发者尤其是前端，肯定不能避开“小程序”这个话题。

从[小程序 API 文档](https://mp.weixin.qq.com/debug/wxadoc/dev/api/)可以看出，大部分交互都要藉由异步回调来完成（我猜测这多半是跟原生应用交互导致的）。所以自然而然的，我也想用更好的方式去操作。

因为客户端的 WebView 中不支持原生 Promise，所以“微信 Web 开发工具”中也移除了对 Promise 的支持，需要我们自己处理。

好在正如之前所说，Promise 不需要引入新的语言元素，兼容性上佳，所以我们只要引用成熟的 Promise 类库就好。这里我选择 [Bluebird](http://bluebirdjs.com/)。

## 安装

```bash
cd /path/to/my-xcx
npm install bluebird --save-dev
```

这样会把 Bluebird 安装在小程序目录的 `node_modules` 里。因为小程序并不支持从中加载，所以我们需要手工把 `node_modules/bluebird/browser/bluebird.js` 复制出来，放到小程序的 `utils` 目录内。

## 使用

使用时只需要 `import Promise from './utils/bluebird';`，就可以在开发环境中自由使用 `new Promise()` 了。这里拿 `wx.login` 作为例子：

```javascript
import Promise from './utils/bluebird';

return new Promise(resolve => {
  wx.login({
    success(result) {
      resolve(result);
    }
  });
})
  .then(result => {
    console.log(result);
  });
```

## 注意事项

经过我的实际测试，在小程序里抛出错误并不会被 `.catch()` 捕获，而是直接进入全局错误处理。所以在小程序开发中，我们需要放弃前面说的，尽量抛出错误的做法，转用 `reject()`。

```javascript
// 不要这样做！
new Promise( resolve => {
  wx.checkSession({
    success() {
      resolve();
    },
    fail() {
      throw new Error('Weixin session expired');
    }
  });
});

// 推荐这样做
new Promise( (resolve, reject) => {
  wx.checkSession({
    success() {
      resolve();
    },
    fail() {
      reject('Weixin session expired');
    }
  });
});
```

## Async Functions

“微信 Web 开发者工具”里面集成了 Babel 转译工具，可以将 ES6 编译成 ES5，不过 Async Functions 就不支持了。此时我们可以选择自行编译，或者只使用 Promise。

自行编译时，请注意，小程序页面没有 `<script>`，只能引用同名 `.js`，所以要留神输出的文件名。这里建议把 JS 写在另一个文件夹，然后用 Babel 转译，把最终文件写过来。

```bash
babel /path/to/my-xcx-src -d /path/to/my-xcx --source-map --watch
```