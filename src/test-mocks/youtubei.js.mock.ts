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
