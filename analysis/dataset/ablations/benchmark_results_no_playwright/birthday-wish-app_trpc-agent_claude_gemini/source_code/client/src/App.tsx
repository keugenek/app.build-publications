import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import './App.css';

// Static birthday card data
const birthdayData = {
  title: "🎉 Happy Birthday Sarah! 🎉",
  message: "Wishing you the most amazing day filled with happiness and laughter! May all your dreams come true this year. You bring so much joy to everyone around you, and today we celebrate YOU! 🎂✨",
  recipient_name: "Sarah",
  sender_name: "Love, Your Family & Friends",
  theme_color: "#ff69b4"
};

// Static photo gallery data
const photos = [
  {
    id: 1,
    image_url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
    caption: "Your beautiful smile lights up every room! ✨",
    display_order: 1
  },
  {
    id: 2,
    image_url: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&h=300&fit=crop",
    caption: "Dancing through life with grace and joy! 💃",
    display_order: 2
  },
  {
    id: 3,
    image_url: "https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=400&h=300&fit=crop",
    caption: "Always ready for new adventures! 🌟",
    display_order: 3
  },
  {
    id: 4,
    image_url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop",
    caption: "Making memories that last a lifetime! 📸",
    display_order: 4
  }
];

function App() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  // Start celebration animation on page load after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
      setAnimationStarted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const triggerCelebration = () => {
    setShowAnimation(false);
    setTimeout(() => {
      setShowAnimation(true);
    }, 100);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-yellow-100 overflow-hidden relative"
      style={{ 
        backgroundImage: `linear-gradient(135deg, ${birthdayData.theme_color}20, #fef7cd, #f3e8ff)` 
      }}
    >
      {/* Animated confetti and celebration elements */}
      {showAnimation && (
        <div className="celebration-container">
          <div className="confetti-piece confetti-1">🎉</div>
          <div className="confetti-piece confetti-2">🎈</div>
          <div className="confetti-piece confetti-3">🎂</div>
          <div className="confetti-piece confetti-4">⭐</div>
          <div className="confetti-piece confetti-5">🎊</div>
          <div className="confetti-piece confetti-6">💖</div>
          <div className="confetti-piece confetti-7">🌟</div>
          <div className="confetti-piece confetti-8">🎁</div>
          <div className="floating-heart floating-heart-1">💕</div>
          <div className="floating-heart floating-heart-2">💝</div>
          <div className="floating-heart floating-heart-3">💖</div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header with birthday title */}
        <div className="text-center mb-12">
          <h1 
            className={`text-6xl md:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 animate-bounce ${animationStarted ? 'birthday-title-glow' : ''}`}
            style={{ fontFamily: 'Comic Sans MS, cursive' }}
          >
            {birthdayData.title}
          </h1>
          
          <div className="animate-pulse">
            <Button 
              onClick={triggerCelebration}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-all duration-300 celebration-button"
            >
              🎉 Click to Celebrate! 🎉
            </Button>
          </div>
        </div>

        {/* Birthday message card */}
        <Card className="mb-12 shadow-2xl border-4 border-pink-200 bg-white/90 backdrop-blur-sm card-hover">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed mb-6 font-medium">
                {birthdayData.message}
              </p>
              <div className="text-xl text-pink-600 font-semibold">
                {birthdayData.sender_name} 💝
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-8 text-purple-800">
            📸 Beautiful Memories 📸
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {photos
              .sort((a, b) => a.display_order - b.display_order)
              .map((photo) => (
                <Card 
                  key={photo.id} 
                  className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer photo-card border-4 border-pink-100"
                  onClick={() => setSelectedPhoto(selectedPhoto === photo.id ? null : photo.id)}
                >
                  <div className="relative">
                    <img
                      src={photo.image_url}
                      alt={photo.caption || `Memory ${photo.display_order}`}
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end">
                      <div className="text-white p-4 w-full">
                        <p className="text-lg font-semibold">Click to expand</p>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <p className="text-lg text-center text-gray-700 font-medium">
                      {photo.caption}
                    </p>
                  </CardContent>
                  
                  {selectedPhoto === photo.id && (
                    <div className="bg-pink-50 p-6 border-t-4 border-pink-200">
                      <div className="text-center">
                        <p className="text-pink-700 text-xl mb-4">
                          Such a wonderful moment! ✨
                        </p>
                        <div className="text-4xl">
                          💕 🌟 💖 🎈 💕
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </div>

        {/* Birthday wishes footer */}
        <Card className="bg-gradient-to-r from-pink-200 to-purple-200 border-4 border-pink-300 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-purple-800 mb-4">
                🎂 Make a Wish! 🎂
              </h3>
              <p className="text-xl text-gray-700 mb-6">
                Blow out the candles and make your birthday wish come true!
              </p>
              <div className="text-6xl animate-pulse candles">
                🕯️ 🕯️ 🕯️ 🕯️ 🕯️
              </div>
              <p className="text-lg text-purple-600 mt-4 font-semibold">
                Another amazing year begins! 🌈
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating birthday elements */}
      <div className="floating-decorations">
        <div className="floating-balloon floating-balloon-1">🎈</div>
        <div className="floating-balloon floating-balloon-2">🎈</div>
        <div className="floating-balloon floating-balloon-3">🎈</div>
        <div className="floating-gift floating-gift-1">🎁</div>
        <div className="floating-gift floating-gift-2">🎁</div>
      </div>
    </div>
  );
}

export default App;
