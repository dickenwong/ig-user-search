'use strict';

const mongoose = require('mongoose');


const IgApiHistory = new mongoose.Schema({
  time: { type: Date, required: true, default: Date.now },
  count: { type: Number, required: true },
});


module.exports = mongoose.model('IgApiHistory', IgApiHistory);
