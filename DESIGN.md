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

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React Application                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │    │
│  │  │   App.tsx    │  │  Components  │  │  Hooks   │ │    │
│  │  │  (Main State)│  │  (Blocks,    │  │(History) │ │    │
│  │  │              │  │   Editors)   │  │          │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST API
                          │ (JSON)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Server                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │              API Layer (server.ts)                  │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │    │
│  │  │   REST       │  │    Multer    │  │  CORS    │ │    │
│  │  │  Endpoints   │  │  (Upload)    │  │          │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Database Layer (database.ts)                │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │   Promisified SQLite3 Wrapper Functions      │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  SQLite Database                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              blocks table                           │    │
│  │  • id (PRIMARY KEY)                                 │    │
│  │  • type (text | image)                              │    │
│  │  • content, style, imageUrl                         │    │
│  │  • width, height, position                          │    │
│  │  • createdAt, updatedAt                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Design

### Schema: `blocks` Table

```sql
CREATE TABLE blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- 'text' | 'image'
  content TEXT,                    -- Text content (for text blocks)
  style TEXT,                      -- 'h1' | 'h2' | 'h3' | 'p' (for text blocks)
  imageUrl TEXT,                   -- Image URL or path (for image blocks)
  width INTEGER,                   -- Image width in pixels
  height INTEGER,                  -- Image height in pixels
  position INTEGER NOT NULL,       -- Display order (0-based)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Design Rationale

**Single Table Approach**: 
- Simpler schema management
- Easier position tracking across all block types
- Flexible for adding new block types

**Position Field**:
- Integer-based ordering (0, 1, 2, ...)
- Allows O(1) lookup by position
- Updates required when reordering (trade-off for simplicity)

**Nullable Fields**:
- `content` and `style` null for image blocks
- `imageUrl`, `width`, `height` null for text blocks
- Avoids need for polymorphic tables

**Auto-increment ID**:
- Ensures unique identifiers
- Independent of position (allows reordering without ID changes)

---

## Backend Design

### Architecture Pattern
**RESTful API with MVC-like separation**

### File Structure
```
backend/
├── src/
│   ├── server.ts       # Express app, routes, middleware
│   ├── database.ts     # DB initialization and query helpers
│   ├── types.ts        # TypeScript interfaces
│   └── __tests__/      # Test suite
│       ├── api.test.ts
│       ├── database.test.ts
│       └── testSetup.ts
```

### Key Components

#### 1. Database Layer (`database.ts`)
```typescript
// Promisified wrapper functions
function dbRun(sql: string, params: any[]): Promise<{lastID, changes}>
function dbGet(sql: string, params: any[]): Promise<row>
function dbAll(sql: string, params: any[]): Promise<rows[]>
```

**Design Choice**: Promisified wrappers instead of `better-sqlite3`
- Async/await syntax compatibility
- Node v24 compatibility (better-sqlite3 had issues)
- Consistent error handling

#### 2. API Layer (`server.ts`)

**Endpoints**:
- `GET /api/blocks` - Fetch all blocks ordered by position
- `POST /api/blocks` - Create new block
- `PUT /api/blocks/:id` - Update block (position, content, style, etc.)
- `POST /api/upload` - Upload image file

**Middleware Stack**:
1. CORS - Allow cross-origin requests
2. JSON parser - Parse request bodies
3. Multer - Handle multipart/form-data for uploads
4. Static file server - Serve uploaded images

#### 3. File Upload Strategy

**Multer Configuration**:
```typescript
storage: diskStorage({
  destination: './uploads',
  filename: `${timestamp}-${random}.${ext}`
})
fileFilter: Only images (jpeg, jpg, png, gif, webp)
limits: 10MB max file size
```

**Storage Choice**: Local disk storage
- Simpler than S3/cloud storage for MVP
- Fast access for development
- Files served via Express static middleware

---

## Frontend Design

### Component Hierarchy

```
App
├── DraggableBlock (wrapper for each block)
│   └── BlockComponent (renders text/image)
│       ├── TextBlock
│       └── ImageBlock
├── TextBlockEditor (create/edit text)
├── ImageBlockEditor (create/edit image)
└── AddBlockMenu (type selector)
```

### State Management

**Main State (App.tsx)**:
```typescript
blocks: Block[]           // Current block list
loading: boolean          // Initial load state
error: string | null      // Error messages
editingType: 'text' | 'image' | null  // Current editor
editingBlock: Block | null             // Block being edited
draggedIndex: number | null            // Drag state
```

**History State (useHistory hook)**:
```typescript
history: HistoryState[]   // Array of block snapshots
currentIndex: number      // Current position in history
```

### Component Responsibilities

#### App.tsx
- **State Management**: Centralized state for blocks
- **API Integration**: Fetch, create, update operations
- **Event Coordination**: Drag-and-drop, edit, undo/redo
- **Keyboard Shortcuts**: Command+Z, Command+Shift+Z

#### BlockComponent
- **Rendering**: Display text/image based on block type
- **Click-to-Edit**: Trigger edit mode on click
- **Auto-resize**: Scale images to fit page width (max 900px)

#### DraggableBlock
- **Drag Handlers**: `onDragStart`, `onDragOver`, `onDragEnd`
- **Visual Feedback**: Drag handle on hover
- **Position Updates**: Update block order in real-time

#### Editors (Text/Image)
- **Form Management**: Input validation and state
- **File Upload**: Drag-drop zone, file picker
- **Dimension Detection**: Automatic image sizing
- **Save/Cancel**: Persist or discard changes

---

## Undo/Redo System

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              History Stack                           │
│                                                      │
│  Index 0: [Initial state]                           │
│  Index 1: [After create block A]                    │
│  Index 2: [After edit block A]     ← currentIndex   │
│  Index 3: [After create block B]   (discarded on    │
│  Index 4: [After reorder]           new action)     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

#### History State Structure
```typescript
interface HistoryState {
  blocks: Block[];      // Deep copy of block array
  timestamp: number;    // When state was saved
}
```

#### useHistory Hook
```typescript
{
  saveState: (blocks: Block[]) => void,
  undo: () => Block[] | null,
  redo: () => Block[] | null,
  canUndo: boolean,
  canRedo: boolean,
  reset: (blocks: Block[]) => void
}
```

### Key Algorithms

#### Save State
```
1. Check if restoring (skip if true)
2. Slice history array to currentIndex + 1 (remove redo branch)
3. Deep clone blocks array
4. Append new state to history
5. Limit to 50 most recent states (memory management)
6. Increment currentIndex
```

#### Undo
```
1. Check canUndo (currentIndex > 0)
2. Set isRestoring flag
3. Decrement currentIndex
4. Retrieve state at new index
5. Update UI with restored blocks
6. Sync all block properties to backend
7. Clear isRestoring flag after 100ms
```

#### Redo
```
1. Check canRedo (currentIndex < history.length - 1)
2. Set isRestoring flag
3. Increment currentIndex
4. Retrieve state at new index
5. Update UI with restored blocks
6. Sync all block properties to backend
7. Clear isRestoring flag after 100ms
```

### Tracked Operations
- **Block Creation**: Snapshot after POST success
- **Block Update**: Snapshot after PUT success
- **Block Reorder**: Snapshot after drag-and-drop
- **Undo/Redo**: Restore from snapshot, skip save

### Design Decisions

**Deep Copy Strategy**:
- Use `JSON.parse(JSON.stringify(blocks))`
- Ensures complete independence of history states
- Prevents reference mutations

**Restoration Flag**:
- Prevents circular saves during undo/redo
- 100ms timeout ensures state updates complete
- Avoids adding undo/redo actions to history

**Backend Sync**:
- Full state sync on undo/redo
- Updates position, content, style, image properties
- Ensures database matches UI state

**History Limit**:
- 50 states maximum
- Prevents memory growth
- Sufficient for typical user sessions

---

## API Specification

### GET /api/blocks
**Purpose**: Retrieve all blocks in display order

**Request**:
```http
GET /api/blocks
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "type": "text",
    "content": "Welcome",
    "style": "h1",
    "imageUrl": null,
    "width": null,
    "height": null,
    "position": 0,
    "createdAt": "2025-10-30T12:00:00Z",
    "updatedAt": "2025-10-30T12:00:00Z"
  },
  {
    "id": 2,
    "type": "image",
    "content": null,
    "style": null,
    "imageUrl": "/uploads/123-456.jpg",
    "width": 800,
    "height": 600,
    "position": 1,
    "createdAt": "2025-10-30T12:01:00Z",
    "updatedAt": "2025-10-30T12:01:00Z"
  }
]
```

---

### POST /api/blocks
**Purpose**: Create a new block

**Request**:
```http
POST /api/blocks
Content-Type: application/json

