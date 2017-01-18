'use strict';

const Page = require('./page');


class Tag extends Page {
  constructor(tagName) {
    super();
    this.tagName = tagName;
  }

  *init() {
    const initial = yield this.loadInitial(`explore/tags/${this.tagName}/`);
    const tagData = initial.entry_data.TagPage[0].tag;
    Object.assign(this, {
      latestMediaId: tagData.media.page_info.start_cursor,
      media: {
        count: 0,
        nodes: [],
        lastEndCursor: tagData.media.page_info.end_cursor,
      },
    });
    return tagData;
  }

  *nextMedia(nodeCount = 12) {
    let content;
    if (!this.api) content = yield this.init();
    else {
      const startCursor = this.media.lastEndCursor;
      const query = [
        `ig_hashtag(${this.tagName}) {`,
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
        '      owner { ',
        '        id, username, full_name, biography, ',
        '        followed_by { count } ',
        '      },',
        '      thumbnail_src,',
        '      video_views',
        '    },',
        '    page_info',
        '  }',
        '}',
      ];
      content = yield this.api.queryRequest({
        form: {
          q: query.join('\n'),
          ref: 'tags::show',
        },
      });
      if (content.status !== 'ok') throw new Error('Cannot get tag media');
    }
    this.media.nodes.push(...content.media.nodes);
    this.media.lastEndCursor = content.media.page_info.end_cursor;
    this.media.ended = !content.media.page_info.has_next_page;
    return content.media;
  }

  toData() {
    const properties = [
      'tagName',
      'latestMediaId',
      'media',
    ];
    const data = super.toData(this, properties);
    return data;
  }

}

module.exports = Tag;
