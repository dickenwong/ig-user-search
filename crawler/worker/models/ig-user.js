'use strict';

const mongoose = require('mongoose');


const IgUserSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  tag: { type: String, required: true },

  emailInBio: String,
  post: {
    code: String,
    likeCount: Number,
    date: Date,
  },
  recentMediaAverageLikes: { count: Number, mediaCount: Number },
  followerCount: Number,
  score: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
});


module.exports = mongoose.model('IgUser', IgUserSchema);
