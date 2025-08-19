import './App.css';
import { useState, useEffect } from 'react';

import { PhotoGallery } from '@/components/PhotoGallery';
import { CelebrationAnimation } from '@/components/CelebrationAnimation';
import { BirthdayMessage } from '@/components/BirthdayMessage';

// 🎉 STATIC BIRTHDAY CARD - NO SERVER REQUIRED! 🎉
// This is a completely client-side application with embedded content
const BIRTHDAY_DATA = {
  recipientName: "Sarah",
  message: "Wishing you the most amazing birthday filled with love, laughter, and all your favorite things! 🎂✨",
  photos: [
    {
      id: 1,
      url: "https://picsum.photos/400/300?random=1",
      caption: "Beautiful birthday cake 🎂",
      alt: "Colorful birthday cake with candles"
    },
    {
      id: 2,
      url: "https://picsum.photos/400/300?random=2",
      caption: "Party time! 🎉",
      alt: "Birthday party decorations"
    },
    {
      id: 3,
      url: "https://picsum.photos/400/300?random=3",
      caption: "Sweet treats for celebration 🧁",
      alt: "Delicious cupcakes"
    },
    {
      id: 4,
      url: "https://picsum.photos/400/300?random=4",
      caption: "Balloons and joy! 🎈",
      alt: "Colorful birthday balloons"
    },
    {
      id: 5,
      url: "https://picsum.photos/400/300?random=5",
      caption: "Time to celebrate! ⏰",
      alt: "Birthday celebration setup"
    },
    {
      id: 6,
      url: "https://picsum.photos/400/300?random=6",
      caption: "Gifts with love 🎁",
      alt: "Wrapped birthday presents"
    }
  ]
};

function App() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Birthday animation sequence
  const triggerCelebration = () => {
    setShowAnimation(true);
    setAnimationPhase(1);
    
    // Phase 2: Confetti
    setTimeout(() => setAnimationPhase(2), 500);
    
    // Phase 3: Balloons
    setTimeout(() => setAnimationPhase(3), 1500);
    
    // Reset
    setTimeout(() => {
      setShowAnimation(false);
      setAnimationPhase(0);
    }, 4000);
  };

  // Auto-trigger celebration on load
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCelebration();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce">🎈</div>
        <div className="absolute top-20 right-20 text-5xl animate-pulse">✨</div>
        <div className="absolute bottom-20 left-20 text-4xl animate-spin">🎪</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎂</div>
        <div className="absolute top-1/2 left-5 text-3xl animate-pulse" style={{ animationDelay: '1s' }}>🎉</div>
        <div className="absolute top-1/3 right-5 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>🎁</div>
      </div>

      {/* Celebration Animation Overlay */}
      <CelebrationAnimation isActive={showAnimation} phase={animationPhase} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Birthday Message */}
        <BirthdayMessage 
          recipientName={BIRTHDAY_DATA.recipientName}
          message={BIRTHDAY_DATA.message}
          onCelebrate={triggerCelebration}
        />

        {/* Photo Gallery */}
        <PhotoGallery 
          photos={BIRTHDAY_DATA.photos} 
          title="Birthday Memories Gallery" 
        />

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <div className="text-2xl mb-4">
            🎊 Have the most wonderful birthday ever! 🎊
          </div>
          <div className="text-gray-600">
            Made with 💖 for someone special
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ✨ This is a static client-side birthday card - no server required! ✨
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
