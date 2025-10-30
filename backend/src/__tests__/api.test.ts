import request from 'supertest';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { setupTestDb, cleanupTestDb, dbRun, dbAll, getTestDb } from './testSetup';

// Mock the database module
jest.mock('../database', () => {
  const testSetup = require('./testSetup');
  return {
    db: testSetup.getTestDb(),
    dbAll: jest.fn(),
    dbRun: jest.fn(),
    initDatabase: jest.fn().mockResolvedValue(undefined),
  };
});

import { dbAll as mockDbAll, dbRun as mockDbRun } from '../database';

describe('API Endpoints', () => {
  let app: express.Application;
  let testDb: any;

  beforeAll(async () => {
    testDb = await setupTestDb();

    // Set up Express app (simplified version of server.ts)
    app = express();
    app.use(cors());
    app.use(express.json());

    // Get all blocks endpoint
    app.get('/api/blocks', async (req, res) => {
      try {
        const blocks = await (mockDbAll as jest.Mock)('SELECT * FROM blocks ORDER BY position ASC');
        res.json(blocks);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch blocks' });
      }
    });

    // Create a new block endpoint
    app.post('/api/blocks', async (req, res) => {
      try {
        const { type, content, style, imageUrl, width, height, position } = req.body;

        if (!type || (type !== 'text' && type !== 'image')) {
          return res.status(400).json({ error: 'Invalid block type' });
        }

        if (position === undefined || position === null) {
          return res.status(400).json({ error: 'Position is required' });
        }

        const result = await (mockDbRun as jest.Mock)(
          `INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [type, content || null, style || null, imageUrl || null, width || null, height || null, position]
        );

        const newBlock = await (mockDbAll as jest.Mock)('SELECT * FROM blocks WHERE id = ?', [result.lastID]);
        
        res.status(201).json(newBlock[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create block' });
      }
    });

    // Update block endpoint
    app.put('/api/blocks/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { position, content, style, imageUrl, width, height } = req.body;

        const updates: string[] = [];
        const values: any[] = [];

        if (position !== undefined && position !== null) {
          updates.push('position = ?');
          values.push(position);
        }

        if (content !== undefined) {
          updates.push('content = ?');
          values.push(content);
        }

        if (style !== undefined) {
          updates.push('style = ?');
          values.push(style);
        }

        if (imageUrl !== undefined) {
          updates.push('imageUrl = ?');
          values.push(imageUrl);
        }

        if (width !== undefined) {
          updates.push('width = ?');
          values.push(width);
        }

        if (height !== undefined) {
          updates.push('height = ?');
          values.push(height);
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updatedAt = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE blocks SET ${updates.join(', ')} WHERE id = ?`;
        await (mockDbRun as jest.Mock)(sql, values);

        const updatedBlock = await (mockDbAll as jest.Mock)('SELECT * FROM blocks WHERE id = ?', [id]);
        
        if (updatedBlock.length === 0) {
          return res.status(404).json({ error: 'Block not found' });
        }

        res.json(updatedBlock[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update block' });
      }
    });
  });

  beforeEach(async () => {
    await cleanupTestDb(testDb);
    jest.clearAllMocks();
  });

  describe('GET /api/blocks', () => {
    it('should return an empty array when no blocks exist', async () => {
      (mockDbAll as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/blocks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(mockDbAll).toHaveBeenCalledWith('SELECT * FROM blocks ORDER BY position ASC');
    });

    it('should return all blocks ordered by position', async () => {
      const mockBlocks = [
        {
          id: 1,
          type: 'text',
          content: 'First block',
          style: 'h1',
          imageUrl: null,
          width: null,
          height: null,
          position: 0,
          createdAt: '2025-10-30',
          updatedAt: '2025-10-30',
        },
        {
          id: 2,
          type: 'image',
          content: null,
          style: null,
          imageUrl: 'http://example.com/image.jpg',
          width: 800,
          height: 600,
          position: 1,
          createdAt: '2025-10-30',
          updatedAt: '2025-10-30',
        },
      ];

      (mockDbAll as jest.Mock).mockResolvedValue(mockBlocks);

      const response = await request(app).get('/api/blocks');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBlocks);
      expect(response.body).toHaveLength(2);
    });

    it('should handle database errors gracefully', async () => {
      (mockDbAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/blocks');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch blocks' });
    });
  });

  describe('POST /api/blocks', () => {
    it('should create a new text block successfully', async () => {
      const newBlock = {
        type: 'text',
        content: 'Test heading',
        style: 'h1',
        position: 0,
      };

      const mockCreatedBlock = {
        id: 1,
        ...newBlock,
        imageUrl: null,
        width: null,
        height: null,
        createdAt: '2025-10-30',
        updatedAt: '2025-10-30',
      };

      (mockDbRun as jest.Mock).mockResolvedValue({ lastID: 1, changes: 1 });
      (mockDbAll as jest.Mock).mockResolvedValue([mockCreatedBlock]);

      const response = await request(app)
        .post('/api/blocks')
        .send(newBlock);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 1,
        type: 'text',
        content: 'Test heading',
        style: 'h1',
        position: 0,
      });
      expect(mockDbRun).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO blocks'),
        ['text', 'Test heading', 'h1', null, null, null, 0]
      );
    });

    it('should create a new image block successfully', async () => {
      const newBlock = {
        type: 'image',
        imageUrl: 'http://example.com/test.jpg',
        width: 800,
        height: 600,
        position: 1,
      };

      const mockCreatedBlock = {
        id: 2,
        type: 'image',
        content: null,
        style: null,
        ...newBlock,
        createdAt: '2025-10-30',
        updatedAt: '2025-10-30',
      };

      (mockDbRun as jest.Mock).mockResolvedValue({ lastID: 2, changes: 1 });
      (mockDbAll as jest.Mock).mockResolvedValue([mockCreatedBlock]);

      const response = await request(app)
        .post('/api/blocks')
        .send(newBlock);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 2,
        type: 'image',
        imageUrl: 'http://example.com/test.jpg',
        width: 800,
        height: 600,
        position: 1,
      });
    });

    it('should return 400 for invalid block type', async () => {
      const invalidBlock = {
        type: 'invalid',
        content: 'Test',
        position: 0,
      };

      const response = await request(app)
        .post('/api/blocks')
        .send(invalidBlock);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid block type' });
    });

    it('should return 400 when position is missing', async () => {
      const blockWithoutPosition = {
        type: 'text',
        content: 'Test',
      };

      const response = await request(app)
        .post('/api/blocks')
        .send(blockWithoutPosition);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Position is required' });
    });

    it('should handle database errors during creation', async () => {
      (mockDbRun as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/blocks')
        .send({ type: 'text', content: 'Test', position: 0 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create block' });
    });
  });

  describe('PUT /api/blocks/:id', () => {
    it('should update block position successfully', async () => {
      const updatedBlock = {
        id: 1,
        type: 'text',
        content: 'Test',
        style: 'h1',
        imageUrl: null,
        width: null,
        height: null,
        position: 5,
        createdAt: '2025-10-30',
        updatedAt: '2025-10-30',
      };

      (mockDbRun as jest.Mock).mockResolvedValue({ changes: 1 });
      (mockDbAll as jest.Mock).mockResolvedValue([updatedBlock]);

      const response = await request(app)
        .put('/api/blocks/1')
        .send({ position: 5 });

      expect(response.status).toBe(200);
      expect(response.body.position).toBe(5);
      expect(mockDbRun).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE blocks SET position = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?'),
        [5, '1']
      );
    });

    it('should update block content and style', async () => {
      const updatedBlock = {
        id: 1,
        type: 'text',
        content: 'Updated content',
        style: 'h2',
        imageUrl: null,
        width: null,
        height: null,
        position: 0,
        createdAt: '2025-10-30',
        updatedAt: '2025-10-30',
      };

      (mockDbRun as jest.Mock).mockResolvedValue({ changes: 1 });
      (mockDbAll as jest.Mock).mockResolvedValue([updatedBlock]);

      const response = await request(app)
        .put('/api/blocks/1')
        .send({ content: 'Updated content', style: 'h2' });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Updated content');
      expect(response.body.style).toBe('h2');
    });

    it('should update image block properties', async () => {
      const updatedBlock = {
        id: 2,
        type: 'image',
        content: null,
        style: null,
        imageUrl: 'http://example.com/new-image.jpg',
        width: 1000,
        height: 800,
        position: 1,
        createdAt: '2025-10-30',
        updatedAt: '2025-10-30',
      };

      (mockDbRun as jest.Mock).mockResolvedValue({ changes: 1 });
      (mockDbAll as jest.Mock).mockResolvedValue([updatedBlock]);

      const response = await request(app)
        .put('/api/blocks/2')
        .send({ imageUrl: 'http://example.com/new-image.jpg', width: 1000, height: 800 });

      expect(response.status).toBe(200);
      expect(response.body.imageUrl).toBe('http://example.com/new-image.jpg');
      expect(response.body.width).toBe(1000);
      expect(response.body.height).toBe(800);
    });

    it('should return 400 when no fields to update', async () => {
      const response = await request(app)
        .put('/api/blocks/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'No fields to update' });
    });

    it('should return 404 when block not found', async () => {
      (mockDbRun as jest.Mock).mockResolvedValue({ changes: 0 });
      (mockDbAll as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .put('/api/blocks/999')
        .send({ position: 5 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Block not found' });
    });

    it('should handle database errors during update', async () => {
      (mockDbRun as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/blocks/1')
        .send({ position: 5 });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to update block' });
    });
  });
});
