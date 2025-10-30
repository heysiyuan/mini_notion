# Mini Notion Clone - Design Document

## System Overview

A simplified Notion clone for creating, editing, and reordering text/image blocks with undo/redo support.

**Tech Stack**: React 18 + TypeScript (frontend), Express + SQLite3 (backend), Jest (testing)

**Core Features**:
1. Load/render blocks from database
2. Create text (H1/H2/H3/paragraph) and image blocks
3. Drag-and-drop reordering
4. Click-to-edit functionality
5. Undo/redo with ⌘Z/⌘⇧Z

---

---

## Architecture

### System Diagram
```
React App (State + History)
    ↓ HTTP/REST
Express Server (API + Multer)
    ↓ SQL
SQLite Database (blocks table)
```

### Component Hierarchy
```
App (main state, undo/redo)
├── DraggableBlock → BlockComponent (text/image rendering)
├── TextBlockEditor (create/edit text)
├── ImageBlockEditor (upload/edit images)
└── AddBlockMenu (type selector)
```

---

## Database Schema

```sql
CREATE TABLE blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'text' | 'image'
  content TEXT,                    -- Text content (null for images)
  style TEXT,                      -- 'h1'|'h2'|'h3'|'p' (null for images)
  imageUrl TEXT,                   -- Image path (null for text)
  width INTEGER,                   -- Image dimensions
  height INTEGER,
  position INTEGER NOT NULL,       -- Display order (0-based)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Design Choice**: Single table with nullable fields for simplicity. Position field enables ordered retrieval.

---

## API Endpoints

| Method | Endpoint | Purpose | Request Body |
|--------|----------|---------|--------------|
| GET | `/api/blocks` | Fetch all blocks ordered by position | - |
| POST | `/api/blocks` | Create new block | `{type, content?, style?, imageUrl?, width?, height?, position}` |
| PUT | `/api/blocks/:id` | Update block properties | `{position?, content?, style?, imageUrl?, width?, height?}` |
| POST | `/api/upload` | Upload image file | `multipart/form-data` with 'image' field |

**Response Format**: All endpoints return Block objects or arrays with status codes 200/201/400/404/500.

---

## State Management

### Main App State
```typescript
blocks: Block[]                    // Current block list
editingType: 'text' | 'image' | null
editingBlock: Block | null         // Block being edited
draggedIndex: number | null        // Drag state
```

### History State (useHistory hook)
```typescript
history: HistoryState[]            // Array of {blocks, timestamp}
currentIndex: number               // Position in history (0 to length-1)
canUndo: boolean                   // currentIndex > 0
canRedo: boolean                   // currentIndex < history.length - 1
```

**Operations**:
- `saveState(blocks)`: Deep copy blocks, append to history (max 50 states)
- `undo()`: Decrement index, return previous state, sync to backend
- `redo()`: Increment index, return next state, sync to backend

---

## Key Algorithms

### Drag-and-Drop Reorder
```
1. onDragStart: Store dragged index
2. onDragOver: Reorder array in-place (optimistic UI)
3. onDragEnd: PUT all blocks with new positions to backend
4. On success: Save state to history
5. On error: Revert by refetching from database
```

### Undo/Redo Flow
```
1. Keyboard event: ⌘Z (undo) or ⌘⇧Z (redo)
2. Check canUndo/canRedo flag
3. Set isRestoring flag (prevents circular saves)
4. Get state from history[newIndex]
5. Update UI: setBlocks(restoredState)
6. Sync all blocks to backend (PUT for each)
7. Clear isRestoring after 100ms
```

**Tracked Operations**: Block creation, updates, and reordering all call `saveState(blocks)` after successful backend sync.

### Image Upload
```
1. User drops file or selects from picker
2. POST to /api/upload (Multer middleware)
3. Save to backend/uploads/ with unique filename
4. Load image in browser to detect dimensions
5. Update form with imageUrl, width, height
6. User saves → POST/PUT to /api/blocks
```

---

## Design Decisions

### 1. Single-Table Schema
**Why**: Simplifies position management and querying. Easy to add new block types.  
**Trade-off**: Nullable fields waste space, but acceptable for small-scale app.

### 2. Integer Positions (0, 1, 2...)
**Why**: Simple mapping to array indices, efficient sorting.  
**Trade-off**: O(n) updates on reorder. Alternative (fractional indexing) adds complexity.

### 3. Client-Side History
**Why**: Instant undo/redo without network latency, works offline.  
**Trade-off**: Lost on refresh, 50-state limit. Future: server-side event sourcing.

### 4. Deep Copy via JSON
**Why**: Simple, no dependencies, complete isolation of snapshots.  
**Trade-off**: Performance cost for large lists (mitigated by 50-state limit).

### 5. Local Disk Storage (Images)
**Why**: Simple MVP setup, fast access.  
**Trade-off**: Not scalable. Future: S3/Cloudinary for production.

### 6. Optimistic UI Updates
**Why**: Instant feedback improves UX (e.g., drag-drop feels responsive).  
**Implementation**: Update state first, sync backend, revert on error.

### 7. REST over GraphQL
**Why**: Simpler for CRUD operations, easy testing.  
**Trade-off**: Multiple endpoints, some over-fetching. GraphQL considered for future.

---

## Testing

**Backend (31 tests)**:
- API endpoints: GET/POST/PUT with validation, error handling
- Database operations: CRUD, position updates, constraints
- In-memory SQLite for test isolation

**Coverage**: 100% pass rate, Jest + Supertest

---

## Future Enhancements

1. **Block Deletion**: DELETE endpoint + position recalculation
2. **Rich Text**: Integrate Slate.js/TipTap for formatting
3. **More Block Types**: Code, checkbox, embed, divider
4. **Persistent History**: `block_history` table for cross-session undo
5. **Collaboration**: WebSockets + CRDT for real-time editing
6. **Keyboard Navigation**: Arrow keys, Enter, Backspace shortcuts
7. **Search**: SQLite FTS5 for full-text search
8. **Export**: Markdown/PDF generation
9. **Performance**: Virtual scrolling (React Virtualized), Immer for immutability
10. **PWA**: Offline support with Service Workers + IndexedDB

---

**Version**: 1.0  
**Last Updated**: October 30, 2025
