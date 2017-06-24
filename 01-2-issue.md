异步的问题
========

## 回调陷阱

这个问题其实是最直观的问题，也是大家谈的最多的问题。比如下面这段代码：

```javascript
a(function (resultA) {
  b(resultA, function (resultB) {
    c(resultB, function (resultC) {
      d(resultC, function (resultD) {
        e(resultD, function (resultE) {
          f(resultE, function (resultF) {
            // 子子孙孙无穷尽也
            console.log(resultF);
          });
        });
      });
    });
  });
});
```

嵌套层次之深令人发指。这种代码很难维护，有人称之为“回调地狱”，有人称之为“回调陷阱”，还有人称之为“回调金字塔”，其实都无所谓，带来的问题很明显：

1. **难以维护。** 上面这段只是为演示写的示范代码，还算好懂；实际开发中，混杂了业务逻辑的代码更多更长，更难判定函数范围，再加上闭包导致的变量使用，那真的难以维护。
2. **难以复用。** 回调的顺序确定下来之后，想对其中的某些环节进行复用也很困难，牵一发而动全局，可能只有全靠手写，结果就会越搞越长。

## 更严重的问题

面试的时候，问到回调的问题，如果候选人只能答出“回调地狱，难以维护”，在我这里顶多算不功不过，不加分。要想得到满分必须能答出更深层次的问题。

为了说明这些问题，我们先来看一段代码。假设有这样一个需求：

> 遍历目录，找出最大的一个文件。

```javascript
// 这段代码来自于 https://medium.com/@wavded/managing-node-js-callback-hell-1fe03ba8baf 我加入了一些自己的理解
/**
 * @param dir 目标文件夹
 * @param callback 完成后的回调
 */
function findLargest(dir, callback) {
  fs.readdir(dir, function (err, files) {  // [1]
    if (err) return callback(err); // {1}
    let count = files.length; // {2}
    let errored = false; // {2}
    let stats = []; // {2}
    files.forEach( file => { // [2]
      fs.stat(path.join(dir, file), (err, stat) => { // [3]
        if (errored) return; // {1}
        if (err) {
          errored = true;
          return callback(err);
        }
        stats.push(stat); // [4] {2}

        if (--count === 0) { // [5] {2}
          let largest = stats
            .filter(function (stat) { return stat.isFile(); })
            .reduce(function (prev, next) {
              if (prev.size > next.size) return prev;
              return next;
            });
          callback(null, files[stats.indexOf(largest)]); // [6]
        }
      });
    });
  });
}

findLargest('./path/to/dir', function (err, filename) { // [7]
  if (err) return console.error(err);
  console.log('largest file was:', filename);
});
```

这里我声明了一个函数 `findLargest()`，用来查找某一个目录下体积最大的文件。它的工作流程如下（参见代码中的标记“[n]”)：

1. 使用 `fs.readdir` 读取一个目录下的所有文件
2. 对其结果 `files` 进行遍历
3. 使用 `fs.readFile` 读取每一个文件的属性
4. 将其属性存入 `stats` 数组
5. 每完成一个文件，就将计数器减一，直至为0，再开始查找体积最大的文件
6. 通过回调传出结果
7. 调用此函数的时候，需传入目标文件夹和回调函数；回调函数遵守 Node.js 风格，第一个参数为可能发生的错误，第二个参数为实际结果

## 断开的栈与 `try/catch`

我们再来看标记为“{1}”的地方。在 Node.js 中，几乎所有异步方法的回调函数都是这种风格：

```javascript
/**
 * @param err 可能发生的错误
 * @param result 正确的结果
 */
function (err, result) {
  if (err) { // 如果发生错误
    return callback(err);
  }

  // 如果一切正常
  callback(null, result);
}
```

通常来说，错误处理的一般机制是“捕获” -> “处理”，即 `try/catch`，但是这里我们都没有用，而是作为参数调用回调函数，甚至要一层一层的通过回调函数传出去。为什么呢？

无论是事件还是回调，基本原理是一致的：

> 把当前语句执行完；把不确定完成时间的计算交给系统；等待系统唤起回调。

于是**栈被破坏了，无法进行常规的 `try/catch`**。

我们知道，函数执行是一个“入栈/出栈”的过程。当我们在 A 函数里调用 B 函数的时候，JS 引擎就会先把 A 压到栈里，然后再把 B 压到栈里；B 运行结束后，出栈，然后继续执行 A；A 也运行完毕后，出栈，栈已清空，这次运行结束。

可是异步回调函数（包括事件处理函数，下同）不完全如此，比如上面的代码，无论是 `fs.readdir` 还是 `fs.readFile`，都不会直接调用回调函数，而是继续执行其它代码，直至完成，出栈。真正调用回到函数的是引擎，并且是启用一个新栈，压入栈成为第一个函数。所以如果回调报错，一方面，我们无法获取之前启动异步计算时栈里的信息，不容易判定什么导致了错误；另一方面，套在 `fs.readdir` 外面的 `try/catch`，也根本捕获不到这个错误。

结论：回调函数的栈与启动异步操作的栈断开了，无法正常使用 `try/catch`。

## 迫不得已使用外层变量

我们再来看代码中标记为“{2}”的地方。我在这里声明了3个变量，`count` 用来记录待处理文件的数量；`errored` 用来记录有没有发生错误；`stats` 用来记录文件状态。

这3个变量会在 `fs.stat()` 的回调函数中使用。因为我们没法确定这些异步操作的完成顺序，所以只能用这种方式判断是否所有文件都已读取完毕。虽然基于闭包的设计，这样做一定行得通，但是，操作外层作用域的变量，还是存在一些隐患。比如，这些变量同样也可以被其它同一作用域的函数访问并且修改。

我们平时说“关注点集中”，哪里的变量就在哪里声明哪里使用哪里释放，就是为了避免这种情况。

同样的原理，在第二个“{1}”这里，因为遍历已经执行完，触发回调的时候已经无力回天，所以只能根据外层作用域的记录，逐个判断。

结论：同时执行多个异步回调时，因为没法预期它们的完成顺序，所以必须借助外层作用域的变量。

## 小结

我们回来总结一下，异步回调的传统做法有四个问题：

1. 嵌套层次很深，难以维护
2. 代码难以复用
3. 堆栈被破坏，无法正常检索，也无法正常使用 `try/catch/throw`
4. 多个异步计算同时进行，无法预期完成顺序，必须借助外层作用域的变量，有误操作风险