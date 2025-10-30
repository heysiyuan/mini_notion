import './DraggableBlock.css';

interface DraggableBlockProps {
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}

export function DraggableBlock({ 
  index, 
  onDragStart, 
  onDragOver, 
  onDragEnd,
  children 
}: DraggableBlockProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  return (
    <div
      className="draggable-block"
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="drag-handle" title="Drag to reorder">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="5" cy="5" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="13" cy="13" r="1.5" />
        </svg>
      </div>
      <div className="block-content">
        {children}
      </div>
    </div>
  );
}
