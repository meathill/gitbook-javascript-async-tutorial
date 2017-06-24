Promise 进阶
========

接下来的时间，我会继续把 Promise 的知识补完。

## `Promise.reject(reason)`

这个方法比较简单，就返回一个状态为 `rejected` 的 Promise 实例。

它接受一个参数 `reason`，作为状态说明，交由后面的 `.catch()` 捕获。为了与其它异常处理共用一个`.catch()`，我们可以用 `Error` 实例作为  `reason`。

另外，`Promise.reject()` 也不认 `thenable`。

```javascript
let error = new Error('something wrong');
Promise.reject(error)
  .then( value => {
    console.log('it\'s ok');
    console.log(value);
  })
  .catch( err => {
    console.log('no, it\'s not ok');
    console.log(err);

    return Promise.reject({
      then() {
        console.log('it will be ok');
      },
      catch() {
        console.log('not yet');
      }
    });
  });
```

## `Promise.all([p1, p2, p3, ....])`

`Promise.all([p1, p2, p3, ....])` 用于将多个 Promise 实例，包装成一个新的 Promise 实例。

它接受一个数组（其实是 [`iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#The_iterable_protocol)，不过我觉得暂时不要引入更多概念了……）作为参数，数组里可以是 Promise 对象，也可以是别的值，这些值都会交给 `Promise.resolve()` 处理。当所有子 Promise 都完成，该 Promise 完成，返回值是包含全部返回值的数组。有任何一个失败，该 Promise 失败，`.catch()` 得到的是第一个失败的子 Promise 的错误。

```javascript
Promise.all([1, 2, 3])
  .then( all => {
    console.log('1: ', all);
    return Promise.all([ function () {
      console.log('ooxx');
    }, 'xxoo', false]);
  })
  .then( all => {
    console.log('2: ', all);
    let p1 = new Promise( resolve => {
      setTimeout(() => {
        resolve('I\'m P1');
      }, 1500);
    });
    let p2 = new Promise( resolve => {
      setTimeout(() => {
        resolve('I\'m P2');
      }, 1450)
    });
    return Promise.all([p1, p2]);
  })
  .then( all => {
    console.log('3: ', all);
    let p1 = new Promise( resolve => {
      setTimeout(() => {
        resolve('I\'m P1');
      }, 1500);
    });
    let p2 = new Promise( (resolve, reject) => {
      setTimeout(() => {
        reject('I\'m P2');
      }, 1000);
    });
    let p3 = new Promise( (resolve , reject) => {
      setTimeout(() => {
        reject('I\'m P3');
      }, 3000);
    });
    return Promise.all([p1, p2, p3]);
  })
  .then( all => {
    console.log('all', all);
  })
  .catch( err => {
    console.log('Catch: ', err);
  });

// 输出：
// 1:  [ 1, 2, 3 ]
// 2:  [ [Function], 'xxoo', false ]
// 3:  [ 'I\'m P1', 'I\'m P2' ]
// Catch:  I'm P2
```

这里很容易懂，就不一一解释了。

### 常见用法

`Promise.all()` 最常见就是和 `.map()` 连用。

我们改造一下前面的例子。

```javascript
// FileSystem.js
const fs = require('fs');

module.exports = {
  readDir: function (path, options) {
    return new Promise( resolve => {
      fs.readdir(path, options, (err, files) => {
        if (err) {
          throw err;
        }
        resolve(files);
      });
    });
  },
  stat: function (path, options) {
    return new Promise( resolve => {
      fs.stat(path, options, (err, stat) => {
        if (err) {
          throw err;
        }
        resolve(stat);
      });
    });
  }
};

// main.js
const fs = require('./FileSystem');

function findLargest(dir) {
  return fs.readDir(dir, 'utf-8')
    .then( files => {
      return Promise.all( files.map( file => fs.stat(file) ));
    })
    .then( stats => {
      let biggest = stats.reduce( (memo, stat) => {
        if (stat.isDirectory()) {
          return memo;
        }
        if (memo.size < stat.size) {
          return stat;
        }
        return memo;
      });
      return biggest.file;
    })
    .catch(console.log.bind(console));
}

findLargest('some/path/')
  .then( file => {
    console.log(file);
  })
  .catch( err => {
    console.log(err);
  });
```

在这个例子当中，我使用 Promise 将 `fs.stat` 和 `fs.readdir` 进行了封装，让其返回 Promise 对象。然后使用 `Promise.all()` + `Array.prototype.map()` 方法，就可以进行遍历，还可以避免使用外层作用域的变量。

## `Promise.race([p1, p2, p3, ....])`

`Promise.race()` 的功能和用法与 `Promise.all()` 十分类似，也接受一个数组作为参数，然后把数组里的值都用 `Promise.resolve()` 处理成 Promise 对象，然后再返回一个新的 Promise 实例。只不过这些子 Promise 有任意一个完成，`Promise.race()` 返回的 Promise 实例就算完成，并且返回完成的子实例的返回值。

它最常见的用法，是作超时检查。我们可以把异步操作和定时器放在一个 `Promise.race()` 里，如果定时器触发时异步操作还没返回，就可以认为超时了，然后就可以给用户一些提示。

```javascript
let p1 = new Promise(resolve => {
  // 这是一个长时间的调用，我们假装它就是正常要跑的异步操作
  setTimeout(() => {
    resolve('I\'m P1');
  }, 10000);
});
let p2 = new Promise(resolve => {
  // 这是个稍短的调用，假装是一个定时器
  setTimeout(() => {
    resolve(false);
  }, 2000)
});
Promise.race([p1, p2])
  .then(value => {
    if (value) {
      console.log(value);
    } else {
      console.log('Timeout, Yellow flower is cold');
    }
  });

// 输出：
// Timeout, Yellow flower is cold
```

注意，这里 `p1` 也就是原本就要执行的异步操作并没有被中止，它只是没有在预期的时间内返回而已。所以一方面可以继续等待它的返回值，另一方面也要考虑服务器端是否需要做回滚处理。

## Promise 嵌套

这种情况在初涉 Promise 的同学的代码中很常见，大概是这么个意思：

```javascript
new Promise( resolve => {
  console.log('Step 1');
  setTimeout(() => {
    resolve(100);
  }, 1000);
})
  .then( value => {
    return new Promise(resolve => {
      console.log('Step 1-1');
      setTimeout(() => {
        resolve(110);
      }, 1000);
    })
      .then( value => {
        console.log('Step 1-2');
        return value;
      })
      .then( value => {
        console.log('Step 1-3');
        return value;
      });
  })
  .then(value => {
    console.log(value);
    console.log('Step 2');
  });
```

因为 `.then()` 返回的也是 Promise 实例，所以外层的 Promise 会等里面的 `.then()` 执行完再继续执行，所以这里的执行顺序稳定为从上之下，左右无关，“1 > 1-1 > 1-2 > 1-3 > 2”。但是从阅读体验和维护效率的角度来看，最好把它展开：

```javascript
new Promise( resolve => {
  console.log('Step 1');
  setTimeout(() => {
    resolve(100);
  }, 1000);
})
  .then( value => {
    return new Promise(resolve => {
      console.log('Step 1-1');
      setTimeout(() => {
        resolve(110);
      }, 1000);
    });
  })
  .then( value => {
    console.log('Step 1-2');
    return value;
  })
  .then( value => {
    console.log('Step 1-3');
    return value;
  })
  .then(value => {
    console.log(value);
    console.log('Step 2');
  });
```

二者是完全等价的，后者更容易阅读。

## 队列

有时候我们不希望所有动作一起发生，而是按照一定顺序，逐个进行。这样的形式，就是队列。在我看来，队列是 Promise 的核心价值，即使是异步函数在大部分浏览器和 Node.js 里实装的今天，队列也仍有其独特的价值。

用 Promise 实现队列的方式很多，这里兹举两例：

```javascript
// 使用 Array.prototype.forEach
function queue(things) {
  let promise = Promise.resolve();
  things.forEach( thing => {
    // 这里很容易出错，如果不把 `.then()` 返回的新实例赋给 `promise` 的话，就不是队列，而是批量执行
    promise = promise.then( () => {
      return new Promise( resolve => {
        doThing(thing, () => {
          resolve();
        });
      });
    });
  });
  return promise;
}

queue(['lots', 'of', 'things', ....]);

// 使用 Array.prototype.reduce
function queue(things) {
  return things.reduce( (promise, thing) => {
    return promise.then( () => {
      return new Promise( resolve => {
        doThing(thing, () => {
          resolve();
        });
      });
    });
  }, Promise.resolve());
}

queue(['lots', 'of', 'things', ....]);
```

这个例子如此直接我就不再详细解释了。下面我们看一个相对复杂的例子，假设需求：

> 开发一个爬虫，抓取某网站。

```javascript
const spider = require('spider');

function fetchAll(urls) {
  return urls.reduce((promise, url) => {
    return promise.then( () => {
      return fetch(url);
    });
  }, Promise.resolve());
}
function fetch(url) {
  return spider.fetch(url)
    .then( content => {
      return saveOrOther(content);
    })
    .then( content => {
      let links = spider.findLinks(content);
      return fetchAll(links);
    });
}
let url = ['http://blog.meathill.com/'];
fetchAll(url);
```

这段代码，我假设有一个蜘蛛工具（spider）包含基本的抓取和分析功能，然后循环使用 `fetch` 和 `fetchAll` 方法，不断分析抓取的页面，然后把页面当中所有的链接都加入到抓取队列当中。通过递归循环的方式，完成网站抓取。

### Generator

如果你了解 Generator，你应该知道 Generator 可以在执行时中断，并等待被唤醒。如果能把它们连到一起使用应该不错。

```javascript
let generator = function* (urls) {
  let loaded = [];
  while (urls.length > 0) {
    let url = urls.unshift();
    yield spider.fetch(url)
      .then( content => {
        loaded.push(url);
        return saveOrOther(content);
      })
      .then( content => {
        let links = spider.findLinks(content);
        links = _.without(links, loaded);
        urls = urls.concat(links);
      });
  }
  return 'over';
};

function fetch(urls) {
  let iterator = generator();

  function next() {
    let result = iterator.next();
    if (result.done) {
      return result.value;
    }
    let promise = iterator.next().value;
    promise.then(next);
  }

  next();
}

let urls = ['http://blog.meathill.com'];
fetch(urls);
```

Generator 可以把所有待抓取的 URL 都放到一个数组里，然后慢慢加载。从整体来看，暴露给外界的 `fetch` 函数其实变简单了很多。但是实现 Generator 本身有点费工夫，其中的利弊大家自己权衡吧。

## 小结

关于 Promise 的内容到此告一段落。这里我介绍了大部分的功能、函数和常见用法，有一些特殊情况会在后面继续说明。