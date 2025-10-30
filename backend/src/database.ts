import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

const db = new sqlite3.Database(path.join(__dirname, '../database.db'));

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize database
async function initDatabase() {
  // Create blocks table
  await dbRun(`
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

  // Insert sample data if the table is empty
  const count = await dbGet('SELECT COUNT(*) as count FROM blocks') as { count: number };

  if (count.count === 0) {
    await dbRun(`
      INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['text', '# Welcome to Mini Notion', 'h1', null, null, null, 0]);

    await dbRun(`
      INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['text', 'This is a simple Notion clone built with React and TypeScript', 'p', null, null, null, 1]);

    await dbRun(`
      INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['image', null, null, 'https://picsum.photos/800/400', 800, 400, 2]);

    await dbRun(`
      INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['text', '## Features', 'h2', null, null, null, 3]);

    await dbRun(`
      INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['text', 'Load and render blocks from SQLite database', 'p', null, null, null, 4]);

    console.log('Sample data inserted');
  }
}

export { db, dbAll, dbRun, initDatabase };
