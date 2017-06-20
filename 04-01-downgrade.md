降级
========

## IE

遗憾的是，除了 Edge 版本，IE 都不支持原生 Promise。不过好在 Promise 不需要新的语言元素，所以我们完全可以用独立类库来补足。这里推荐 [Q](https://github.com/kriskowal/q) 和 [Bluebird](http://bluebirdjs.com/)，它们都完全兼容 ES 规范，也就是说，前面介绍的用法都能奏效。

当然如果你不是非要 `new Promise()` 不可，用 jQuery 也完全可以。

## jQuery

jQuery 早在 1.5 版本就开始这方面的探索，已经实现了 Promise，不过名字不太一样，叫 [Deferred 对象](http://api.jquery.com/category/deferred-object/)。实现也不太一样，因为 jQuery 1.5 之后就开始这方面的尝试，所以和最终规范肯定有出入。不过升级到 [3.0](http://blog.meathill.com/tech/js/jquery/jquery-3-0-beta-released.html) 之后，它就完全遵守规范，并且也通过了测试。所以如果使用新版本，我们大可以按照之前的教程来操作，只是 jQuery 需要使用工厂方法来创建 Promise 实例，与规范略有区别：

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