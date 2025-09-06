import { useEffect, useRef, useState } from 'react';

interface UseResponsiveControlsOptions {
  minSpaceForInline: number;
  breakpoint?: number;
}

export function useResponsiveControls({ 
  minSpaceForInline = 400,
  breakpoint = 640 
}: UseResponsiveControlsOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', updateWindowWidth);
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setAvailableWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const hasSpaceForInline = availableWidth >= minSpaceForInline && windowWidth >= breakpoint;
  const isMobile = windowWidth < breakpoint;

  return {
    containerRef,
    availableWidth,
    hasSpaceForInline,
    isMobile,
    windowWidth
  };
}
