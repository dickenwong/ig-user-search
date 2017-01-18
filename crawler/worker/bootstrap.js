'use strict';

const mongoose = require('mongoose');

const mongodbUrl = 'mongodb://mongo:27017/tag-crawl';
mongoose.connect(mongodbUrl);

require('./models/ig-user');
require('./models/crawl-cursor');
require('./models/ig-api-history');
