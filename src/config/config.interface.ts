export interface DiscordWebhookConfig {
  url?: string;
  msg?: string;
}

export interface AppConfig {
  /**
   * Polling interval in seconds.
   * @default 60
   */
  interval?: number;

  /**
   * Maximum exponential backoff cap in milliseconds.
   * @default 1800000 (30 minutes)
   */
  maxBackoffMs?: number;

  /**
   * SSE keepalive ping interval in milliseconds.
   * @default 30000
   */
  sseKeepaliveMs?: number;

  /**
   * Number of retries per channel during account initialization.
   * @default 3
   */
  accountInitRetries?: number;

  webhooks?: {
    discord?: DiscordWebhookConfig[];
  };
}
