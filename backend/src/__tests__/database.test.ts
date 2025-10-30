import sqlite3 from 'sqlite3';
import { setupTestDb, cleanupTestDb, dbRun, dbAll, dbGet, closeTestDb } from './testSetup';
import { Block } from '../types';

describe('Database Operations', () => {
  let testDb: sqlite3.Database;

  beforeAll(async () => {
    testDb = await setupTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb(testDb);
  });

  afterAll(async () => {
    await closeTestDb(testDb);
  });

  describe('Block Creation', () => {
    it('should create a text block with all properties', async () => {
      const result = await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['text', 'Test Heading', 'h1', null, null, null, 0]
      );

      expect(result.lastID).toBe(1);
      expect(result.changes).toBe(1);

      const blocks = await dbAll(testDb, 'SELECT * FROM blocks WHERE id = ?', [result.lastID]) as Block[];
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toMatchObject({
        id: 1,
        type: 'text',
        content: 'Test Heading',
        style: 'h1',
        position: 0,
      });
      expect(blocks[0].imageUrl).toBeNull();
      expect(blocks[0].createdAt).toBeDefined();
      expect(blocks[0].updatedAt).toBeDefined();
    });

    it('should create an image block with dimensions', async () => {
      const result = await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['image', null, null, 'http://example.com/image.jpg', 800, 600, 0]
      );

      const blocks = await dbAll(testDb, 'SELECT * FROM blocks WHERE id = ?', [result.lastID]) as Block[];
      
      expect(blocks[0]).toMatchObject({
        type: 'image',
        imageUrl: 'http://example.com/image.jpg',
        width: 800,
        height: 600,
        position: 0,
      });
      expect(blocks[0].content).toBeNull();
      expect(blocks[0].style).toBeNull();
    });

    it('should auto-increment block IDs', async () => {
      const result1 = await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`,
        ['text', 'First block', 0]
      );

      const result2 = await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`,
        ['text', 'Second block', 1]
      );

      expect(result1.lastID).toBe(1);
      expect(result2.lastID).toBe(2);
    });
  });

  describe('Block Retrieval', () => {
    beforeEach(async () => {
      // Insert test data
      await dbRun(testDb, 
        `INSERT INTO blocks (type, content, style, position) VALUES (?, ?, ?, ?)`,
        ['text', 'First heading', 'h1', 0]
      );
      await dbRun(testDb,
        `INSERT INTO blocks (type, imageUrl, width, height, position) VALUES (?, ?, ?, ?, ?)`,
        ['image', 'http://example.com/img.jpg', 800, 600, 1]
      );
      await dbRun(testDb,
        `INSERT INTO blocks (type, content, style, position) VALUES (?, ?, ?, ?)`,
        ['text', 'Paragraph text', 'p', 2]
      );
    });

    it('should retrieve all blocks', async () => {
      const blocks = await dbAll(testDb, 'SELECT * FROM blocks ORDER BY position ASC') as Block[];

      expect(blocks).toHaveLength(3);
      expect(blocks[0].content).toBe('First heading');
      expect(blocks[1].type).toBe('image');
      expect(blocks[2].content).toBe('Paragraph text');
    });

    it('should retrieve blocks in correct position order', async () => {
      const blocks = await dbAll(testDb, 'SELECT * FROM blocks ORDER BY position ASC') as Block[];

      expect(blocks[0].position).toBe(0);
      expect(blocks[1].position).toBe(1);
      expect(blocks[2].position).toBe(2);
    });

    it('should retrieve a single block by ID', async () => {
      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [1]) as Block;

      expect(block).toBeDefined();
      expect(block.id).toBe(1);
      expect(block.content).toBe('First heading');
    });

    it('should return undefined for non-existent block', async () => {
      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [999]);

      expect(block).toBeUndefined();
    });

    it('should count blocks correctly', async () => {
      const result = await dbGet(testDb, 'SELECT COUNT(*) as count FROM blocks') as { count: number };

      expect(result.count).toBe(3);
    });
  });

  describe('Block Updates', () => {
    let blockId: number;

    beforeEach(async () => {
      const result = await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, style, position) VALUES (?, ?, ?, ?)`,
        ['text', 'Original content', 'h1', 0]
      );
      blockId = result.lastID;
    });

    it('should update block position', async () => {
      const result = await dbRun(
        testDb,
        'UPDATE blocks SET position = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [5, blockId]
      );

      expect(result.changes).toBe(1);

      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [blockId]) as Block;
      expect(block.position).toBe(5);
    });

    it('should update block content and style', async () => {
      await dbRun(
        testDb,
        'UPDATE blocks SET content = ?, style = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        ['Updated content', 'h2', blockId]
      );

      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [blockId]) as Block;
      expect(block.content).toBe('Updated content');
      expect(block.style).toBe('h2');
    });

    it('should update image properties', async () => {
      const imgResult = await dbRun(
        testDb,
        `INSERT INTO blocks (type, imageUrl, width, height, position) VALUES (?, ?, ?, ?, ?)`,
        ['image', 'http://example.com/old.jpg', 800, 600, 1]
      );

      await dbRun(
        testDb,
        'UPDATE blocks SET imageUrl = ?, width = ?, height = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        ['http://example.com/new.jpg', 1000, 800, imgResult.lastID]
      );

      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [imgResult.lastID]) as Block;
      expect(block.imageUrl).toBe('http://example.com/new.jpg');
      expect(block.width).toBe(1000);
      expect(block.height).toBe(800);
    });

    it('should update multiple fields at once', async () => {
      await dbRun(
        testDb,
        'UPDATE blocks SET content = ?, style = ?, position = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        ['New content', 'h3', 10, blockId]
      );

      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [blockId]) as Block;
      expect(block.content).toBe('New content');
      expect(block.style).toBe('h3');
      expect(block.position).toBe(10);
    });

    it('should return 0 changes when updating non-existent block', async () => {
      const result = await dbRun(
        testDb,
        'UPDATE blocks SET position = ? WHERE id = ?',
        [5, 999]
      );

      expect(result.changes).toBe(0);
    });
  });

  describe('Position Management', () => {
    it('should handle reordering blocks', async () => {
      // Create 3 blocks
      await dbRun(testDb, `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`, ['text', 'Block 1', 0]);
      await dbRun(testDb, `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`, ['text', 'Block 2', 1]);
      await dbRun(testDb, `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`, ['text', 'Block 3', 2]);

      // Move Block 1 (id: 1) to position 2
      await dbRun(testDb, 'UPDATE blocks SET position = ? WHERE id = ?', [2, 1]);

      // Verify new positions
      const blocks = await dbAll(testDb, 'SELECT * FROM blocks ORDER BY position ASC') as Block[];
      
      // After moving, we should still have all 3 blocks
      expect(blocks).toHaveLength(3);
      
      // Find the block we moved
      const movedBlock = blocks.find(b => b.id === 1);
      expect(movedBlock?.position).toBe(2);
    });

    it('should handle multiple blocks at same position', async () => {
      // SQLite allows duplicate positions - application logic should handle this
      await dbRun(testDb, `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`, ['text', 'Block 1', 0]);
      await dbRun(testDb, `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`, ['text', 'Block 2', 0]);

      const blocks = await dbAll(testDb, 'SELECT * FROM blocks WHERE position = ?', [0]) as Block[];
      expect(blocks).toHaveLength(2);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve timestamps on creation', async () => {
      const result = await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, position) VALUES (?, ?, ?)`,
        ['text', 'Test', 0]
      );

      const block = await dbGet(testDb, 'SELECT * FROM blocks WHERE id = ?', [result.lastID]) as Block;
      
      expect(block.createdAt).toBeDefined();
      expect(block.updatedAt).toBeDefined();
      expect(typeof block.createdAt).toBe('string');
      expect(typeof block.updatedAt).toBe('string');
    });

    it('should handle null values correctly', async () => {
      await dbRun(
        testDb,
        `INSERT INTO blocks (type, content, style, imageUrl, width, height, position) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['text', null, null, null, null, null, 0]
      );

      const blocks = await dbAll(testDb, 'SELECT * FROM blocks') as Block[];
      const block = blocks[0];

      expect(block.content).toBeNull();
      expect(block.style).toBeNull();
      expect(block.imageUrl).toBeNull();
      expect(block.width).toBeNull();
      expect(block.height).toBeNull();
    });
  });
});
