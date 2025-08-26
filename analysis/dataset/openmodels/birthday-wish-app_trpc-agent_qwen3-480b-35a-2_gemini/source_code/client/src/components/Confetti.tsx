import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speed: number;
  rotationSpeed: number;
}

const COLORS = [
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff9900', // Orange
  '#ff66cc', // Pink
];

export function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const newPieces: ConfettiPiece[] = [];
    const pieceCount = 150;
    
    for (let i = 0; i < pieceCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 10,
        speed: 2 + Math.random() * 5,
        rotationSpeed: -5 + Math.random() * 10,
      });
    }
    
    setPieces(newPieces);
  }, [active]);

  useEffect(() => {
    if (!active || pieces.length === 0) return;

    const interval = setInterval(() => {
      setPieces(prev => {
        return prev.map(piece => {
          let newY = piece.y + piece.speed;
          let newRotation = piece.rotation + piece.rotationSpeed;
          
          // Reset piece when it falls off screen
          if (newY > window.innerHeight + 50) {
            newY = -20 - Math.random() * 100;
            newRotation = Math.random() * 360;
          }
          
          return {
            ...piece,
            y: newY,
            rotation: newRotation,
          };
        });
      });
    }, 30);

    return () => clearInterval(interval);
  }, [active, pieces.length]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
}
