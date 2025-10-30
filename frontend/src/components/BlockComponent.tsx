import type { Block } from '../types';
import './BlockComponent.css';

interface BlockComponentProps {
  block: Block;
  onEdit?: (block: Block) => void;
}

export function BlockComponent({ block, onEdit }: BlockComponentProps) {
  if (block.type === 'text') {
    return <TextBlock block={block} onEdit={onEdit} />;
  } else if (block.type === 'image') {
    return <ImageBlock block={block} onEdit={onEdit} />;
  }
  return null;
}

function TextBlock({ block, onEdit }: BlockComponentProps) {
  const content = block.content || '';
  
  const handleClick = () => {
    if (onEdit) {
      onEdit(block);
    }
  };
  
  const className = `block text-block ${onEdit ? 'editable' : ''}`;
  
  switch (block.style) {
    case 'h1':
      return <h1 className={className} onClick={handleClick}>{content}</h1>;
    case 'h2':
      return <h2 className={className} onClick={handleClick}>{content}</h2>;
    case 'h3':
      return <h3 className={className} onClick={handleClick}>{content}</h3>;
    case 'p':
    default:
      return <p className={className} onClick={handleClick}>{content}</p>;
  }
}

function ImageBlock({ block, onEdit }: BlockComponentProps) {
  const maxWidth = 900; // Match the page max-width
  const originalWidth = block.width || 800;
  const originalHeight = block.height || 400;
  
  // Calculate scaled dimensions if image is too wide
  let displayWidth = originalWidth;
  let displayHeight = originalHeight;
  
  if (originalWidth > maxWidth) {
    const scale = maxWidth / originalWidth;
    displayWidth = maxWidth;
    displayHeight = Math.round(originalHeight * scale);
  }
  
  const handleClick = () => {
    if (onEdit) {
      onEdit(block);
    }
  };
  
  return (
    <div className={`block image-block ${onEdit ? 'editable' : ''}`} onClick={handleClick}>
      <img
        src={block.imageUrl}
        alt="Block content"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          maxWidth: '100%',
        }}
      />
    </div>
  );
}
