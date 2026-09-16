import { Logger } from '@nestjs/common';
import BetterSqlite3 from 'better-sqlite3';

const logger = new Logger('Migration');
const dbPath = `${process.env.DATA_DIR || './data'}/database.sqlite`;

export function unwrapMessage(value: unknown): string {
  if (typeof value !== 'string' || value === '') {
    return '';
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && typeof parsed.text === 'string' && typeof parsed.rtl === 'boolean') {
      return parsed.text;
    }
    return value;
  } catch {
    return value;
  }
}

export function runMigrations(): void {
  let db: BetterSqlite3.Database;

  try {
    db = new BetterSqlite3(dbPath);
  } catch {
    logger.warn(`Could not open ${dbPath}, skipping migrations`);
    return;
  }

  try {
    const postCols = db.pragma('table_info(post)') as { name: string }[];
    migratePostIdColumn(db, postCols);
    backfillPostInitiator(db, postCols);
    backfillPostType(db, postCols);

    const notificationCols = db.pragma('table_info(notification)') as { name: string }[];
    migrateNotificationMessage(db, notificationCols);
  } finally {
    db.close();
  }
}

function migratePostIdColumn(db: BetterSqlite3.Database, cols: { name: string }[]): void {
  const hasPostId = cols.some(c => c.name === 'post_id');
  const hasId = cols.some(c => c.name === 'id');

  if (hasPostId && !hasId) {
    db.exec('ALTER TABLE post RENAME COLUMN post_id TO id');
    logger.log('Migrated: post.post_id → post.id');
  }
}

function backfillPostInitiator(db: BetterSqlite3.Database, cols: { name: string }[]): void {
  const hasInitiator = cols.some(c => c.name === 'initiator');
  if (!hasInitiator) {
    return;
  }

  const result = db.prepare(
    `UPDATE post SET initiator = 'notification'
     WHERE published_at IS NOT NULL
     AND published_at = created_at
     AND initiator IS NULL`
  ).run();
  if (result.changes > 0) {
    logger.log(`Migrated: backfilled ${result.changes} post(s) with initiator = 'notification'`);
  }
}

function backfillPostType(db: BetterSqlite3.Database, cols: { name: string }[]): void {
  const hasType = cols.some(c => c.name === 'type');
  if (!hasType) {
    return;
  }

  const result = db.prepare(
    `UPDATE post SET type = 'BackstagePost'
     WHERE initiator = 'notification'
     AND type IS NULL`
  ).run();
  if (result.changes > 0) {
    logger.log(`Migrated: backfilled ${result.changes} post(s) with type = 'BackstagePost'`);
  }
}

export function migrateNotificationMessage(db: BetterSqlite3.Database, cols: { name: string }[]): void {
  const hasShortMessage = cols.some(c => c.name === 'short_message');
  const hasMessage = cols.some(c => c.name === 'message');

  if (hasShortMessage && !hasMessage) {
    db.exec('ALTER TABLE notification RENAME COLUMN short_message TO message');
    logger.log('Migrated: notification.short_message → notification.message');
  } else if (!hasMessage) {
    return;
  }

  const rows = db.prepare('SELECT id, message FROM notification').all() as { id: string; message: string }[];
  const update = db.prepare('UPDATE notification SET message = ? WHERE id = ?');

  let changed = 0;
  for (const row of rows) {
    const unwrapped = unwrapMessage(row.message);
    if (unwrapped !== row.message) {
      update.run(unwrapped, row.id);
      changed++;
    }
  }

  if (changed > 0) {
    logger.log(`Migrated: unwrapped ${changed} notification message(s)`);
  }
}
