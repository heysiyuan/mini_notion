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
  
  // Use refs to always have current values
  const historyRef = useRef(history);
  const currentIndexRef = useRef(currentIndex);
  
  // Keep refs in sync
  historyRef.current = history;
  currentIndexRef.current = currentIndex;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const saveState = useCallback((blocks: Block[]) => {
    // Don't save state if we're in the middle of restoring
    if (isRestoringRef.current) {
      return;
    }

    // Use refs to get current values
    const currentIdx = currentIndexRef.current;
    const currentHistory = historyRef.current;
    
    // Remove any redo history after current index
    const newHistory = currentHistory.slice(0, currentIdx + 1);
    
    // Add new state
    newHistory.push({
      blocks: JSON.parse(JSON.stringify(blocks)), // Deep copy
      timestamp: Date.now()
    });

    // Limit history to 50 states to prevent memory issues
    const limitedHistory = newHistory.slice(-50);
    
    setHistory(limitedHistory);
    setCurrentIndex(limitedHistory.length - 1);
  }, []);

  const undo = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    if (currentIdx <= 0) return null;

    isRestoringRef.current = true;
    const newIndex = currentIdx - 1;
    setCurrentIndex(newIndex);
    const restoredState = historyRef.current[newIndex];
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);

    return restoredState.blocks;
  }, []);

  const redo = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    const historyLength = historyRef.current.length;
    
    if (currentIdx >= historyLength - 1) return null;

    isRestoringRef.current = true;
    const newIndex = currentIdx + 1;
    setCurrentIndex(newIndex);
    const restoredState = historyRef.current[newIndex];
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);

    return restoredState.blocks;
  }, []);

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