{
  "type": "text",
  "content": "New paragraph",
  "style": "p",
  "position": 2
}
```

**Validation**:
- `type` must be "text" or "image" (required)
- `position` must be provided (required)
- Text blocks: require `content` and `style`
- Image blocks: require `imageUrl`, optionally `width`/`height`

**Response** (201 Created):
```json
{
  "id": 3,
  "type": "text",
  "content": "New paragraph",
  "style": "p",
  "imageUrl": null,
  "width": null,
  "height": null,
  "position": 2,
  "createdAt": "2025-10-30T12:02:00Z",
  "updatedAt": "2025-10-30T12:02:00Z"
}
```

**Errors**:
- 400 Bad Request: Invalid type or missing position
- 500 Internal Server Error: Database failure

---

### PUT /api/blocks/:id
**Purpose**: Update block properties

**Request**:
```http
PUT /api/blocks/3
Content-Type: application/json

{
  "content": "Updated content",
  "style": "h2"
}
```

**Supported Fields** (all optional):
- `position`: number
- `content`: string
- `style`: 'h1' | 'h2' | 'h3' | 'p'
- `imageUrl`: string
- `width`: number
- `height`: number

**Dynamic SQL Building**:
```sql
UPDATE blocks 
SET content = ?, style = ?, updatedAt = CURRENT_TIMESTAMP 
WHERE id = ?
```

**Response** (200 OK):
```json
{
  "id": 3,
  "type": "text",
  "content": "Updated content",
  "style": "h2",
  "position": 2,
  "createdAt": "2025-10-30T12:02:00Z",
  "updatedAt": "2025-10-30T12:05:00Z"
}
```

**Errors**:
- 400 Bad Request: No fields to update
- 404 Not Found: Block ID doesn't exist
- 500 Internal Server Error: Database failure

---

### POST /api/upload
**Purpose**: Upload image file and get URL

**Request**:
```http
POST /api/upload
Content-Type: multipart/form-data

