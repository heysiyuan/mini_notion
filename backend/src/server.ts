import express from 'express';
import cors from 'cors';
import { dbAll, dbRun, initDatabase } from './database';
import { Block } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Get all blocks
app.get('/api/blocks', async (req, res) => {
  try {
    const blocks = await dbAll('SELECT * FROM blocks ORDER BY position ASC') as Block[];
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocks' });
  }
});

// Create a new block
app.post('/api/blocks', async (req, res) => {
  try {
    const { type, content, style, imageUrl, width, height, position } = req.body;

    // Validate required fields
    if (!type || (type !== 'text' && type !== 'image')) {
      return res.status(400).json({ error: 'Invalid block type' });
    }

    if (position === undefined || position === null) {
      return res.status(400).json({ error: 'Position is required' });
    }

    // Insert the new block
    const result = await dbRun(
      `INSERT INTO blocks (type, content, style, imageUrl, width, height, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [type, content || null, style || null, imageUrl || null, width || null, height || null, position]
    );

    // Fetch the newly created block
    const newBlock = await dbAll('SELECT * FROM blocks WHERE id = ?', [result.lastID]) as Block[];
    
    res.status(201).json(newBlock[0]);
  } catch (error) {
    console.error('Error creating block:', error);
    res.status(500).json({ error: 'Failed to create block' });
  }
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
