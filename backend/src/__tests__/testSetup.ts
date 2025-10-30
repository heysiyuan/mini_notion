import sqlite3 from 'sqlite3';
import path from 'path';

let testDb: sqlite3.Database;

export function getTestDb(): sqlite3.Database {
  if (!testDb) {
    testDb = new sqlite3.Database(':memory:');
  }
  return testDb;
}

export function dbRun(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function setupTestDb(): Promise<sqlite3.Database> {
  const db = getTestDb();
  
  await dbRun(db, `
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      content TEXT,
      style TEXT,
      imageUrl TEXT,
      width INTEGER,
      height INTEGER,
      position INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export async function cleanupTestDb(db: sqlite3.Database): Promise<void> {
  await dbRun(db, 'DELETE FROM blocks');
}

export async function closeTestDb(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
