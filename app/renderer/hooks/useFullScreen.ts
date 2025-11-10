/**
 * useFullScreen - Hook for fullscreen mode and print-to-PDF functionality
 */

import { useState, useEffect, useCallback } from 'react';

interface UseFullScreenReturn {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  enterFullScreen: () => void;
  exitFullScreen: () => void;
  printToPDF: () => void;
}

export const useFullScreen = (elementId?: string): UseFullScreenReturn => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        exitFullScreen();
      }
      // F11 for fullscreen toggle
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullScreen();
      }
      // Ctrl+P for print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && isFullScreen) {
        e.preventDefault();
        printToPDF();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullScreen]);

  const enterFullScreen = useCallback(() => {
    const element = elementId ? document.getElementById(elementId) : document.documentElement;
    
    if (element) {
      element.classList.add('fullscreen');
      setIsFullScreen(true);
      
      // Hide other UI elements
      document.body.style.overflow = 'hidden';
    }
  }, [elementId]);

  const exitFullScreen = useCallback(() => {
    const element = elementId ? document.getElementById(elementId) : document.documentElement;
    
    if (element) {
      element.classList.remove('fullscreen');
      setIsFullScreen(false);
      
      // Restore UI
      document.body.style.overflow = '';
    }
  }, [elementId]);

  const toggleFullScreen = useCallback(() => {
    if (isFullScreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  }, [isFullScreen, enterFullScreen, exitFullScreen]);

  const printToPDF = useCallback(() => {
    // Trigger browser print dialog which can save as PDF
    window.print();
  }, []);

  return {
    isFullScreen,
    toggleFullScreen,
    enterFullScreen,
    exitFullScreen,
    printToPDF
  };
};
