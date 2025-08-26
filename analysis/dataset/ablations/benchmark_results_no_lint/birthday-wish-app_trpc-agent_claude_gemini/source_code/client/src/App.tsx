import { useState, useEffect, useCallback } from 'react';

function App() {
  const [animationInterval, setAnimationInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Clear all animations
  const clearAnimations = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
    
    // Remove all existing animation elements
    const confetti = document.querySelectorAll('.confetti');
    const balloons = document.querySelectorAll('.balloon');
    const sparkles = document.querySelectorAll('.sparkle');
    
    [...confetti, ...balloons, ...sparkles].forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
  }, [animationInterval]);

  // Confetti Animation
  const startConfetti = useCallback(() => {
    clearAnimations();
    const colors = ['#ff6b9d', '#c44569', '#f8b500', '#feca57', '#3498db', '#e74c3c', '#2ecc71'];
    
    const interval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, 4000);
      }
    }, 200);
    
    setAnimationInterval(interval);
    
    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      setAnimationInterval(null);
    }, 10000);
  }, [clearAnimations]);

  // Balloon Animation
  const startBalloons = useCallback(() => {
    clearAnimations();
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#ff6b9d'];
    
    const interval = setInterval(() => {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';
      balloon.style.left = Math.random() * 90 + 'vw';
      balloon.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      balloon.style.animationDelay = Math.random() * 1 + 's';
      
      document.body.appendChild(balloon);
      
      // Remove balloon after animation
      setTimeout(() => {
        if (balloon.parentNode) {
          balloon.parentNode.removeChild(balloon);
        }
      }, 5000);
    }, 800);
    
    setAnimationInterval(interval);
    
    // Stop after 15 seconds
    setTimeout(() => {
      clearInterval(interval);
      setAnimationInterval(null);
    }, 15000);
  }, [clearAnimations]);

  // Sparkle Animation
  const startSparkles = useCallback(() => {
    clearAnimations();
    const sparkleSymbols = ['✨', '⭐', '🌟', '💫', '⚡'];
    
    const interval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.innerHTML = sparkleSymbols[Math.floor(Math.random() * sparkleSymbols.length)];
        sparkle.style.left = Math.random() * 95 + 'vw';
        sparkle.style.top = Math.random() * 80 + 'vh';
        sparkle.style.animationDelay = Math.random() * 1 + 's';
        sparkle.style.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
        
        document.body.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 2500);
      }
    }, 300);
    
    setAnimationInterval(interval);
    
    // Stop after 12 seconds
    setTimeout(() => {
      clearInterval(interval);
      setAnimationInterval(null);
    }, 12000);
  }, [clearAnimations]);

  // Photo gallery lightbox effect
  const handlePhotoClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const img = target.querySelector('img') as HTMLImageElement;
    const caption = target.querySelector('.photo-caption')?.textContent || '';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      cursor: pointer;
    `;
    
    // Create enlarged image
    const enlargedImg = document.createElement('img');
    enlargedImg.src = img.src;
    enlargedImg.alt = img.alt;
    enlargedImg.style.cssText = `
      max-width: 90%;
      max-height: 80%;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    // Create caption
    const enlargedCaption = document.createElement('div');
    enlargedCaption.textContent = caption;
    enlargedCaption.style.cssText = `
      color: white;
      font-size: 1.2rem;
      margin-top: 20px;
      text-align: center;
    `;
    
    overlay.appendChild(enlargedImg);
    overlay.appendChild(enlargedCaption);
    document.body.appendChild(overlay);
    
    // Close on click
    overlay.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  };

  // Auto-start with confetti on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startConfetti();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearAnimations();
    };
  }, [startConfetti, clearAnimations]);

  return (
    <div className="birthday-app">
      <div className="container">
        <div className="birthday-card">
          <h1 className="birthday-title">🎉 Happy Birthday! 🎉</h1>
          <h2 className="recipient-name">Amazing Friend</h2>
          
          <div className="birthday-message">
            <p>🎂 Another year of wonderful memories, incredible adventures, and endless laughter! 🎂</p>
            <p>May this special day bring you joy, happiness, and all the things that make you smile. You deserve all the best that life has to offer!</p>
            <p>Here's to celebrating you today and always! 🥳✨</p>
          </div>
          
          <div className="sender-info">
            <p>With love and best wishes,<br /><strong>Your Loving Friend</strong> 💝</p>
          </div>
        </div>

        <div className="photo-gallery">
          <h2 className="gallery-title">📸 Birthday Memories 📸</h2>
          <div className="gallery-grid">
            <div className="photo-item" onClick={handlePhotoClick}>
              <img src="https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop" alt="Birthday celebration" />
              <div className="photo-caption">🎈 Best birthday party ever!</div>
            </div>
            <div className="photo-item" onClick={handlePhotoClick}>
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" alt="Birthday cake" />
              <div className="photo-caption">🍰 The most delicious cake!</div>
            </div>
            <div className="photo-item" onClick={handlePhotoClick}>
              <img src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=400&h=300&fit=crop" alt="Friends celebrating" />
              <div className="photo-caption">👫 Amazing friends, amazing times!</div>
            </div>
            <div className="photo-item" onClick={handlePhotoClick}>
              <img src="https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop" alt="Party decorations" />
              <div className="photo-caption">🎊 Beautiful decorations everywhere!</div>
            </div>
            <div className="photo-item" onClick={handlePhotoClick}>
              <img src="https://images.unsplash.com/photo-1555652832-c3cd532fb9db?w=400&h=300&fit=crop" alt="Gift opening" />
              <div className="photo-caption">🎁 Opening wonderful surprises!</div>
            </div>
            <div className="photo-item" onClick={handlePhotoClick}>
              <img src="https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop" alt="Happy moments" />
              <div className="photo-caption">😊 Pure joy and happiness!</div>
            </div>
          </div>
        </div>

        <div className="theme-selector">
          <h3>Choose Your Celebration Style:</h3>
          <div className="celebration-buttons">
            <button className="btn" onClick={startConfetti}>🎊 Confetti Rain</button>
            <button className="btn balloons" onClick={startBalloons}>🎈 Balloon Release</button>
            <button className="btn sparkles" onClick={startSparkles}>✨ Magical Sparkles</button>
            <button className="btn" onClick={clearAnimations}>🛑 Clear All</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
