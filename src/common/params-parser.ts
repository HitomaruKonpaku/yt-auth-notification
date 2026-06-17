import { BinaryReader } from '@bufbuild/protobuf/wire';

export interface PostParams {
  post_id: string;
  channel_id: string;
}

export function decodePostParams(params: string): PostParams | null {
  if (!params) {
    return null;
  }

  let buf: Uint8Array;
  try {
    buf = Buffer.from(params, 'base64');
  } catch {
    return null;
  }

  try {
    const reader = new BinaryReader(buf);
    const result = walkCommunityPostParams(reader);
    if (result && result.channel_id && result.post_id) {
      return { post_id: result.post_id, channel_id: result.channel_id };
    }
    return null;
  } catch {
    return null;
  }
}

interface RawPostParams {
  post_id: string;
  channel_id: string;
}

function walkCommunityPostParams(reader: BinaryReader): RawPostParams | null {
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    const fieldNum = tag >>> 3;
    const wireType = tag & 7;

    // Field 56: CommunityPostParams_Field1 (nested message)
    if (fieldNum === 56 && wireType === 2) {
      return walkField1(reader);
    }

    reader.skip(wireType);
  }
  return null;
}

function walkField1(reader: BinaryReader): RawPostParams {
  const result: RawPostParams = { channel_id: '', post_id: '' };
  const len = reader.uint32();
  const end = reader.pos + len;

  while (reader.pos < end) {
    const tag = reader.uint32();
    const fieldNum = tag >>> 3;
    const wireType = tag & 7;

    if (wireType === 2) {
      if (fieldNum === 2) {
        result.channel_id = reader.string();
      } else if (fieldNum === 3) {
        result.post_id = reader.string();
      } else if (fieldNum === 11) {
        // ucid2 - duplicate channel_id, use as fallback
        if (!result.channel_id) {
          result.channel_id = reader.string();
        } else {
          reader.string();
        }
      } else {
        reader.skip(wireType);
      }
    } else {
      reader.skip(wireType);
    }
  }

  return result;
}
