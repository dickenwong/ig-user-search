'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const { requestLogger, errorLogger } = require('./loggers');
const routes = require('./routes/index');
const app = express();


main();


function main() {
  configure();
  routeFallBack();
}


function configure() {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');

  app.use(requestLogger);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/', routes);

  app.use(errorLogger);
}

function routeFallBack() {
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return;
    res
      .status(err.status || 500)
      .send(err.stack || err.message || err);
  });
}


module.exports = app;
