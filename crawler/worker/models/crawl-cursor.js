'use strict';

const mongoose = require('mongoose');


const CrawlCursor = new mongoose.Schema({
  tag: { type: String, required: true },
  value: String,
  ended: Boolean,
});


module.exports = mongoose.model('CrawlCursor', CrawlCursor);
