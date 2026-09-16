import BetterSqlite3 from 'better-sqlite3';
import { migrateNotificationMessage, unwrapMessage } from './migrate';

describe('unwrapMessage', () => {
  it('reads the old JSON shape', () => {
    expect(unwrapMessage('{"text":"Hello","rtl":false}')).toBe('Hello');
  });

  it('keeps a plain string', () => {
    expect(unwrapMessage('Hello')).toBe('Hello');
  });

  it('handles an empty value', () => {
    expect(unwrapMessage('')).toBe('');
  });

  it('handles a missing text key', () => {
    expect(unwrapMessage('{"rtl":false}')).toBe('{"rtl":false}');
  });

  it('handles non-object JSON', () => {
    expect(unwrapMessage('42')).toBe('42');
  });

  it('leaves a JSON object without rtl alone', () => {
    expect(unwrapMessage('{"text":"x"}')).toBe('{"text":"x"}');
  });

  it('leaves a non-string text alone', () => {
    expect(unwrapMessage('{"text":42,"rtl":false}')).toBe('{"text":42,"rtl":false}');
  });
});

describe('migrateNotificationMessage', () => {
  const cols = (db: BetterSqlite3.Database) =>
    db.pragma('table_info(notification)') as { name: string }[];

  it('renames short_message and unwraps the stored JSON', () => {
    const db = new BetterSqlite3(':memory:');
    db.exec('CREATE TABLE notification (id TEXT PRIMARY KEY, short_message TEXT NOT NULL)');
    db.prepare('INSERT INTO notification (id, short_message) VALUES (?, ?)')
      .run('a', '{"text":"Hello","rtl":false}');

    migrateNotificationMessage(db, cols(db));

    const names = cols(db).map(c => c.name);
    expect(names).toContain('message');
    expect(names).not.toContain('short_message');
    expect(db.prepare('SELECT message FROM notification WHERE id = ?').get('a')).toEqual({ message: 'Hello' });
    db.close();
  });

  it('leaves a message column alone', () => {
    const db = new BetterSqlite3(':memory:');
    db.exec('CREATE TABLE notification (id TEXT PRIMARY KEY, message TEXT NOT NULL)');
    db.prepare('INSERT INTO notification (id, message) VALUES (?, ?)').run('a', 'Hello');

    migrateNotificationMessage(db, cols(db));

    expect(db.prepare('SELECT message FROM notification WHERE id = ?').get('a')).toEqual({ message: 'Hello' });
    db.close();
  });

  it('returns early when the table is missing', () => {
    const db = new BetterSqlite3(':memory:');

    expect(() => migrateNotificationMessage(db, cols(db))).not.toThrow();

    db.close();
  });
});
