import './App.css';
import { BirthdayCard } from './components/BirthdayCard';
import { ConfettiAnimation } from './components/ConfettiAnimation';
import { PhotoGallery } from './components/PhotoGallery';
import { MusicNotes } from './components/MusicNotes';
import { useState, useEffect } from 'react';

// Static data embedded in the frontend
const cardData = {
  title: "🎉 Happy Birthday! 🎉",
  message: "Wishing you the most amazing birthday filled with love, laughter, and all your favorite things! May this new year of life bring you endless joy, wonderful adventures, and dreams that come true. You deserve all the happiness in the world! Here's to another year of making beautiful memories together! 🎂✨",
  recipientName: "Amazing Person",
  senderName: "Your loving friends & family"
};

// Static birthday website - completely self-contained with no backend dependencies

const galleryImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop&auto=format",
    altText: "Beautiful birthday cake with candles",
    caption: "Make a wish! 🕯️"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600&h=400&fit=crop&auto=format",
    altText: "Colorful birthday balloons floating",
    caption: "Party time! 🎈"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop&auto=format",
    altText: "Birthday presents wrapped in colorful paper",
    caption: "Surprises await! 🎁"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&h=400&fit=crop&auto=format",
    altText: "Happy birthday celebration with friends",
    caption: "Memories to cherish! 📸"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=600&h=400&fit=crop&auto=format",
    altText: "Festive birthday decorations and streamers",
    caption: "Let's celebrate! 🎊"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&h=400&fit=crop&auto=format",
    altText: "Birthday cupcakes with colorful sprinkles",
    caption: "Sweet treats! 🧁"
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format",
    altText: "Birthday party hats and confetti",
    caption: "Ready to party! 🥳"
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&h=400&fit=crop&auto=format",
    altText: "Sparkler candles on birthday cake",
    caption: "Magical moments! ✨"
  }
];

function App() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    // Auto-trigger confetti after card appears
    const confettiTimer = setTimeout(() => {
      setShowConfetti(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  const triggerConfetti = () => {
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 via-purple-200/20 to-blue-200/20 animate-pulse"></div>
      <div className="absolute top-10 left-10 text-6xl animate-bounce">🎈</div>
      <div className="absolute top-20 right-20 text-5xl animate-pulse">🎉</div>
      <div className="absolute bottom-20 left-20 text-4xl animate-bounce delay-1000">🎂</div>
      <div className="absolute bottom-10 right-10 text-5xl animate-pulse delay-500">🎁</div>
      
      {/* Music Notes Animation on Load */}
      <MusicNotes />
      
      {/* Confetti Animation */}
      {showConfetti && <ConfettiAnimation />}
      
      <div className={`container mx-auto px-4 py-8 relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        {/* Main Birthday Card */}
        <div className="max-w-4xl mx-auto">
          <BirthdayCard 
            title={cardData.title}
            message={cardData.message}
            recipientName={cardData.recipientName}
            senderName={cardData.senderName}
            onCelebrate={triggerConfetti}
          />
          
          {/* Photo Gallery */}
          <div className="mt-12">
            <PhotoGallery images={galleryImages} />
          </div>
          
          {/* Fun Birthday Facts */}
          <div className="text-center mt-12 p-6 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-xl shadow-lg border border-purple-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-3xl mb-2">🎂</div>
                <p className="text-lg font-semibold text-purple-700">Another Year</p>
                <p className="text-sm text-gray-600">Of Amazing Adventures!</p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-3xl mb-2">💝</div>
                <p className="text-lg font-semibold text-pink-700">Countless Memories</p>
                <p className="text-sm text-gray-600">To Be Created!</p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-lg">
                <div className="text-3xl mb-2">🌟</div>
                <p className="text-lg font-semibold text-blue-700">Infinite Possibilities</p>
                <p className="text-sm text-gray-600">Waiting Ahead!</p>
              </div>
            </div>
          </div>

          {/* Footer Message */}
          <div className="text-center mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
            <p className="text-lg text-gray-700 font-medium mb-2">
              🌟 Hope your special day is absolutely wonderful! 🌟
            </p>
            <p className="text-sm text-gray-500">
              Made with 💝 for someone very special
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
