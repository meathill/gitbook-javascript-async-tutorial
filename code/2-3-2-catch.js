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

// ./code/2-3-catch-error.js:3
//     throw new Error('bye');
//     ^

// Error: bye
//     at Timeout.setTimeout [as _onTimeout] (/Users/meathill/Documents/Book/javascript-async-tutorial/code/2-3-catch-error.js:3:11)
//     at ontimeout (timers.js:488:11)
//     at tryOnTimeout (timers.js:323:5)
//     at Timer.listOnTimeout (timers.js:283:5)