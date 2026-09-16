import type { RawNotification } from './notification.interface';

const ENDPOINT_KEY_SUFFIXES = ['Endpoint', 'Command'];

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

export function parseMessage(shortMessage: any): string {
  if (shortMessage?.runs?.length) {
    return shortMessage.runs.map((run: any) => run.text).join('');
  }

  if (shortMessage?.simpleText) {
    return shortMessage.simpleText;
  }

  return '';
}

export function parseRawNotification(raw: any): RawNotification {
  const navigationEndpoint = raw.navigationEndpoint;
  // youtubei.js unwraps a wrapped command first, with this precedence:
  // innertubeCommand, then command, then performOnceCommand. It reads both the
  // payload key and the metadata url from the unwrapped object.
  const wrappedEndpoint = isObject(navigationEndpoint)
    ? navigationEndpoint.innertubeCommand || navigationEndpoint.command || navigationEndpoint.performOnceCommand
    : undefined;
  const endpoint = wrappedEndpoint || navigationEndpoint;
  // youtubei.js picks the payload the same way: the first key that ends with
  // "Endpoint" or "Command", e.g. watchEndpoint or getCommentsFromInboxCommand.
  const payloadKey = isObject(endpoint)
    ? Object.keys(endpoint).find(key => ENDPOINT_KEY_SUFFIXES.some(suffix => key.endsWith(suffix)))
    : undefined;

  return {
    notification_id: raw.notificationId,
    short_message: {
      text: parseMessage(raw.shortMessage),
      rtl: !!raw.shortMessage?.rtl,
    },
    thumbnails: raw.thumbnail?.thumbnails ?? [],
    endpoint: {
      metadata: { url: endpoint?.commandMetadata?.webCommandMetadata?.url },
      payload: payloadKey ? endpoint[payloadKey] : {},
    },
  };
}

export function parseBrowseItems(data: any): any[] {
  const root = data?.onResponseReceivedEndpoints?.[0];
  if (!isObject(root)) {
    return [];
  }

  if ('openPopupAction' in root) {
    const sections = root.openPopupAction?.popup?.multiPageMenuRenderer?.sections ?? [];
    return sections
      .map((section: any) => section?.multiPageMenuNotificationSectionRenderer?.items ?? [])
      .flat();
  }

  if ('appendContinuationItemsAction' in root) {
    return root.appendContinuationItemsAction?.continuationItems ?? [];
  }

  return [];
}
