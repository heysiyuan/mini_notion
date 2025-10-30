# Mini Notion Clone

A simplified Notion clone built with React, TypeScript, Express, and SQLite.

## Features

- **Load and Render**: Display text and image blocks from SQLite database
  - Text blocks with multiple styles (H1, H2, H3, paragraph)
  - Image blocks with custom dimensions
- **Create Blocks**: Add new text and image blocks
  - Drag-and-drop image upload from local computer
  - Automatic dimension detection for images
  - All blocks persist to SQLite backend
- **Reorder Blocks**: Drag-and-drop repositioning
  - Native HTML5 drag-and-drop implementation
  - Visual drag handle appears on hover
  - Position changes persist to database
- **Edit Blocks**: Click-to-edit existing content
  - Click any text block to edit content and style
  - Click any image block to change image or dimensions
  - Changes save instantly to database
- **Undo/Redo**: Full history management
  - Press `⌘Z` (Mac) or `Ctrl+Z` (Windows/Linux) to undo
  - Press `⌘⇧Z` (Mac) or `Ctrl+Shift+Z` (Windows/Linux) to redo
  - Tracks all operations: create, edit, reorder
  - Syncs changes with backend database
  - Visual indicator shows undo/redo availability

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

### Testing
- Jest
- Supertest (API testing)
- ts-jest (TypeScript support)

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── server.ts      # Express server
│   │   ├── database.ts    # SQLite database setup
│   │   ├── types.ts       # TypeScript types
│   │   └── __tests__/
│   │       ├── api.test.ts        # API endpoint tests
│   │       ├── database.test.ts   # Database operation tests
│   │       └── testSetup.ts       # Test utilities
│   ├── package.json
│   ├── jest.config.js
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── types.ts       # TypeScript types
│   │   ├── hooks/
│   │   │   └── useHistory.ts      # Undo/redo history management
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

## Testing

### Running Backend Tests

The backend has comprehensive test coverage with 31 tests covering:
- API endpoint functionality (GET, POST, PUT)
- Database operations (create, read, update)
- Error handling and validation
- Data integrity

Run tests from the `backend/` directory:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### Test Coverage

**API Endpoint Tests** (`api.test.ts` - 14 tests):
- `GET /api/blocks`: Returns blocks ordered by position, handles empty state and errors
- `POST /api/blocks`: Creates text and image blocks, validates required fields, handles errors
- `PUT /api/blocks/:id`: Updates positions, content, styles, images, validates input, handles not found

**Database Operation Tests** (`database.test.ts` - 17 tests):
- Block Creation: Text blocks, image blocks, auto-increment IDs
- Block Retrieval: Fetch all blocks, order by position, fetch by ID, count blocks
- Block Updates: Position updates, content/style updates, image property updates, multi-field updates
- Position Management: Reordering blocks, handling duplicate positions
- Data Integrity: Timestamp preservation, null value handling

All tests use an in-memory SQLite database for isolation and speed.

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
- Supports custom URL or file upload
- Configurable width and height
- Automatic dimension detection

## Keyboard Shortcuts

- `⌘Z` / `Ctrl+Z` - Undo last action
- `⌘⇧Z` / `Ctrl+Shift+Z` - Redo last undone action

The undo/redo system tracks:
- Block creation
- Block content/style edits
- Image property changes
- Block reordering via drag-and-drop
