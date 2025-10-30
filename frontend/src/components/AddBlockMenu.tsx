import { useState } from 'react';
import './AddBlockMenu.css';

interface AddBlockMenuProps {
  onSelectType: (type: 'text' | 'image') => void;
}

export function AddBlockMenu({ onSelectType }: AddBlockMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: 'text' | 'image') => {
    onSelectType(type);
    setIsOpen(false);
  };

  return (
    <div className="add-block-container">
      <button 
        className="add-block-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Add a block"
      >
        <span className="plus-icon">+</span> Add a block
      </button>
      
      {isOpen && (
        <div className="block-menu">
          <button 
            className="menu-item"
            onClick={() => handleSelect('text')}
          >
            <span className="menu-icon">📝</span>
            <div className="menu-content">
              <div className="menu-title">Text</div>
              <div className="menu-description">Add text with formatting</div>
            </div>
          </button>
          <button 
            className="menu-item"
            onClick={() => handleSelect('image')}
          >
            <span className="menu-icon">🖼️</span>
            <div className="menu-content">
              <div className="menu-title">Image</div>
              <div className="menu-description">Upload or embed an image</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
