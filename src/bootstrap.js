import _ from 'lodash';
import P from 'bluebird';
import config from './config';
import Container from './lib/foundation';
import tinify from 'tinify'

let app = new Container();

app.set('config', config)

.then(() => {
  tinify.key = config.tinify.key;
  return app.set('tinify', tinify);
})

.then(() => {
  
})


.then(() => app);

