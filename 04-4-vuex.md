Vuex
========

Vue 从去年开始大热，越来越多同学借助其全家桶进行开发。其中，Vuex 负责状态管理，换言之，在复杂应用中，Vuex 通常作为全局的数据中心。

> 如果您还不熟悉 Vuex，可以阅读它的[官方文档](https://vuex.vuejs.org/zh-cn/intro.html)。

Vuex 要求开发者使用显式的方式修改数据。对立刻生效的修改，调用 `stat.commit(type, payload)` 提交；对需要异步数据交互之后才能生效的修改，通过 `stat.dispatch(type, payload)` 提交。

比如说，一个电商网站，有限量促销商品，库存很少，于是很容易发生用户下单时才发现被抢空的情况。这个时候，系统就需要帮助用户重新加载促销商品。同时，还要给出相应提示。换言之，我们不仅需要提交异步修改，还要知道异步修改是什么时候完成的。

一方面，可以通过监测特定属性，也就是借助 `vm.$watch` 来进行。不过这种方式很难区分前置条件，比如我们可以 `.$watch` 商品列表，但是商品列表有好几种原因会刷新，如果都写在一起，逻辑就很分裂。另一种方法，利用 `stat.dispatch` 会返回对应 `action` 函数的返回值的特性，可以直接返回代理异步操作的 Promise，这样我们就可以给出适当的提示了。

```javascript
// buy.js
api.checkProduct(productId) // 检查商品是否还在
  .then( response => {
    if (response.code === 0) {
      return api.checkout(); // 正常，结账
    }
    throw new Error(response.code);
  })
  .catch( err => { // 没了
    if (err.message === NO_MORE_PRODUCT) {
      let popup = PopupManager.alert('您要购买的商品已售空，正为您查找其它的促销商品....');
      this.$store.dispatch(ActionTypes.REFETCH_SALES)
        .then(response => {
          popup.msg = '已重新获取促销商品，请尽快选购';
          popup.state = PopupManager.READY;
        });
    }
  });

// action.js
[ActionTypes.REFETCH_SALES] ({commit, state}) {
  state.isFetching = true;
  return api.fetch() // 要点：这里的 Promise 会返回给 dispatch 的地方
    .then(json => {
      commit(MutationTypes.RESET_PRODUCT_LIST, json);
    });
}
```