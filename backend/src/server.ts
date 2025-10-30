import express from 'express';
import cors from 'cors';
import { dbAll, initDatabase } from './database';
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

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
