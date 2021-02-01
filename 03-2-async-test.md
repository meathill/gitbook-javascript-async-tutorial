Async 小测验
========

Async Function 同样会有一些令人困惑的地方，我收集了一些，放在这里方便大家学习。

1. 执行顺序

> 来自 [Axel Rauschmayer](https://twitter.com/rauschma/status/1188927319685120001)

下面两行代码的执行顺序一致么？不一致的话，差别在哪里？

```js
/* 1 */ [one, two] = [await fn(1), await fn(2)];
/* 2 */ [one, two] = await Promise.all([fn(1), fn(2)]);
```

**答案：**

不一致。(1) 是顺序执行，因为构建数组时，会先等待 `fn(1)`、`fn(2)` 执行完；(2) 是并发执行，`fn(2)` 会在 `fn(1)` 执行完但是没有返回结果时立即执行。

--------

总结
--------

其实说起来是 Async 问题，其实都是语法问题。
