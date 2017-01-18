'use strict';

require('./bootstrap');

const co = require('co');
const { Tag, Profile } = require('./crawler');

const IgUser = require('./models/ig-user');
const CrawlCursor = require('./models/crawl-cursor');
const IgApiHistory = require('./models/ig-api-history');


function clearRecords(tagName) {
  return co(function* _() {
    yield IgUser.remove({ tag: tagName });
    yield CrawlCursor.remove({ tag: tagName });
  });
}


function clearAllRecords() {
  return co(function* _() {
    yield IgUser.remove();
    yield CrawlCursor.remove();
  });
}


function countRecords() {
  return co(function* _() {
    const hash = {};
    const igUsers = yield IgUser.find({});
    igUsers.forEach(user => {
      if (!hash[user.tag]) hash[user.tag] = 0;
      hash[user.tag] += 1;
    });
    return hash;
  });
}


function countApiCall() {
  return co(function* _() {
    const oneHourAgo = Date.now() - 1000 * 60 * 60;
    const entries = yield IgApiHistory.find({
      time: { $gte: oneHourAgo },
    });
    const callCount = entries.reduce((acc, entry) => acc + entry.count, 0);
    return callCount;
  });
}


function listRecords(tagName) {
  return IgUser.find({ tag: tagName });
}


function crawl(tagName, options, crawlCount = 500) {
  const tag = new Tag(tagName);
  let crawlCounter = 0;
  let apiCallCounter = 0;
  let apiHistorySaved = false;

  return co(function* _() {
    yield tag.init();
    let cursor = yield CrawlCursor.findOne({ tag: tagName });
    let ended = false;

    if (cursor) {
      if (cursor.value) tag.media.lastEndCursor = cursor.value;
      ended = cursor.ended;
    }

    while (!ended && crawlCounter <= crawlCount) {
      [crawlCounter, apiCallCounter, ended] = yield _crawl(
        tag, options, crawlCounter, apiCallCounter);
    }

    if (cursor) {
      cursor.value = tag.media.lastEndCursor;
      yield cursor.save();
    } else {
      cursor = yield CrawlCursor.create({
        tag: tagName,
        value: tag.media.lastEndCursor,
        ended,
      });
    }

    apiHistorySaved = true;
    yield IgApiHistory.create({ time: new Date(), count: apiCallCounter });

    return {
      cursor,
      crawledPostCount: crawlCounter,
      apiCalled: apiCallCounter,
      apiCalledInLastHour: yield countApiCall(tagName),
      igUsers: yield IgUser.find({ tag: tagName }).sort({ 'post.date': -1 }),
    };
  }).catch(err => {
    if (apiHistorySaved) throw err;
    return IgApiHistory
      .create({ time: new Date(), count: apiCallCounter })
      .then(() => { throw err; });
  });
}


function* _crawl(tag, options, crawlCounter = 0, apiCallCounter = 0) {
  const media = yield tag.nextMedia(250);
  apiCallCounter += 1;

  yield media.nodes.map(mediaNode => co(function* _() {
    if (crawlCounter % 100 === 0) {
      console.log(`${crawlCounter} posts have been crawled.`);
      console.log(`${apiCallCounter} api requests have been made.`);
    }
    crawlCounter += 1;

    /* ----------  Filter out found shop profile  ---------- */
    if (yield _hasProfileRecord(mediaNode.owner.id, tag.tagName)) return;
    /* ----------------------------------------------------- */

    const owner = mediaNode.owner;


    /* ----------  Filter out users with low followers  ---------- */
    if (options.followerCount) {
      if (owner.followed_by.count < options.followerCount) return;
    }


    // /* ----------  Filter out users with no contact in bio  ---------- */
    // const contactRegex = /whatsapp|wtsapp|line|wechat/i;
    // if (!contactRegex.test(profile.biography)) return;


    /* ----------  Filter out non-chinese users  ---------- */
    if (options.hasChinese || options.hasNoChinese) {
      const chineseRegex = /[\u4E00-\u9FCC]/;
      const noChinese = !chineseRegex.test(mediaNode.caption) &&
                        !chineseRegex.test(owner.full_name) &&
                        !chineseRegex.test(owner.biography);
      if (options.hasNoChinese && !noChinese) return;
      if (options.hasChinese && noChinese) return;
    }


    /* ----------  Filter out non-japanese users  ---------- */
    if (options.hasJapanese || options.hasNoJapanese) {
      const jpRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
      const noJP = !jpRegex.test(mediaNode.caption) &&
                   !jpRegex.test(owner.full_name) &&
                   !jpRegex.test(owner.biography);
      if (options.hasNoJapanese && !noJP) return;
      if (options.hasJapanese && noJP) return;
    }


    /* ----------  Filter out low like count of this post  ---------- */
    if (options.postLikeCount) {
      if (mediaNode.likes.count < options.postLikeCount) return;
    }


    /* ----------  Filter out low like count of this post  ---------- */
    if (options.keywords) {
      let hasOneKeyword = false;
      for (let keyword of options.keywords.split(',')) {
        keyword = keyword.trim();
        hasOneKeyword = (mediaNode.caption || '').indexOf(keyword) !== -1 ||
                        (owner.full_name || '').indexOf(keyword) !== -1 ||
                        (owner.biography || '').indexOf(keyword) !== -1;
        if (hasOneKeyword) break;
      }
      if (!hasOneKeyword) return;
    }


    /* ----------  Fetch post and profile data  ---------- */
    /* ----------  Filter out users with low avg like  ---------- */
    let avgLikeCount = null;
    let recentMediaCount = null;
    if (options.avgLikeCount && options.recentMediaCount) {
      const profile = new Profile(mediaNode.owner.username);
      yield profile.init();
      const recentMedia = yield profile.nextMedia(options.recentMediaCount);
      apiCallCounter += 2;

      const totalLikeCount = recentMedia.nodes.reduce(
        (acc, node) => acc + node.likes.count, 0
      );
      recentMediaCount = recentMedia.nodes.length;
      avgLikeCount = totalLikeCount / recentMediaCount;
      if (avgLikeCount < options.avgLikeCount) return;
    }


    /* ----------  Filter out found shop profile  ---------- */
    if (yield _hasProfileRecord(owner.id, tag.tagName)) return;
    const recordCount = yield IgUser.count({ userId: owner.id, tag: tag.tagName });


    /* ----------  Retrieve email address  ---------- */
    const emailRegex = /[A-Za-z0-9-_+.]+@[A-Za-z0-9]+\.[A-Za-z]+/;
    const match = (owner.biography || '').match(emailRegex);
    const emailInBio = match ? match[0] : null;


    /* ----------  Calculate shop's scores  ---------- */
    const score = 1;


    const shop = yield IgUser.create({
      userId: owner.id,
      username: owner.username,
      tag: tag.tagName,
      emailInBio,
      post: {
        code: mediaNode.code,
        likeCount: mediaNode.likes.count,
        date: new Date(mediaNode.date * 1000),
      },
      recentMediaAverageLikes: {
        count: avgLikeCount,
        mediaCount: recentMediaCount,
      },
      followerCount: owner.followed_by.count,
      score,
    });

    // console.log(`${owner.id}\t${owner.username}\t${shop.followerCount}\t` +
    //             `${tag.tagName}\t${recordCount}`);
  }));

  const ended = media.nodes.length === 0;
  return [crawlCounter, apiCallCounter, ended];
}


function* _hasProfileRecord(userId, tagName) {
  const count = yield IgUser.count({ userId, tag: tagName });
  return count > 0;
}


module.exports = { crawl, clearRecords, clearAllRecords, countRecords, listRecords };
