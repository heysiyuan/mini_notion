import { useState, useRef } from 'react';
import type { Block } from '../types';
import './BlockEditor.css';

interface ImageBlockEditorProps {
  onSave: (block: Partial<Block>) => void;
  onCancel: () => void;
  initialData?: Partial<Block>;
}

export function ImageBlockEditor({ onSave, onCancel, initialData }: ImageBlockEditorProps) {
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [width, setWidth] = useState(initialData?.width?.toString() || '');
  const [height, setHeight] = useState(initialData?.height?.toString() || '');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const uploadedUrl = `http://localhost:3001${data.imageUrl}`;
      setImageUrl(uploadedUrl);

      // Auto-detect dimensions
      const dimensions = await detectImageDimensions(uploadedUrl);
      setWidth(dimensions.width.toString());
      setHeight(dimensions.height.toString());
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleUrlChange = async (url: string) => {
    setImageUrl(url);
    if (url && url.startsWith('http')) {
      try {
        const dimensions = await detectImageDimensions(url);
        setWidth(dimensions.width.toString());
        setHeight(dimensions.height.toString());
      } catch (error) {
        console.error('Failed to detect dimensions:', error);
      }
    }
  };

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
      
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <p>Uploading...</p>
        ) : imageUrl ? (
          <div className="image-preview">
            <img src={imageUrl} alt="Preview" />
            <button 
              className="btn btn-secondary btn-small"
              onClick={(e) => {
                e.stopPropagation();
                setImageUrl('');
                setWidth('');
                setHeight('');
              }}
            >
              Change Image
            </button>
          </div>
        ) : (
          <>
            <p>📁 Drag and drop an image here</p>
            <p className="upload-hint">or click to browse</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="form-group">
        <label>Or paste image URL</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="text-input"
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

      <div className="editor-actions">
        <button onClick={handleSave} className="btn btn-primary">Save</button>
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
