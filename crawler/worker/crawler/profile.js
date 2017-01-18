'use strict';

const bigInt = require('big-integer');
const Page = require('./page');
const { PrivateProfile, EmptyProfile } = require('./errors');


class Profile extends Page {
  constructor(username) {
    super();
    this.username = username;
  }

  *init() {
    const initial = yield this.loadInitial(`${this.username}/`);
    const userData = initial.entry_data.ProfilePage[0].user;
    if (userData.is_private) throw new PrivateProfile();
    if (userData.media.count === 0) throw new EmptyProfile();

    Object.assign(this, {
      userId: userData.id,
      latestMediaId: userData.media.page_info.start_cursor,
      followingCount: userData.follows.count,
      followerCount: userData.followed_by.count,
      fullName: userData.full_name,
      biography: userData.biography,
      media: { nodes: [], count: userData.media.count },
    });
    return userData;
  }

  *nextMedia(nodeCount = 12) {
    if (!this.api) yield this.init();
    const startCursor = (this.media && this.media.lastEndCursor)
      ? this.media.lastEndCursor
      : bigInt(this.latestMediaId).plus(1).toString();
    const query = [
      `ig_user(${this.userId}) { `,
      `  media.after(${startCursor}, ${nodeCount}) {`,
      '    count,',
      '    nodes {',
      '      caption,',
      '      code,',
      '      comments { count },',
      '      date,',
      '      dimensions { height, width },',
      '      display_src,',
      '      id,',
      '      is_video,',
      '      likes { count },',
      '      owner { id, username },',
      '      thumbnail_src',
      '    },',
      '    page_info',
      '  }',
      '}',
    ];
    const content = yield this.api.queryRequest({
      form: {
        q: query.join('\n'),
        ref: 'users::show',
      },
    });
    if (content.status !== 'ok') throw new Error('Cannot get user media');
    this.media.nodes.push(...content.media.nodes);
    this.media.lastEndCursor = content.media.page_info.end_cursor;
    this.media.ended = !content.media.page_info.has_next_page;
    return content.media;
  }

  toData() {
    const properties = [
      'username',
      'userId',
      'latestMediaId',
      'followingCount',
      'followerCount',
      'fullName',
      'biography',
      'media',
    ];
    const data = super.toData(this, properties);
    return data;
  }

}

module.exports = Profile;
