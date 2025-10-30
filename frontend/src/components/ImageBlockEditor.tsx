import { useState } from 'react';
import type { Block } from '../types';
import './BlockEditor.css';

interface ImageBlockEditorProps {
  onSave: (block: Partial<Block>) => void;
  onCancel: () => void;
  initialData?: Partial<Block>;
}

export function ImageBlockEditor({ onSave, onCancel, initialData }: ImageBlockEditorProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [width, setWidth] = useState(initialData?.width?.toString() || '800');
  const [height, setHeight] = useState(initialData?.height?.toString() || '400');

  const handleSave = () => {
    if (!imageUrl.trim()) {
      alert('Image URL cannot be empty');
      return;
    }
    onSave({
      type: 'image',
      imageUrl,
      width: parseInt(width) || 800,
      height: parseInt(height) || 400,
    });
  };

  return (
    <div className="block-editor">
      <div className="editor-header">
        <h4>Image Block</h4>
      </div>
      <div className="form-group">
        <label>Image URL</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="text-input"
          autoFocus
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="number-input"
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="number-input"
            min="1"
          />
        </div>
      </div>
      {imageUrl && (
        <div className="image-preview">
          <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
        </div>
      )}
      <div className="editor-actions">
        <button onClick={handleSave} className="btn btn-primary">Save</button>
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
