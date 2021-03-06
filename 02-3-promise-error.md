Promise 进阶
========

我们继续学习 Promise。

## 错误处理

Promise 会自动捕获内部异常，并交给 `rejected` 响应函数处理。比如下面这段代码：

```javascript
new Promise( resolve => {
  setTimeout( () => {
    resolve();
  }, 2000);
  throw new Error('bye');
})
  .then( value => {
    console.log( value + ' world');
  })
  .catch( error => {
    console.log( 'Error: ', error.message);
  });

// 立刻输出：
// Error: bye
```

可以看到，原定2s之后 `resolve()` 并没有出现，因为在 Promise 的执行器里抛出了错误，所以立刻跳过了 `.then()`，进入 `.catch()` 处理异常。

这里需要注意，如果把抛出错误的语句放到回调函数里，则是另外一副光景：

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
    console.log( 'It\'s an Error: ', error.message);
  });

// (2s之后)输出：
// ./code/2-3-catch-error.js:3
//     throw new Error('bye');
//     ^

// Error: bye
//     at Timeout.setTimeout [as _onTimeout] (/Users/meathill/Documents/Book/javascript-async-tutorial/code/2-3-catch-error.js:3:11)
//     at ontimeout (timers.js:488:11)
//     at tryOnTimeout (timers.js:323:5)
//     at Timer.listOnTimeout (timers.js:283:5)
```

正如[异步的问题](./01-2-issue.md)分析的那样，异步回调中，异步函数的栈，和回调函数的栈，**不是**一个栈。所以 Promise 的执行器只能捕获到异步函数抛出的错误，无法捕获回调函数抛出的错误。

回到上面这段代码，当回调函数抛出错误时，我们没有捕获处理，运行时就出面捕获了，于是报错、回调栈被终结。此时，Promise 对象的状态并未被改变，所以下面的 `.then()` 响应函数和 `.catch()` 响应函数都没有触发，我们看到的，只是默认的错误输出。（2017-07-19 更新）

这也印证了 Promise 的问题：它没有引入新的语法元素，所以无法摆脱栈断裂带来的问题。在错误处理方面，它只是“能用”，并不好用，无法达到之前的开发体验。

### `reject`

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

所以，我们也可以下结论，Promise 并没有真正请回 `try/catch/throw`，它只是模拟了一个 `.catch()` 出来，可以在一定程度上解决回调错误的问题，但是距离真正还原栈关系，正常使用 `try/catch/throw` 其实还很远。

## 小结

简单总结一下 Promise 的错误处理。与异步回调相比，它的作用略强，可以抛出和捕获错误，基本可以按照预期的状态执行。然而它仍然不是真正的 `try/catch/throw`。

`.catch()` 也使用 `Promise.resolve()` 返回 `fulfilled` 状态的 Promise 实例，所以它后面的 `.then()` 会继续执行，在队列很长的时候，也容易出错，请大家务必小心。

另外，所有执行器和响应函数里的错误都不会真正进入全局环境，所以我们有必要在所有队列的最后一步增加一个 `.catch()`，防止遗漏错误造成意想不到的问题。

```javascript
doSomething()
  .doAnotherThing()
  .doMoreThing()
  .catch( err => {
    console.log(err);
  });
```

在 Node.js v7 之后，没有捕获的内部错误会触发一个 Warning，大家可以用来发现错误。