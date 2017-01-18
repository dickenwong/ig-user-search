'use strict';


const ExtendableError = require('es6-error');

class CrawlerError extends ExtendableError {}

class ResourceNotFound extends CrawlerError {}
class PrivateProfile extends CrawlerError {}
class EmptyProfile extends CrawlerError {}


module.exports = {
  CrawlerError,
  ResourceNotFound,
  PrivateProfile,
  EmptyProfile,
};
