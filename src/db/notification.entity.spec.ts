import { Notification } from './notification.entity';

describe('Notification Entity', () => {
  it('should create a notification instance with all fields', () => {
    const notif = new Notification();
    notif.id = '123';
    notif.created_at = Date.now();
    notif.sent_at = Math.trunc(Number('123') / 1000);
    notif.video_id = 'vid';
    notif.endpoint_url = '/watch?v=vid';
    notif.short_message = { text: "hi", rtl: false };
    notif.thumbnail_url = 'https://img.jpg';

    expect(notif.id).toBe('123');
    expect(notif.short_message).toEqual({ text: "hi", rtl: false });
    expect(notif.video_id).toBe('vid');
  });

  it('should allow nullable fields to be null', () => {
    const notif = new Notification();
    notif.id = '1';
    notif.created_at = 1000;
    notif.sent_at = 1;
    notif.short_message = { text: "hi", rtl: false };

    expect(notif.video_id).toBeUndefined();
    expect(notif.linked_comment_id).toBeUndefined();
    expect(notif.thumbnail_url).toBeUndefined();
  });
});
