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