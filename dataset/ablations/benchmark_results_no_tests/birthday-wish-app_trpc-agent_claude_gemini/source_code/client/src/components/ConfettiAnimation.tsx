import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  emoji: string;
  speed: number;
  rotationSpeed: number;
  size: number;
}

export function ConfettiAnimation() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isActive, setIsActive] = useState(true);

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'];
  const emojis = ['🎉', '🎊', '🎈', '🎂', '🎁', '✨', '🌟', '💫', '🎀', '💝'];

  useEffect(() => {
    // Create initial confetti pieces
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 60; i++) {
      pieces.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -Math.random() * 100 - 10,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        speed: Math.random() * 4 + 1.5,
        rotationSpeed: (Math.random() - 0.5) * 15,
        size: Math.random() * 1.2 + 0.4
      });
    }
    setConfetti(pieces);

    // Animation loop
    const animationInterval = setInterval(() => {
      setConfetti(prevConfetti => 
        prevConfetti.map(piece => ({
          ...piece,
          y: piece.y + piece.speed,
          x: piece.x + Math.sin(piece.y * 0.01) * 1,
          rotation: piece.rotation + piece.rotationSpeed
        })).filter(piece => piece.y < window.innerHeight + 100)
      );
    }, 16);

    // Clean up after 5 seconds
    const cleanupTimeout = setTimeout(() => {
      setIsActive(false);
      clearInterval(animationInterval);
    }, 5000);

    return () => {
      clearInterval(animationInterval);
      clearTimeout(cleanupTimeout);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute animate-pulse"
          style={{
            left: piece.x,
            top: piece.y,
            transform: `rotate(${piece.rotation}deg) scale(${piece.size})`,
            transition: 'none'
          }}
        >
          {Math.random() > 0.6 ? (
            // Emoji confetti
            <span className="text-2xl block animate-bounce" style={{ animationDelay: `${piece.id * 100}ms` }}>
              {piece.emoji}
            </span>
          ) : (
            // Colored rectangle confetti
            <div
              className="w-3 h-6 rounded-sm shadow-sm animate-spin"
              style={{
                backgroundColor: piece.color,
                animationDuration: `${Math.random() * 2 + 1}s`
              }}
            />
          )}
        </div>
      ))}

      {/* Additional burst effects */}
      <div className="absolute top-1/4 left-1/4 animate-ping">
        <div className="w-4 h-4 bg-pink-400 rounded-full opacity-75"></div>
      </div>
      <div className="absolute top-1/3 right-1/4 animate-ping delay-300">
        <div className="w-6 h-6 bg-purple-400 rounded-full opacity-75"></div>
      </div>
      <div className="absolute bottom-1/3 left-1/3 animate-ping delay-700">
        <div className="w-5 h-5 bg-blue-400 rounded-full opacity-75"></div>
      </div>
      <div className="absolute bottom-1/4 right-1/3 animate-ping delay-1000">
        <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-75"></div>
      </div>

      {/* Sparkle effects */}
      {[...Array(10)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-pulse"
          style={{
            left: Math.random() * window.innerWidth,
            top: Math.random() * window.innerHeight,
            animationDelay: `${i * 200}ms`,
            animationDuration: '2s'
          }}
        >
          <span className="text-yellow-400 text-xl">✨</span>
        </div>
      ))}
    </div>
  );
}
