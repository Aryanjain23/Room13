import { useEffect, useRef } from 'react';
import { bootRoom13Game } from './main.js';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cleanup = bootRoom13Game(el);
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