[Binary image data in 'image' field]
```

**File Constraints**:
- Allowed types: jpeg, jpg, png, gif, webp
- Max size: 10MB
- Single file per request

**Response** (200 OK):
```json
{
  "imageUrl": "/uploads/1698672000000-123456789.jpg"
}
```

**Errors**:
- 400 Bad Request: No file or invalid file type
- 500 Internal Server Error: File system error

---

## Data Flow

### 1. Initial Load
```
User opens app
    ↓
App.tsx useEffect triggers
    ↓
fetchBlocks() → GET /api/blocks
    ↓
Database query: SELECT * FROM blocks ORDER BY position
    ↓
JSON response → setState(blocks)
    ↓
reset(blocks) initializes history
    ↓
Render blocks in order
```

### 2. Create Block
```
User clicks "Add Text" or "Add Image"
    ↓
setEditingType('text' | 'image')
    ↓
Editor component renders
    ↓
User fills form and clicks Save
    ↓
handleSaveBlock(blockData)
    ↓
POST /api/blocks with data
    ↓
Database: INSERT INTO blocks (...)
    ↓
Response: new block with ID
    ↓
Update state: [...blocks, newBlock]
    ↓
saveState(updatedBlocks) adds to history
    ↓
Re-render with new block
```

### 3. Edit Block
```
User clicks on block
    ↓
setEditingBlock(block), setEditingType(block.type)
    ↓
Editor renders with initialData
    ↓
User modifies and clicks Save
    ↓
handleUpdateBlock(blockData)
    ↓
PUT /api/blocks/:id with changes
    ↓
Database: UPDATE blocks SET ... WHERE id = ?
    ↓
Response: updated block
    ↓
Update state: blocks.map(b => b.id === id ? updated : b)
    ↓
saveState(updatedBlocks)
    ↓
Re-render
```

### 4. Drag-and-Drop Reorder
```
User starts dragging block
    ↓
onDragStart(index) → setDraggedIndex(index)
    ↓
User drags over another block
    ↓
onDragOver(targetIndex)
    ↓
Reorder array: splice(draggedIndex), splice(targetIndex)
    ↓
Update state immediately (optimistic UI)
    ↓
