降级
========

## IE

遗憾的是，除了 Edge 版本，IE 都不支持原生 Promise（更不要提异步函数了）。不过好在 Promise 不需要新的语言元素，所以我们完全可以用独立类库来补足。这里推荐 [Q](https://github.com/kriskowal/q) 和 [Bluebird](http://bluebirdjs.com/)，它们都完全兼容 ES 规范，也就是说，前面介绍的用法都能奏效。

当然如果你不是非要 `new Promise()` 不可，用 jQuery 也完全可以。

## jQuery

jQuery 早在 1.5 版本就开始这方面的探索，不过它起的名字不太一样，叫 [Deferred 对象](http://api.jquery.com/category/deferred-object/)。实现也不太一样，有一些特殊的 API，比如 [.done()](http://api.jquery.com/deferred.done/)。不过升级到 [3.0](http://blog.meathill.com/tech/js/jquery/jquery-3-0-beta-released.html) 之后，jQuery 就完全兼容 ES2015 的 Promise 规范，并且通过了相关测试。所以如果使用新版本，我们大可以按照前面的教程来操作，只是 jQuery 需要使用工厂方法来创建 Promise 实例，与标准做法略有区别：

```javascript
$.deferred(function (resolve) {
  // 执行异步操作吧
})
  .then( response => {
    // 继续下一步
  });
```

至于那些独有 API，我们当它们不存在就好了。另外，jQuery 的 [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR) 也是 Promise 对象，所以完全可以用 `.then()` 方法操作：

```javascript
$.ajax(url, {
  dataType: 'json'
})
  .then(json => {
    // 做后续操作
  });
```

## 异步函数

异步函数因为引入了新的语法元素，要想在比较古老的浏览器里使用，必须用 Babel 进行转译。

转译的时候我们需要考虑目标平台。异步函数的转译通常分为两步：

1. 转化为 generator
2. 兼容实现 generator

### 转译为 generator

所以如果目标平台支持 generator，那么只需要用 [transform-async-to-generator](https://babeljs.io/docs/plugins/transform-async-to-generator) 插件就好：

```bash
npm i --save-dev transform-async-to-generator
```

然后在 .babelrc 里启用

```json
{
  "plugins": ["transform-async-to-generator"]
}
```

### 转译为 ES5

不过考虑到现实因素，支持 generator 的浏览器多半可以自动升级，很可能已经支持异步函数，转译的需求可能并不大。国内最大的转译原因还是根深蒂固的 Windows + IE，于是我们需要彻底转译成 ES5。

这时就需要同时多个插件共同工作了。包括 [Syntax async functions](http://babeljs.io/docs/plugins/syntax-async-functions/)、[Regenerator transform](http://babeljs.io/docs/plugins/transform-regenerator/)、[Async to generator transform](http://babeljs.io/docs/plugins/transform-async-to-generator/)、[Runtime transform](http://babeljs.io/docs/plugins/transform-runtime/)。这些插件会帮你把异步函数转译成 generator，然后转译成 regenerator，然后再引入 regenerator 库，最终实现在低版本浏览器里运行异步函数的效果。

```bash
npm i --save-dev babel-plugin-transform-regenerator babel-plugin-syntax-async-functions babel-plugin-transform-runtime babel-plugin-transform-async-to-generator
```

然后在 .babelrc 里启用它们：

```json
{
  "plugins": [
    "babel-plugin-transform-regenerator",
    "babel-plugin-syntax-async-functions",
    "babel-plugin-transform-async-to-generator",
    "babel-plugin-transform-runtime"
  ]
}
```

> 需要注意的是，这样至少会引入3000多行代码（据说），对轻量应用影响很大。另外，编译之后的代码，也无法享受到栈和错误捕获方面的优势。

还有一个偷懒的做法，就是索性把 ES2015、ES2017 通通转译成 ES5，这样代码量会增加很多，但配置相对简单：

```bash
npm i babel-preset-es2015 babel-preset-es2017 babel-plugin-transform-runtime --save-dev
```

```json
{
  "presets": ["es2015", "es2017"],
  "plugins": ["transform-runtime]
}
```

### 还不会用 Babel？

Babel 转译，以及 Webpack 打包其实也包含不少的内容，这里我就不详细介绍了，尚不了解的同学请自行寻找资料学习。如果英文阅读能力尚可的话，直接看官网基本就够了。

* [Babel 官网](http://babeljs.io)
* [Webpack 官网](https://webpack.js.org)
* [Babel + Webpack 配置](http://babeljs.io/docs/setup/#installation)