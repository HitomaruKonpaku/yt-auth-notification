import { parseBrowseItems, parseMessage, parseRawNotification } from './notification-parser';

const VIDEO_RENDERER = {
  notificationId: '1001',
  shortMessage: { runs: [{ text: 'Channel A' }, { text: ' uploaded: Video' }] },
  thumbnail: { thumbnails: [{ url: 'https://avatar/a.jpg' }] },
  navigationEndpoint: {
    commandMetadata: { webCommandMetadata: { url: '/watch?v=VID1' } },
    watchEndpoint: { videoId: 'VID1' },
  },
};

const COMMENT_RENDERER = {
  notificationId: '1002',
  shortMessage: { simpleText: 'Channel B replied to your comment' },
  thumbnail: { thumbnails: [{ url: 'https://avatar/b.jpg' }] },
  navigationEndpoint: {
    commandMetadata: { webCommandMetadata: { url: '/watch?v=VID2&lc=LC2' } },
    getCommentsFromInboxCommand: { videoId: 'VID2', linkedCommentId: 'LC2' },
  },
};

const POST_RENDERER = {
  notificationId: '1003',
  shortMessage: { runs: [{ text: 'Channel C' }, { text: ' posted: Hello' }] },
  thumbnail: { thumbnails: [{ url: 'https://avatar/c.jpg' }] },
  navigationEndpoint: {
    commandMetadata: { webCommandMetadata: { url: '/post/Ugkx' } },
    browseEndpoint: { browseId: 'FEpost_detail', params: 'PARAMS' },
  },
};

const WRAPPED_RENDERER = {
  notificationId: '1006',
  shortMessage: { simpleText: 'Channel D uploaded: Wrapped' },
  navigationEndpoint: {
    commandMetadata: { webCommandMetadata: { url: '/watch?v=VID9' } },
    innertubeCommand: { watchEndpoint: { videoId: 'VID9' } },
  },
};

describe('parseMessage', () => {
  it('joins the runs', () => {
    expect(parseMessage({ runs: [{ text: 'Channel A' }, { text: ' uploaded: Video' }] }))
      .toBe('Channel A uploaded: Video');
  });

  it('falls back to simpleText', () => {
    expect(parseMessage({ simpleText: 'Hello' })).toBe('Hello');
  });

  it('returns an empty string for empty input', () => {
    expect(parseMessage(undefined)).toBe('');
  });
});

describe('parseRawNotification', () => {
  it('maps a video notification', () => {
    expect(parseRawNotification(VIDEO_RENDERER)).toEqual({
      notification_id: '1001',
      short_message: { text: 'Channel A uploaded: Video', rtl: false },
      thumbnails: [{ url: 'https://avatar/a.jpg' }],
      endpoint: {
        metadata: { url: '/watch?v=VID1' },
        payload: { videoId: 'VID1' },
      },
    });
  });

  it('maps a comment notification', () => {
    const result = parseRawNotification(COMMENT_RENDERER);
    expect(result.endpoint?.payload).toEqual({ videoId: 'VID2', linkedCommentId: 'LC2' });
  });

  it('maps a post notification', () => {
    const result = parseRawNotification(POST_RENDERER);
    expect(result.endpoint?.payload).toEqual({ browseId: 'FEpost_detail', params: 'PARAMS' });
  });

  it('carries the rtl flag', () => {
    const result = parseRawNotification({
      notificationId: '1004',
      shortMessage: { simpleText: 'مرحبا', rtl: true },
    });
    expect(result.short_message).toEqual({ text: 'مرحبا', rtl: true });
  });

  it('unwraps a wrapped innertubeCommand', () => {
    const result = parseRawNotification(WRAPPED_RENDERER);
    expect(result.endpoint?.payload).toEqual({ videoId: 'VID9' });
  });

  it('handles a missing navigationEndpoint', () => {
    const result = parseRawNotification({ notificationId: '1005' });
    expect(result.endpoint?.payload).toEqual({});
    expect(result.thumbnails).toEqual([]);
  });
});

describe('parseBrowseItems', () => {
  it('reads the items from openPopupAction', () => {
    const data = {
      onResponseReceivedEndpoints: [{
        openPopupAction: {
          popup: {
            multiPageMenuRenderer: {
              sections: [
                { multiPageMenuNotificationSectionRenderer: { items: ['a', 'b'] } },
                { multiPageMenuNotificationSectionRenderer: { items: ['c'] } },
              ],
            },
          },
        },
      }],
    };
    expect(parseBrowseItems(data)).toEqual(['a', 'b', 'c']);
  });

  it('reads the items from appendContinuationItemsAction', () => {
    const data = {
      onResponseReceivedEndpoints: [{
        appendContinuationItemsAction: { continuationItems: ['d', 'e'] },
      }],
    };
    expect(parseBrowseItems(data)).toEqual(['d', 'e']);
  });

  it('returns an empty array when the root is missing', () => {
    expect(parseBrowseItems({})).toEqual([]);
    expect(parseBrowseItems(undefined)).toEqual([]);
  });

  it('returns an empty array when the root has neither action', () => {
    const data = {
      onResponseReceivedEndpoints: [{
        someOtherAction: { payload: 'x' },
      }],
    };
    expect(parseBrowseItems(data)).toEqual([]);
  });
});
