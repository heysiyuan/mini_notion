import { useState, useEffect } from 'react'
import type { Block } from './types'
import { BlockComponent } from './components/BlockComponent'
import { AddBlockMenu } from './components/AddBlockMenu'
import { TextBlockEditor } from './components/TextBlockEditor'
import { ImageBlockEditor } from './components/ImageBlockEditor'
import './App.css'

function App() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<'text' | 'image' | null>(null)

  useEffect(() => {
    fetchBlocks()
  }, [])

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
      setBlocks([...blocks, newBlock]);
      setEditingType(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create block');
    }
  };

  const handleCancelEdit = () => {
    setEditingType(null);
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
        {blocks.map((block) => (
          <BlockComponent key={block.id} block={block} />
        ))}
        
        {editingType === 'text' && (
          <TextBlockEditor 
            onSave={handleSaveBlock}
            onCancel={handleCancelEdit}
          />
        )}
        
        {editingType === 'image' && (
          <ImageBlockEditor 
            onSave={handleSaveBlock}
            onCancel={handleCancelEdit}
          />
        )}
        
        {!editingType && (
          <AddBlockMenu onSelectType={setEditingType} />
        )}
      </div>
    </div>
  )
}

export default App

