Promise 详解
========

我们先来看 Promise 的用法。

```javascript
new Promise(
  /* 执行器 executor */
  function (resolve, reject) {
    // 一段可能耗时很长的异步操作
    doAsyncAction(function callback(err, result) {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  }
)
  .then(function resolve() {
    // 成功，下一步
  }, function reject() {
    // 失败，做相应处理
  });
```

Promise 是一个**代理对象**，它和原先的异步操作并无关系。它接受一个“执行器 executor”作为参数，我们把原先要执行的异步（并非一定要异步，以后会说明，这里你可以先不深究）操作放进去。

执行器在 Promise 实例创建后立刻开始执行。执行器自带两个参数：`resolve` 和 `reject`，这二位都是函数，执行它们会改变 Promise 实例的状态。

Promise 实例有三个状态：

1. `pending` [待定] 初始状态，新创建的实例处于这个状态
2. `fulfilled` [实现] 操作成功，在执行器里调用 `resolve()` 之后，实例切换到这个状态
3. `rejected` [被否决] 操作失败，在执行器里调用 `reject()` 之后，实例切换到这个状态

Promise 实例状态改变之后，就会触发后面对应的 `.then()` 参数里的函数，继续执行后续步骤。另外，Promise 的实例状态只会改变一次，确定为 `fulfilled` 或 `rejected` 之一后就不会再变。

## 一个简单的例子

```javascript
new Promise( resolve => {
  setTimeout( () => {
    resolve('hello');
  }, 2000);
})
  .then( value => {
    console.log( value + ' world');
  });

// 输出：
// hello world
```

这是最简单的一种情况。执行器里面是一个定时器，2秒种之后，它会执行 `resolve('hello')`，将 Promise 实例的状态置为 `fulfilled`，并传出返回值`'hello'`。接下来 `.then()` 里面的 `resolve` 响应函数就会被触发，它接受前面 Promise 返回的值 `'hello'`，将其与 `' world'` 连接起来，输出“hello world”。

## 再来一个稍复杂的例子

```javascript
new Promise( resolve => {
  setTimeout( () => {
    resolve('hello');
  }, 2000);
})
  .then( value => {
    return new Promise( resolve => {
      setTimeout( () => {
        resolve('world')
      }, 2000);
    });
  })
  .then( value => {
    console.log( value + ' world');
  });

// 输出：
// world world
```

这个例子与上一个例子的不同之处在于，我在 `.then()` 的后面又跟了一个 `.then()`。并且在第一个 `.then()` 里又返回了一个 Promise 实例。于是，第二个 `.then()` 就又等了2秒才执行，并且接收到的参数是第一个 `.then()` 返回的 Promise 返回的 `'world'`(好拗口)，而不是起始 Promise 返回的 `'hello'`。

这就必须说明 Promise 里 `.then()` 的设计。

## `.then()`

`.then()` 其实接受两个函数作为参数，分别代表 `fulfilled` 状态时的处理函数和 `rejected` 状态时的处理函数。只不过通常情况下，我会建议大家使用 `.catch()` 捕获 `rejected` 状态。这个后面还会说到，暂时按下不表。

`.then()` 会返回一个新的 Promise 实例，所以它可以链式调用，如前面的例子所示。当前面的 Promise 状态改变时，`.then()` 会执行特定的状态响应函数，并将其结果，调用自己的 Promise 的 `resolve()` 返回。

### Promise.resolve()

这里必须插入介绍一下 Promise.resolve()。它是 Promise 的静态方法，可以返回一个状态为 `fulfilled` 的 Promise 实例。这个方法非常重要，其它方法都需要用它处理参数。

它可以接受四种不同类型的参数，并且返回不同的值：

1. 参数为空，返回一个 `fulfilled` 实例，响应函数的参数也为空
2. 参数不为空、也不是 Promise 实例，返回 `fulfilled` 实例，只不过响应函数能得到这个参数
3. 参数为 Promise 实例，直接原样返回
4. 参数为 thenable 对象，立刻执行它的 `.then()`

用一段代码作为示范吧，比较简单，就不一一解释了。

```javascript
Promise.resolve()
  .then( () => {
    console.log('Step 1');
    return Promise.resolve('Hello');
  })
  .then( value => {
    console.log(value, 'World');
    let p = new Promise( resolve => {
      setTimeout(() => {
        resolve('Good');
      }, 2000);
    });
    return Promise.resolve(p);
  })
  .then( value => {
    console.log(value, ' evening');
    return Promise.resolve({
      then() {
        console.log(', everyone');
      }
    })
  });

// 输出：
// Step 1
// Hello World
// （2秒之后） Good evening
// , everyone
```

提醒大家一下，标准定义的 Promise 不能被外界改变状态，只能在执行器里执行 `resolve` 或者 `reject` 来改变。

### 继续 `.then()` 的话题

结合上一小节关于 Promise.resolve() 的讲解，我们应该可以推断出 `.then()` 里的状态响应函数返回不同结果对进程的影响了吧。所以在连续 `.then()` 的例子中，第一个 `.then()` 返回了新的 Promise 实例，第二个就会等待其完成后才会触发。

好的，接下来我们换一个思路，假如一个 Promise 已经完成了，再给它加一个 `.then()`，会有什么效果呢？我们来试一下。

```javascript
let promise = new Promise(resolve => {
  setTimeout(() => {
    console.log('the promise fulfilled');
    resolve('hello, world');
  }, 1000);
});

setTimeout(() => {
  promise.then( value => {
    console.log(value);
  });
}, 3000);

// 输出
// （1秒后）the promise fulfilled
// （3秒后）hello, world
```

1秒后，Promise 完成；3秒后，给它续上一个 `.then()`，因为它已经处于 `fulfilled` 状态，所以立刻执行响应函数，输出“hello, world”。

这一点很值得我们关注。Promise 从队列操作中脱胎而成，带有很强的队列属性。异步回调开始执行后，我们无法追加操作，也无法判定结束时间。而使用 Promise 的话，我们不需要关心它什么时候开始什么时候结束，只需要在后面追加操作，即可。另外，Promise 是一个普通对象，我们也可以像对待别的对象那样将它进行传递。这为它带来了独特的价值。