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
    const hasPostId = cols.some(c => c.name === 'post_id');
    const hasId = cols.some(c => c.name === 'id');

    if (hasPostId && !hasId) {
      db.exec('ALTER TABLE post RENAME COLUMN post_id TO id');
      logger.log('Migrated: post.post_id → post.id');
    }
  } finally {
    db.close();
  }
}
