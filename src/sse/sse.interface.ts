export interface SseEvent {
  event: string;
  data: unknown;
  id?: string;
  retry?: number;
}
