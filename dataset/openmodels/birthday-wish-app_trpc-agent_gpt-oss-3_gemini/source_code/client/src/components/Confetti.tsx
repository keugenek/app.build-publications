import { useEffect, useState } from 'react';

// Simple confetti animation using divs with CSS keyframes.
// Each confetti piece is a small colored square that falls from top to bottom.

export function Confetti() {
  const [pieces, setPieces] = useState<number[]>([]);

  useEffect(() => {
    // Generate a fixed number of confetti pieces (e.g., 30)
    const count = 30;
    setPieces(Array.from({ length: count }, (_, i) => i));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((i) => {
        const size = Math.floor(Math.random() * 6) + 4; // 4-9px
        const left = Math.random() * 100; // percent
        const delay = Math.random() * 3; // seconds
        const duration = Math.random() * 2 + 3; // 3-5s
        const colors = ['bg-pink-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            className={`absolute ${color} rounded-sm animate-confetti`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
