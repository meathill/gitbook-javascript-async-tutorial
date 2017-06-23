Promise 小测验
========

好的，我们已经初步了解了 Promise 的使用方式，了解了 `.then()` 怎么处理响应函数，返回新的 Promise 实例。接下来我们看一个小测验，看看大家的掌握程度。

> 下面这道题出自 [We have a problem with promises](https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html)

**问题：下面的四种 promises 的区别是什么？**

我们假定 `doSomething()` 和 `doSomethingElse()` 都会返回 Promise 对象。

```javascript
// #1
doSomething().then(function () {
  return doSomethingElse();
});

// #2
doSomething().then(function () {
  doSomethingElse();
});

// #3
doSomething().then(doSomethingElse());

// #4
doSomething().then(doSomethingElse);
```

仔细看一看，默想一下答案，不要着急往下翻。

好，准备好了么？我们继续了哟。

3...

2..

1.

## 答案揭晓

### 第一题

```javascript
doSomething()
  .then(function () {
    return doSomethingElse();
  })
  .then(finalHandler);
```

答案：

```
doSomething
|-----------|
            doSomethingElse(undefined)
            |------------|
                         finalHandler(resultOfDoSomethingElse)
                         |------------|
```

这道题比较简单，几乎和前面的例子一样，我就不多说了。

### 第二题

```javascript
doSomething()
  .then(function () {
    doSomethingElse();
  })
  .then(finalHandler);
```

答案：

```
doSomething
|-----------------|
                  doSomethingElse(undefined)
                  |------------------|
                  finalHandler(undefined)
                  |------------------|
```

这道题就有一定难度了。虽然 `doSomethingElse` 会返回 Promise 对象，但是因为 `.then()` 的响应函数并没有把它 `return` 出来，所以这里其实相当于 `return null`。我们知道，`Promise.resolve()` 在参数为空的时候会返回一个状态为 `fulfilled` 的 Promise，所以这里两步是一起执行的。

### 第三题

```javascript
doSomething()
  .then(doSomethingElse())
  .then(finalHandler);
```

答案：

```
doSomething
|-----------------|
doSomethingElse(undefined)
|---------------------------------|
                  finalHandler(resultOfDoSomething)
                  |------------------|
```

这一题的语法陷阱也不小。首先，`doSomethingElse` 和 `doSomethingElse()` 的区别在于，前者是一个变量，引用一个函数；而后者是则是直接执行了函数，并返回其返回值。所以这里 `doSomethingElse` 立刻就开始执行了，和前面 `doSomething` 的启动时间相差无几，可以忽略不计。然后，按照 Promise 的设计，当 `.then()` 的参数不是函数的时候，这一步会被忽略不计，所以 `doSomething` 完成后就跳去执行 `finalHandler` 了。

### 第四题

```javascript
doSomething()
  .then(doSomethingElse)
  .then(finalHandler);
```

答案：

```
doSomething
|-----------|
            doSomethingElse(resultOfDoSomething)
            |------------|
                         finalHandler(resultOfDoSomethingElse)
                         |------------------|
```

这一题比较简单，就不解释了。

--------

怎么样？都答对了么？还是有点小难度的，对吧？