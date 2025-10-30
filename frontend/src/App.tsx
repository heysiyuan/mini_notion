import { useState, useEffect, useCallback, useRef } from 'react'
import type { Block } from './types'
import { BlockComponent } from './components/BlockComponent'
import { DraggableBlock } from './components/DraggableBlock'
import { AddBlockMenu } from './components/AddBlockMenu'
import { TextBlockEditor } from './components/TextBlockEditor'
import { ImageBlockEditor } from './components/ImageBlockEditor'
import { useHistory } from './hooks/useHistory'
import './App.css'

function App() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'text' | 'image' | null>(null)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  // History management for undo/redo
  const { saveState, undo, redo, canUndo, canRedo, reset } = useHistory()
  const isRestoringRef = useRef(false)

  useEffect(() => {
    fetchBlocks()
  }, [])

  // Initialize history when blocks are loaded
  useEffect(() => {
    if (blocks.length > 0 && !isRestoringRef.current) {
      reset(blocks)
    }
  }, [blocks.length === 0 ? '' : 'loaded']) // Only run once when initially loaded

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command (Mac) or Ctrl (Windows/Linux)
      const isModifierPressed = e.metaKey || e.ctrlKey

      if (isModifierPressed && e.key === 'z') {
        e.preventDefault()

        if (e.shiftKey) {
          // Command/Ctrl + Shift + Z = Redo
          handleRedo()
        } else {
          // Command/Ctrl + Z = Undo
          handleUndo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, blocks])

  const handleUndo = useCallback(async () => {
    if (!canUndo) return

    const previousState = undo()
    if (!previousState) return

    isRestoringRef.current = true
    setBlocks(previousState)

    // Sync with backend
    try {
      const updates = previousState.map((block, index) =>
        fetch(`/api/blocks/${block.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: index,
            content: block.content,
            style: block.style,
            imageUrl: block.imageUrl,
            width: block.width,
            height: block.height,
          }),
        })
      )
      await Promise.all(updates)
    } catch (err) {
      console.error('Failed to sync undo with backend:', err)
    } finally {
      setTimeout(() => {
        isRestoringRef.current = false
      }, 100)
    }
  }, [canUndo, undo])

  const handleRedo = useCallback(async () => {
    if (!canRedo) return

    const nextState = redo()
    if (!nextState) return

    isRestoringRef.current = true
    setBlocks(nextState)

    // Sync with backend
    try {
      const updates = nextState.map((block, index) =>
        fetch(`/api/blocks/${block.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: index,
            content: block.content,
            style: block.style,
            imageUrl: block.imageUrl,
            width: block.width,
            height: block.height,
          }),
        })
      )
      await Promise.all(updates)
    } catch (err) {
      console.error('Failed to sync redo with backend:', err)
    } finally {
      setTimeout(() => {
        isRestoringRef.current = false
      }, 100)
    }
  }, [canRedo, redo])

  const fetchBlocks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blocks')
      if (!response.ok) {
        throw new Error('Failed to fetch blocks')
      }
      const data = await response.json()
      setBlocks(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBlock = async (blockData: Partial<Block>) => {
    try {
      // Determine the position for the new block (add to end)
      const maxPosition = blocks.length > 0 
        ? Math.max(...blocks.map(b => b.position)) 
        : -1;
      
      const newBlockData = {
        ...blockData,
        position: maxPosition + 1,
      };

      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBlockData),
      });

      if (!response.ok) {
        throw new Error('Failed to create block');
      }

      const newBlock = await response.json();
      const updatedBlocks = [...blocks, newBlock];
      setBlocks(updatedBlocks);
      
      // Save to history
      if (!isRestoringRef.current) {
        saveState(updatedBlocks);
      }
      
      setEditingType(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create block');
    }
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setEditingBlock(null);
  };

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setEditingType(block.type);
  };

  const handleUpdateBlock = async (blockData: Partial<Block>) => {
    if (!editingBlock) return;

    try {
      const response = await fetch(`/api/blocks/${editingBlock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockData),
      });

      if (!response.ok) {
        throw new Error('Failed to update block');
      }

      const updatedBlock = await response.json();
      
      // Update the block in the state
      const updatedBlocks = blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
      setBlocks(updatedBlocks);
      
      // Save to history
      if (!isRestoringRef.current) {
        saveState(updatedBlocks);
      }
      
      setEditingType(null);
      setEditingBlock(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update block');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedIndex];
    
    // Remove from old position
    newBlocks.splice(draggedIndex, 1);
    // Insert at new position
    newBlocks.splice(index, 0, draggedBlock);
    
    setBlocks(newBlocks);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Update positions in the backend
    try {
      const updates = blocks.map((block, index) => 
        fetch(`/api/blocks/${block.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ position: index }),
        })
      );

      await Promise.all(updates);
      
      // Success - save to history
      if (!isRestoringRef.current) {
        saveState(blocks);
      }
      
      setDraggedIndex(null);
    } catch (err) {
      console.error('Failed to update block positions:', err);
      alert('Failed to save new order');
      // Revert on error
      await fetchBlocks();
      setDraggedIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading blocks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="page">
        {blocks.map((block, index) => (
          <DraggableBlock
            key={block.id}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <BlockComponent block={block} onEdit={handleEditBlock} />
          </DraggableBlock>
        ))}
        
        {editingType === 'text' && (
          <TextBlockEditor 
            onSave={editingBlock ? handleUpdateBlock : handleSaveBlock}
            onCancel={handleCancelEdit}
            initialData={editingBlock || undefined}
          />
        )}
        
        {editingType === 'image' && (
          <ImageBlockEditor 
            onSave={editingBlock ? handleUpdateBlock : handleSaveBlock}
            onCancel={handleCancelEdit}
            initialData={editingBlock || undefined}
          />
        )}
        
        {!editingType && (
          <AddBlockMenu onSelectType={setEditingType} />
        )}
      </div>
      
      {/* Undo/Redo indicator */}
      <div className="history-indicator">
        <span className={canUndo ? 'active' : ''}>⌘Z Undo</span>
        <span className={canRedo ? 'active' : ''}>⌘⇧Z Redo</span>
      </div>
    </div>
  )
}

export default App

