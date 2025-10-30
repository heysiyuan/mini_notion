# Mini Notion Clone

A simplified Notion clone built with React, TypeScript, Express, and SQLite.

## Features

- **Step 1 Complete**: Load and render blocks (text and image blocks) from SQLite database ✅

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

## Next Steps

- Step 2: Add new blocks and save them
- Step 3: Re-order blocks
- Step 4: Edit existing blocks
