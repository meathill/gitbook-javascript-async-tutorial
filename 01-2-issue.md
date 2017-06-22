异步的问题
========

无论是事件还是回调，基本原理是一致的：

> 把当前语句执行完；把不确定完成时间的计算交给系统；等待系统唤起回调。

于是带来第一个问题：**栈被破坏了，无法进行常规的 `try/catch`**。

## 断开的栈与 `try/catch`

我们知道，函数执行是一个“入栈/出栈”的过程。当我们在 A 函数里调用 B 函数的时候，运行时就会先把 A 压到栈里，然后再把 B 压到栈里；B 运行结束后，出栈，然后继续执行 A；A 也运行完毕后，出栈，栈已清空，这次运行结束。

可是异步的回调函数（包括事件处理函数，下同）不完全如此，比如下面这段代码：

```javascript
function callback (err, content) { // [callback]
  // 处理
}
fs.readFile('path/to/file.txt', 'utf8', callback); // [A]
let foo = 123;
// 继续执行其它代码
```

A 函数执行后，并不直接调用 callback，而是继续执行其它代码，直至完成，出栈。真正调用 callback 的是运行时，启动一个新的栈，callback 作为这个栈的第一个函数。所以当函数报错的时候，我们无法获取之前栈里的信息，不容易判定是什么导致的错误。并且，如果我们在外层套一个 `try/catch`，也捕获不到错误。关于这一点，等下还会有说明。

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

1. **难以维护。** 上面这段只是为演示写的示范代码，还算好懂；实际开发中，混杂了业务逻辑的代码更多更长，那才真的没法动。
2. **难以复用。** 回调的顺序确定下来之后，想对其中的某些环节进行复用也很困难，牵一发而动全局，可能只有全靠手写，结果就会越搞越长。

## 更严重的问题

面试的时候，问到回调的问题，如果候选人只能答出“回调地狱”，在我这里是不功不过不加分的。要想得到满分必须能答出更深层次的问题。

为了说明这些问题，我们先来看一段代码。假设有这样一个需求：

> 遍历目录，找出最大的一个文件。

```javascript
/**
 * @param dir 目标文件夹
 * @param callback 完成后的回调
 */
function findLargest(dir, callback) {
  fs.readdir(dir, function (err, files) {
    if (err) return callback(err); // [1]
    let count = files.length; // [2]
    let errored = false;
    let stats = [];
    files.forEach( file => {
      fs.stat(path.join(dir, file), (err, stat) => {
        if (errored) return; // [1]
        if (err) {
          errored = true;
          return callback(err);
        }
        stats.push(stat); // [2]

        if (--count === 0) {
          let largest = stats
            .filter(function (stat) { return stat.isFile(); })
            .reduce(function (prev, next) {
              if (prev.size > next.size) return prev;
              return next;
            });
          callback(null, files[stats.indexOf(largest)]);
        }
      });
    });
  });
}

findLargest('./path/to/dir', function (err, filename) {
  if (err) return console.error(err);
  console.log('largest file was:', filename);
});
```

这里我声明了一个函数 `findLargest()`，用来查找某一个目录下体积最大的文件。大家先请看代码中标记 `[1]` 的地方