回顾
========

## Pormise

相较于传统的回调模式，Promise 有着巨大的进步，值得我们学习和使用。

### 优势

1. 可以很好地解决异步回调不好写、不好读的问题
2. 可以使用队列，并且在对象之间传递
3. 不引入新语言元素，大部分浏览器已经原生支持，可以放心使用；个别不支持的，也有完善的解决方案

### 不足

1. 引入了不少新概念、新写法，学习成本不低
2. 也会有嵌套，可能看起来还很复杂
3. 没有真正解决 `return/try/catch` 的问题

## Async Functions

异步函数是 ES2017 里非常有价值的新特性，可以极大的改善异步开发的环境。

除了覆盖率，几乎找不出什么黑点。

目前大部分主流浏览器都已经实现对它的支持，除了 IE 和 iOS 10.2。我们可以针对这两个系列的浏览器里进行降级，不过请注意，因为 Async Functions 引入了新的语法元素，所以必须用 Babel 编译的方式来处理。

## 一些小 Tips

这是我犯过的一些错误，希望成为大家前车之鉴。

* `.resolve()` `.reject()` 不会自动 `return`。
* Promise 里必须 `.resolve()` `.reject()` `throw err` 才会改变状态，`.then()` 不需要。
* `.resolve()` 只会返回一个值，返回多个值请用数组或对象。

## 参考阅读

* [MDN Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* [MDN Promise 中文](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)
* [阮一峰：ECMAScript 6 入门 - Promise 对象](http://es6.ruanyifeng.com/#docs/promise)
* [[翻译] We have a problem with promises](http://fex.baidu.com/blog/2015/07/we-have-a-problem-with-promises/)
* [MDN Generator](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Generator)
* [Async Function](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
* [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
* [让微信小程序支持 ES6 的 Promise 特性](https://haojen.github.io/2016/11/23/wechat-app-promise/)
* [util.promisify() in Node.js v8](http://farzicoder.com/util-promisify-in-Node-js-v8/)
* [util.promisify 官方文档](https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original)