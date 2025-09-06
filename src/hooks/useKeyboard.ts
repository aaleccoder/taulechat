import { useEffect, useState } from 'react';

interface KeyboardState {
  isVisible: boolean;
  height: number;
}

/**
 * Hook to detect virtual keyboard visibility and height on mobile devices
 * Works with Android and iOS browsers
 */
export function useKeyboard(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    let timeoutId: NodeJS.Timeout;

    const updateKeyboardState = (height: number) => {
      const isVisible = height > 150; // Consider keyboard visible if height diff > 150px
      setKeyboardState({
        isVisible,
        height: isVisible ? height : 0,
      });
    };

    const handleViewportChange = () => {
      // Clear existing timeout to debounce rapid changes
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDiff = initialViewportHeight - currentHeight;
        
        // Use a small delay to avoid flickering during transitions
        timeoutId = setTimeout(() => {
          updateKeyboardState(heightDiff);
        }, 50);
      }
    };

    const handleOrientationChange = () => {
      // Reset on orientation change - wait for UI to settle
      setTimeout(() => {
        initialViewportHeight = window.visualViewport?.height || window.innerHeight;
        setKeyboardState({ isVisible: false, height: 0 });
      }, 200);
    };

    // Visual Viewport API (modern browsers including Android Chrome and iOS Safari)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.addEventListener('orientationchange', handleOrientationChange);
    } else {
      // Fallback for older browsers
      let initialWindowHeight = window.innerHeight;
      
      const handleWindowResize = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const currentHeight = window.innerHeight;
        const heightDiff = initialWindowHeight - currentHeight;
        
        timeoutId = setTimeout(() => {
          updateKeyboardState(heightDiff);
        }, 50);
      };

      const handleFallbackOrientationChange = () => {
        setTimeout(() => {
          initialWindowHeight = window.innerHeight;
          setKeyboardState({ isVisible: false, height: 0 });
        }, 200);
      };
      
      window.addEventListener('resize', handleWindowResize);
      window.addEventListener('orientationchange', handleFallbackOrientationChange);
      
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        window.removeEventListener('resize', handleWindowResize);
        window.removeEventListener('orientationchange', handleFallbackOrientationChange);
      };
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, []);

  return keyboardState;
}
