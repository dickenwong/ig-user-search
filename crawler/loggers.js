'use strict';


const winston = require('winston');
const expressWinston = require('express-winston');


function makeLoggers() {
  const requestTransport = new winston.transports.Console({
    json: false,
    colorize: true,
  });
  const errorTransport = new winston.transports.Console({
    json: true,
    colorize: true,
  });
  const requestLogger = expressWinston.logger({
    transports: [requestTransport],
    expressFormat: true,
    meta: true,
    ignoreRoute: (req, res) => (req.path === '/health-check/'),
  });
  const errorLogger = expressWinston.errorLogger({
    transports: [errorTransport],
  });
  return { requestLogger, errorLogger };
}

module.exports = makeLoggers();
