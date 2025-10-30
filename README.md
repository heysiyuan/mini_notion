# Mini Notion Clone

A simplified Notion clone built with React, TypeScript, Express, and SQLite.

## Features

- **Step 1 Complete**: Load and render blocks (text and image blocks) from SQLite database ✅
- **Step 2 Complete**: Add new blocks and save them to the database ✅
  - Text blocks: Edit text content and choose between H1, H2, H3, or paragraph styles
  - Image blocks: Customize source URL, width, and height
  - Drag-and-drop image upload from local computer
  - Automatic dimension detection for images
  - All blocks persist to SQLite backend
- **Step 3 Complete**: Re-order blocks with drag-and-drop ✅
  - Native HTML5 drag-and-drop implementation
  - Visual drag handle appears on hover
  - Position changes persist to database
- **Step 4 Complete**: Edit existing blocks ✅
  - Click any text block to edit content and style
  - Click any image block to change image or dimensions
  - Changes save instantly to database

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS

### Backend
- Node.js
- Express
- TypeScript
- SQLite3

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── server.ts      # Express server
│   │   ├── database.ts    # SQLite database setup
│   │   └── types.ts       # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── types.ts       # TypeScript types
│   │   └── components/
│   │       └── BlockComponent.tsx  # Block rendering
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server (from `backend/` directory):
```bash
npm run dev
```
The server will run on `http://localhost:3001`

2. Start the frontend development server (from `frontend/` directory):
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### API Endpoints

- `GET /api/blocks` - Fetch all blocks ordered by position
- `POST /api/blocks` - Create a new block
  - Body: `{ type, content?, style?, imageUrl?, width?, height?, position }`
- `POST /api/upload` - Upload an image file
  - Form data with 'image' field
  - Returns: `{ imageUrl }`
- `PUT /api/blocks/:id` - Update a block's position or content
  - Body: `{ position?, content?, style?, imageUrl?, width?, height? }`

## Block Types

### Text Block
- Supports multiple styles: H1, H2, H3, and paragraph
- Content stored as plain text

### Image Block
- Supports custom URL
- Configurable width and height

## Development Timeline

- **Commit 1**: Backend setup with Express, TypeScript, and SQLite
- **Commit 2**: Frontend setup with React components for rendering blocks
- **Commit 3**: README documentation
- **Commit 4**: POST /api/blocks endpoint for creating blocks
- **Commit 5**: Block creation UI with text and image editors
- **Commit 6**: README update for Step 2
- **Commit 7**: PUT endpoint to update block positions
- **Commit 8**: Drag-and-drop reordering with position persistence
- **Commit 9**: README update for Step 3
- **Commit 10**: Fix scroll to top after drag-and-drop
- **Commit 11**: Image upload endpoint with multer
- **Commit 12**: Drag-and-drop image upload with auto dimension detection
- **Commit 13**: Automatic image resizing to fit page width
- **Commit 14**: Update PUT endpoint to support editing block content
- **Commit 15**: Click-to-edit functionality for text and image blocks

## All Core Requirements Complete! 🎉

- Step 4: Edit existing blocks
