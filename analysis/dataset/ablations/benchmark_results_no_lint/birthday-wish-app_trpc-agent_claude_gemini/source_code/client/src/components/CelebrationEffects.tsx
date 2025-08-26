import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  life: number;
  maxLife: number;
}

export function CelebrationEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showFireworks, setShowFireworks] = useState(true);

  const confettiEmojis = ['🎊', '🎉', '🎈', '✨', '🎁', '🥳', '🎂', '🍰'];
  const sparkleEmojis = ['✨', '⭐', '💫', '🌟'];

  useEffect(() => {
    // Create initial burst of particles
    const initialParticles: Particle[] = [];
    
    for (let i = 0; i < 50; i++) {
      initialParticles.push(createParticle(i));
    }
    
    setParticles(initialParticles);

    // Animation loop
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev
          .map(updateParticle)
          .filter(p => p.life > 0);
        
        // Add new particles occasionally
        if (Math.random() < 0.3 && updated.length < 30) {
          updated.push(createParticle(Date.now()));
        }
        
        return updated;
      });
    }, 50);

    // Fireworks effect
    const fireworksInterval = setInterval(() => {
      if (showFireworks) {
        createFirework();
      }
    }, 800);

    // Cleanup
    return () => {
      clearInterval(interval);
      clearInterval(fireworksInterval);
    };
  }, [showFireworks]);

  const createParticle = (id: number): Particle => {
    const isSparkle = Math.random() < 0.3;
    const emoji = isSparkle 
      ? sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)]
      : confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];

    return {
      id,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 50,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 8 - 2,
      emoji,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      scale: Math.random() * 0.8 + 0.5,
      life: 1,
      maxLife: Math.random() * 100 + 100
    };
  };

  const updateParticle = (particle: Particle): Particle => {
    return {
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.15, // gravity
      rotation: particle.rotation + particle.rotationSpeed,
      life: particle.life - (1 / particle.maxLife),
      scale: particle.scale * 0.998 // slowly shrink
    };
  };

  const createFirework = () => {
    const centerX = Math.random() * window.innerWidth;
    const centerY = Math.random() * (window.innerHeight * 0.6) + 50;
    
    // Create burst of sparkles
    const burstParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      
      burstParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        emoji: sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)],
        rotation: 0,
        rotationSpeed: Math.random() * 20 - 10,
        scale: Math.random() * 0.5 + 0.5,
        life: 1,
        maxLife: 80
      });
    }
    
    setParticles(prev => [...prev, ...burstParticles]);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Particle System */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute text-2xl transition-opacity duration-1000"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            opacity: Math.max(0, particle.life),
            fontSize: `${1.5 + particle.scale}rem`
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Floating Balloons */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={`balloon-${i}`}
            className="absolute animate-float"
            style={{
              left: `${10 + i * 18}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div className="text-4xl">🎈</div>
          </div>
        ))}
      </div>

      {/* Birthday Cake Rain */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[1, 2, 3].map(i => (
          <div
            key={`cake-${i}`}
            className="absolute animate-bounce"
            style={{
              right: `${5 + i * 15}%`,
              top: `${10 + i * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${2 + Math.random()}s`
            }}
          >
            <div className="text-3xl">🎂</div>
          </div>
        ))}
      </div>

      {/* Gift Box Rain */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[1, 2, 3, 4].map(i => (
          <div
            key={`gift-${i}`}
            className="absolute animate-pulse"
            style={{
              left: `${20 + i * 20}%`,
              bottom: `${10 + i * 15}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${1.5 + Math.random() * 0.5}s`
            }}
          >
            <div className="text-3xl">🎁</div>
          </div>
        ))}
      </div>

      {/* Celebration Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-6xl md:text-8xl font-bold text-white opacity-80 animate-bounce text-center drop-shadow-2xl">
          🎉 HOORAY! 🎉
        </div>
      </div>

      {/* Sparkle Overlay */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`
            }}
          >
            <div className="text-xl text-yellow-300">✨</div>
          </div>
        ))}
      </div>

      {/* Confetti Burst from Corners */}
      <div className="absolute top-0 left-0 animate-spin">
        <div className="text-6xl">🎊</div>
      </div>
      <div className="absolute top-0 right-0 animate-spin" style={{ animationDirection: 'reverse' }}>
        <div className="text-6xl">🎊</div>
      </div>
      <div className="absolute bottom-0 left-0 animate-bounce">
        <div className="text-5xl">🥳</div>
      </div>
      <div className="absolute bottom-0 right-0 animate-bounce" style={{ animationDelay: '0.5s' }}>
        <div className="text-5xl">🥳</div>
      </div>
    </div>
  );
}

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);
