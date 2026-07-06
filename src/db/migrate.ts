import { Logger } from '@nestjs/common';
import BetterSqlite3 from 'better-sqlite3';

const logger = new Logger('Migration');
const dbPath = `${process.env.DATA_DIR || './data'}/database.sqlite`;

export function runMigrations(): void {
  let db: BetterSqlite3.Database;

  try {
    db = new BetterSqlite3(dbPath);
  } catch {
    logger.warn(`Could not open ${dbPath}, skipping migrations`);
    return;
  }

  try {
    const cols = db.pragma('table_info(post)') as { name: string }[];
    migratePostIdColumn(db, cols);
    backfillPostInitiator(db, cols);
    backfillPostType(db, cols);
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
