export interface DiscordWebhookConfig {
  url?: string;
  msg?: string;
}

export interface AppConfig {
  interval?: number;
  maxBackoffMs?: number;
  sseKeepaliveMs?: number;
  accountInitRetries?: number;

  webhooks?: {
    discord?: DiscordWebhookConfig[];
  };
}
