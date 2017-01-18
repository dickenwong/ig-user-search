'use strict';

const Page = require('./page');


class Post extends Page {
  constructor(code) {
    super();
    this.code = code;
  }

  *init() {
    const initial = yield this.loadInitial(`p/${this.code}/`);
    const mediaData = initial.entry_data.PostPage[0].media;
    Object.assign(this, {
      mediaId: mediaData.id,
      caption: mediaData.caption,
      date: new Date(mediaData.date * 1000),
      comments: {
        count: mediaData.comments.count,
        nodes: mediaData.comments.nodes,
      },
      likes: {
        count: mediaData.likes.count,
        nodes: mediaData.likes.nodes,
      },
      owner: {
        userId: mediaData.owner.id,
        username: mediaData.owner.username,
      },
      isVideo: mediaData.is_video,
      isAd: mediaData.is_ad,
      displaySrc: mediaData.display_src,
      mediaDimensions: mediaData.dimensions,
      tags: Post.captionToTags(mediaData.caption),
    });
    return mediaData;
  }

  static captionToTags(caption) {
    return (caption || '').match(/#[^\s#]+/g) || [];
  }

  toData() {
    const properties = [
      'code',
      'mediaId',
      'caption',
      'date',
      'comments',
      'likes',
      'owner',
      'isVideo',
      'isAd',
      'displaySrc',
      'mediaDimensions',
      'tags',
    ];
    const data = super.toData(this, properties);
    return data;
  }

}

module.exports = Post;