User drops block
    ↓
onDragEnd()
    ↓
PUT /api/blocks/:id with new positions (all blocks)
    ↓
Database: UPDATE blocks SET position = ? WHERE id = ?
    ↓
All updates successful
    ↓
saveState(blocks)
    ↓
Position changes persisted
```

### 5. Undo Operation
```
User presses Command+Z
    ↓
handleKeyDown → handleUndo()
    ↓
Check canUndo (currentIndex > 0)
    ↓
undo() → currentIndex--
    ↓
Retrieve history[currentIndex]
    ↓
setBlocks(previousState)
    ↓
PUT all blocks to sync backend
    ↓
Database updates for all blocks
    ↓
UI restored to previous state
```

### 6. Image Upload
```
User drags image file into editor
    ↓
File drop event triggers
    ↓
Create FormData with file
    ↓
POST /api/upload
    ↓
Multer middleware processes file
    ↓
Save to backend/uploads/ with unique name
    ↓
Response: { imageUrl: "/uploads/..." }
    ↓
Load image to detect dimensions
    ↓
new Image(), onload → width, height
    ↓
Update form state with url and dimensions
    ↓
User saves block
    ↓
Continue with create/update flow
```

---

## Design Decisions

### 1. Single-Table Schema
**Decision**: One `blocks` table for all block types

**Rationale**:
- Simplifies position management (ORDER BY position)
- Easy to add new block types (just add nullable columns)
- Reduces JOIN complexity

**Trade-off**:
- Some nullable fields (wasted space for unused fields)
- Type safety handled at application layer

**Alternative Considered**: Separate tables for text/image
- Rejected due to complex position coordination

---

### 2. Position-Based Ordering
**Decision**: Integer `position` field (0, 1, 2, ...)

**Rationale**:
- Simple to understand and implement
- Direct mapping to array indices
- Efficient sorting with INDEX

**Trade-off**:
- Requires updating all positions on reorder
- O(n) updates for single drag-and-drop

**Alternative Considered**: Fractional indexing (position as float)
- Rejected for MVP simplicity
- Could use for future optimization

---

### 3. REST vs GraphQL
**Decision**: RESTful API with JSON

**Rationale**:
- Simpler setup (no schema definition)
- Well-understood patterns
- Sufficient for CRUD operations
- Easy testing with Supertest

**Trade-off**:
- Multiple endpoints vs single GraphQL endpoint
- Over-fetching (GET /api/blocks returns all fields)

**Future Consideration**: GraphQL for complex queries

---

### 4. Client-Side State vs Server-Side Rendering
**Decision**: Client-side React SPA

**Rationale**:
- Rich interactivity (drag-drop, undo/redo)
- Instant UI updates (optimistic rendering)
- Simpler deployment (separate frontend/backend)

**Trade-off**:
- Initial load time (JS bundle)
- SEO considerations (not relevant for editor)

---

### 5. History Implementation: Client vs Server
**Decision**: Client-side history stack

**Rationale**:
- Instant undo/redo (no network latency)
- Works offline
- Simpler backend (no history table)

**Trade-off**:
- History lost on page refresh
- 50-state limit for memory management
- No cross-device history

**Alternative Considered**: Server-side event sourcing
- Rejected due to complexity for MVP
- Would enable: persistent history, collaboration

---

### 6. Deep Copy for History
**Decision**: `JSON.parse(JSON.stringify(blocks))`

**Rationale**:
- Simple, works for serializable data
- No external dependencies
- Complete independence of snapshots

**Trade-off**:
- Performance cost for large block lists
- Loses non-serializable data (functions, Date objects)

**Mitigation**: 50-state limit prevents memory issues

---

### 7. Image Storage: Local vs Cloud
**Decision**: Local disk storage with Multer

**Rationale**:
- Simple setup for MVP
- Fast access (same server)
- No cloud costs

**Trade-off**:
- Not scalable (disk space)
- Lost on server restart (unless volume mounted)
- No CDN benefits

**Future Migration**: S3/Cloudinary for production

---

### 8. Optimistic UI Updates
**Decision**: Update UI immediately, then sync backend

**Rationale**:
- Perceived performance (instant feedback)
- Better user experience
- Error handling reverts state

**Implementation**:
- Drag-drop: Update positions immediately
- Revert on network error

---

### 9. TypeScript Strictness
**Decision**: `"strict": true` in tsconfig.json

**Rationale**:
- Catch type errors at compile time
- Better IDE autocomplete
- Self-documenting code (interfaces)

**Trade-off**:
- More verbose code (type annotations)
- Learning curve

**Benefits**: Zero runtime type errors in testing

---

## Future Improvements

### 1. Block Deletion
**Current State**: Not implemented

**Design**:
```typescript
DELETE /api/blocks/:id
```
- Remove from database
- Update positions of subsequent blocks
- Save deletion to history (undo should restore)

**Complexity**: Position recalculation, history management

---

### 2. Rich Text Editing
**Current State**: Plain text input

**Enhancement**:
- Integrate Slate.js or TipTap editor
- Support **bold**, *italic*, ~~strikethrough~~
- Inline links, code snippets

**Schema Change**:
```sql
content TEXT → content JSON
```
- Store as serialized editor state

---

### 3. More Block Types
**Potential Additions**:
- Code block (syntax highlighting)
- Checkbox/todo list
- Embed (YouTube, Twitter)
- Divider

**Schema**: Add new types to `type` field
```typescript
type: 'text' | 'image' | 'code' | 'checkbox' | ...
```

---

### 4. Collaboration (Real-time)
**Approach**: Operational Transformation or CRDT

**Infrastructure**:
- WebSocket connection (Socket.io)
- Broadcast block changes to all clients
- Conflict resolution for concurrent edits

**Challenges**:
- History synchronization across users
- Undo/redo in collaborative context

---

### 5. Persistent History
**Implementation**:
- Add `block_history` table
```sql
CREATE TABLE block_history (
  id INTEGER PRIMARY KEY,
  block_id INTEGER,
  action TEXT,  -- 'create' | 'update' | 'delete' | 'reorder'
  snapshot JSON,
  user_id INTEGER,
  timestamp DATETIME
);
```

**Benefits**:
- History survives page refresh
- Audit trail
- Cross-device undo

---

### 6. Keyboard Navigation
**Enhancements**:
- Arrow up/down to navigate blocks
- Enter to create new block below
- Backspace on empty block to delete
- Tab/Shift+Tab to change heading level

**Similar to**: Notion's keyboard UX

---

### 7. Search and Filter
**Features**:
- Full-text search across all blocks
- Filter by type (text/image)
- Tag system

**Implementation**:
- SQLite FTS5 extension for search
- Tags in separate table with many-to-many

---

### 8. Export/Import
**Formats**:
- Markdown export
- JSON export (full data)
- PDF rendering (server-side)

**Implementation**:
- Backend endpoint: `GET /api/export?format=md`
- Use libraries: markdown-it, puppeteer (PDF)

---

### 9. Image Optimization
**Current**: Store original uploaded file

**Enhancements**:
- Resize on upload (generate thumbnails)
- WebP conversion for smaller sizes
- Lazy loading for images

**Library**: Sharp (Node.js image processing)

---

### 10. Offline Support
**Approach**: Progressive Web App (PWA)

**Implementation**:
- Service Worker for caching
- IndexedDB for offline storage
- Sync queue for pending changes

**Challenge**: Conflict resolution on reconnect

---

### 11. Performance Optimization
**Current Bottlenecks**:
- Rendering all blocks (virtual scrolling needed for 100+ blocks)
- Deep copy on every state change

**Solutions**:
- React Virtualized for large lists
- Immer.js for efficient immutable updates
- Memoization with `React.memo`

---

### 12. Testing Coverage
**Current**: Backend unit/integration tests (31 tests)

**Additions**:
- Frontend component tests (React Testing Library)
- E2E tests (Playwright, Cypress)
- Visual regression tests

**Target**: 80%+ code coverage

---

## Conclusion

This design document captures the current architecture and implementation details of the Mini Notion clone. The system follows established patterns (REST, React, SQLite) with a focus on simplicity and correctness.

Key strengths:
- ✅ Clean separation of concerns
- ✅ Type-safe with TypeScript
- ✅ Comprehensive testing
- ✅ Full undo/redo support
- ✅ Optimistic UI updates

The modular design allows for incremental enhancements while maintaining stability. Future improvements can build on this foundation without major refactoring.

**Version**: 1.0  
**Last Updated**: October 30, 2025  
**Authors**: Development Team
