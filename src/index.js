import boot from './bootstrap';

boot().then((app) => {
  app.get('debug') && console.log(app.get('config'));
  console.log('tinifyd is running');
})

