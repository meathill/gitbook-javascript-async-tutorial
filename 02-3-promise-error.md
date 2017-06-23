Promise 进阶
========

我们继续学习 Promise。

## 错误处理

Promise 会自动捕获内部异常，并交给 `rejected` 响应函数处理。比如下面这段代码：

```javascript
new Promise( resolve => {
  setTimeout( () => {
    throw new Error('bye');
  }, 2000);
})
  .then( value => {
    console.log( value + ' world');
  })
  .catch( error => {
    console.log( 'Error: ', error.message);

// 输出：
// （2秒后）Error: bye
//     at Timeout.setTimeout [as _onTimeout] (/path/to/error.js:7:11)
//     at ontimeout (timers.js:488:11)
//     at tryOnTimeout (timers.js:323:5)
//     at Timer.listOnTimeout (timers.js:283:5)
```

可以看到，2秒之后，因为在 Promise 的执行器里抛出了错误，所以跳过了 `.then()`，进入 `.catch()` 处理异常。

正如我们前面所说，`.then(fulfilled, reject)` 其实接收两个参数，分别作为成功与失败的回调。不过在实践中，我更推荐上面的做法，即不传入第二个参数，而是把它放在后面的 `.catch()` 里面。这样有两个好处：

1. 更加清晰，更加好读
2. 可以捕获前面所有 `.then()` 的错误，而不仅是这一步的错误

> 在小程序里需要注意，抛出的错误会被全局捕获，而 `.catch` 反而不执行，所以该用两个参数还是要用。

## 更复杂的情况

当队列很长的时候，情况又如何呢？我们看一段代码：

```javascript
new Promise(resolve => {
  setTimeout(() => {
    resolve();
  }, 1000);
})
  .then( () => {
    console.log('start');
    throw new Error('test error');
  })
  .catch( err => {
    console.log('I catch: ', err);

    // 下面这一行的注释将引发不同的走向
    // throw new Error('another error');
  })
  .then( () => {
    console.log('arrive here');
  })
  .then( () => {
    console.log('... and here');
  })
  .catch( err => {
    console.log('No, I catch: ', err);
  });

// 输出：
// start
// I catch: test err
// arrive here
// ... and here
```

实际上，`.catch()` 仍然会使用 `Promise.resolve()` 返回其中的响应函数的执行结果，与 `.then()` 并无不同。所以 `.catch()` 之后的 `.then()` 仍然会执行，如果想彻底跳出执行，就必须继续抛出错误，比如把上面代码中的 `another error` 那行注释掉。这也需要大家注意。

## 总结

简单总结一下 Promise 的错误处理。与异步回调相比，它的作用略强，可以抛出和捕获，基本可以按照预期的状态执行。然而它仍然不是真正的 `try/catch/throw`，在队列很长的时候，捕获错误也很容易出错，所以还要小心。

另外，所有执行器和响应函数里的错误都不会真正进入全局环境，所以我们有必要在所有队列的最后一步增加一个 `.catch()`，防止遗漏错误造成意想不到的问题。

```javascript
doSomething()
  .doAnotherThing()
  .doMoreThing()
  .catch( err => {
    console.log(err);
  });
```

在 Node.js7 之后，没有捕获的 Promise 错误会触发一个 Warning，虽然不是很强，但也足够大家发现错误了。