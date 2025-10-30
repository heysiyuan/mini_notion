import { useState, useCallback, useRef } from 'react';
import type { Block } from '../types';

interface HistoryState {
  blocks: Block[];
  timestamp: number;
}

export function useHistory(initialBlocks: Block[] = []) {
  const [history, setHistory] = useState<HistoryState[]>([
    { blocks: initialBlocks, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isRestoringRef = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const saveState = useCallback((blocks: Block[]) => {
    // Don't save state if we're in the middle of restoring
    if (isRestoringRef.current) {
      return;
    }

    setHistory(prev => {
      // Remove any redo history after current index
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push({
        blocks: JSON.parse(JSON.stringify(blocks)), // Deep copy
        timestamp: Date.now()
      });

      // Limit history to 50 states to prevent memory issues
      const limitedHistory = newHistory.slice(-50);
      
      return limitedHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, 49); // Max index is 49 (for 50 items)
      return newIndex;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (!canUndo) return null;

    isRestoringRef.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    const restoredState = history[newIndex];
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);

    return restoredState.blocks;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return null;

    isRestoringRef.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    const restoredState = history[newIndex];
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);

    return restoredState.blocks;
  }, [canRedo, currentIndex, history]);

  const reset = useCallback((blocks: Block[]) => {
    setHistory([{ blocks: JSON.parse(JSON.stringify(blocks)), timestamp: Date.now() }]);
    setCurrentIndex(0);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
