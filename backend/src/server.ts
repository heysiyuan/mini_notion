import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { dbAll, dbRun, initDatabase } from './database';
import { Block } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload image endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

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

// Update block position
app.put('/api/blocks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { position, content, style, imageUrl, width, height } = req.body;

    // Build dynamic update query based on provided fields
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
    await dbRun(sql, values);

    const updatedBlock = await dbAll('SELECT * FROM blocks WHERE id = ?', [id]) as Block[];
    
    if (updatedBlock.length === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json(updatedBlock[0]);
  } catch (error) {
    console.error('Error updating block:', error);
    res.status(500).json({ error: 'Failed to update block' });
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
