export interface DiscordWebhookConfig {
  url?: string;
  msg?: string;
}

export interface AppConfig {
  interval?: number;
  webhooks?: {
    discord?: DiscordWebhookConfig[];
  };
}
