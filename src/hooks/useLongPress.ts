import { useState, useCallback } from 'react';

type TEvent = React.MouseEvent | React.TouchEvent;

interface LongPressOptions {
  onLongPress: (event: TEvent) => void;
  onClick?: (event: TEvent) => void;
  ms?: number;
}

export function useLongPress({ onLongPress, onClick, ms = 300 }: LongPressOptions) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);

  const start = useCallback((event: TEvent) => {
    if (event.nativeEvent instanceof MouseEvent && event.nativeEvent.button === 2) {
      return;
    }

    setLongPressTriggered(false);
    const timer = setTimeout(() => {
      onLongPress(event);
      setLongPressTriggered(true);
    }, ms);

    const stop = () => {
      clearTimeout(timer);
    };

    if ('touches' in event) {
      event.currentTarget.addEventListener('touchend', stop, { once: true });
      event.currentTarget.addEventListener('touchmove', stop, { once: true });
    } else {
      event.currentTarget.addEventListener('mouseup', stop, { once: true });
      event.currentTarget.addEventListener('mouseleave', stop, { once: true });
    }
  }, [ms, onLongPress]);

  const handleClick = useCallback((event: TEvent) => {
    if (onClick && !longPressTriggered) {
      onClick(event);
    }
  }, [onClick, longPressTriggered]);

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onClick: (e: TEvent) => handleClick(e),
  };
}
