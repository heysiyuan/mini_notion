import { useState } from 'react';
import type { Block } from '../types';
import './BlockEditor.css';

interface TextBlockEditorProps {
  onSave: (block: Partial<Block>) => void;
  onCancel: () => void;
  initialData?: Partial<Block>;
}

export function TextBlockEditor({ onSave, onCancel, initialData }: TextBlockEditorProps) {
  const [content, setContent] = useState(initialData?.content || '');
  const [style, setStyle] = useState<'h1' | 'h2' | 'h3' | 'p'>(initialData?.style || 'p');

  const handleSave = () => {
    if (!content.trim()) {
      alert('Content cannot be empty');
      return;
    }
    onSave({
      type: 'text',
      content,
      style,
    });
  };

  return (
    <div className="block-editor">
      <div className="editor-header">
        <select 
          value={style} 
          onChange={(e) => setStyle(e.target.value as 'h1' | 'h2' | 'h3' | 'p')}
          className="style-selector"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your text here..."
        className="text-input"
        autoFocus
        rows={5}
      />
      <div className="editor-actions">
        <button onClick={handleSave} className="btn btn-primary">Save</button>
        <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
      </div>
    </div>
  );
}
