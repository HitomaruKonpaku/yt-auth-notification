// Jest mock for youtubei.js — ESM-only package, cannot be loaded by ts-jest
// All tests mock YTProvider anyway, so this is a no-op stub

export default class Innertube {
  static async create(_opts?: Record<string, unknown>) {
    return new Innertube();
  }

  async getNotifications() {
    return { contents: [] };
  }
}

export const Log = {
  Level: { NONE: 0, ERROR: 1, WARNING: 2, INFO: 3, DEBUG: 4 },
  setLevel(_level: number) { },
};

export const YTNodes = {};
