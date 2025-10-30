import type { Block } from '../types';
import './BlockComponent.css';

interface BlockComponentProps {
  block: Block;
}

export function BlockComponent({ block }: BlockComponentProps) {
  if (block.type === 'text') {
    return <TextBlock block={block} />;
  } else if (block.type === 'image') {
    return <ImageBlock block={block} />;
  }
  return null;
}

function TextBlock({ block }: BlockComponentProps) {
  const content = block.content || '';
  
  switch (block.style) {
    case 'h1':
      return <h1 className="block text-block">{content}</h1>;
    case 'h2':
      return <h2 className="block text-block">{content}</h2>;
    case 'h3':
      return <h3 className="block text-block">{content}</h3>;
    case 'p':
    default:
      return <p className="block text-block">{content}</p>;
  }
}

function ImageBlock({ block }: BlockComponentProps) {
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
  
  return (
    <div className="block image-block">
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
