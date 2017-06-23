Async Function
========

异步函数对异步编程来说，是一个非常大的进步，瞬间把开发效率和维护效率提升了一个数量级。

它的用法非常简单，只要用 `async` 关键字声明一个函数为“异步函数”，这个函数的内部就可以使用 await 关键字，让其中的语句等待异步执行的结果，然后再继续执行。我们还是用代码来说明吧：

```javascript
function resolveAfter2Seconds(x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(x);
    }, 2000);
  });
}

async function f1() {
  var x = await resolveAfter2Seconds(10);
  console.log(x);
}
f1();

// 输出：
// （2秒后）10
```

这段代码来自 [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)。里面先声明了 `resolveAfter2Seconds` 函数，执行它会返回一个 Promise 对象，等待2秒钟之后完成。然后声明了异步函数 `f1`，里面只有两行，第一行用 `await` 表示要等后面的 Promise 完成，再进行下一步。于是2秒之后，输出了“10”。

异步函数执行后会返回一个 Promise 对象，所以我们可以延续之前的做法，

异步函数严重依赖 Promise，某种程度上我们可以认为它是 Promise 的语法糖。

## 普及率

[![Async Function 的普及率](http://images.gitbook.cn/000af860-5801-11e7-92d5-13bc6466d9ae)](http://caniuse.com/#search=async%20function)
截图于：2017-06-23