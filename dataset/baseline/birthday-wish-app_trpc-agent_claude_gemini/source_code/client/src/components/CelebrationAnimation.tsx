interface CelebrationAnimationProps {
  isActive: boolean;
  phase: number;
}

export function CelebrationAnimation({ isActive, phase }: CelebrationAnimationProps) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Confetti */}
      {phase >= 2 && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className={`confetti confetti-${(i % 6) + 1}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Floating Balloons */}
      {phase >= 3 && (
        <div className="balloons-container">
          {['🎈', '🎈', '🎈', '🎈', '🎈'].map((balloon, i) => (
            <div
              key={`balloon-${i}`}
              className="floating-balloon text-6xl"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              {balloon}
            </div>
          ))}
        </div>
      )}

      {/* Sparkle Effects */}
      {phase >= 1 && (
        <div className="fixed inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute text-2xl sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
