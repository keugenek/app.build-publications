import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface BirthdayCardProps {
  title: string;
  message: string;
  recipientName: string;
  senderName: string;
  onCelebrate?: () => void;
}

export function BirthdayCard({ 
  title, 
  message, 
  recipientName, 
  senderName, 
  onCelebrate 
}: BirthdayCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCelebrate = () => {
    setIsFlipped(true);
    onCelebrate?.();
    
    // Play celebration sound (if supported by browser)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjqS2O+9diMFl');
      audio.volume = 0.1;
      audio.play().catch(() => {
        // Fallback: silent if audio fails
      });
    } catch (error) {
      // Audio not supported - no problem
    }
    
    setTimeout(() => setIsFlipped(false), 3000);
  };

  return (
    <div className="relative perspective-1000">
      <Card className={`
        mx-auto max-w-2xl 
        transform transition-all duration-700 
        ${isFlipped ? 'rotate-y-180 scale-105' : 'hover:scale-[1.02]'}
        bg-gradient-to-br from-white via-pink-50 to-purple-50
        shadow-xl border-0
        relative overflow-hidden
      `}>
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 text-2xl">🎈</div>
          <div className="absolute top-4 right-4 text-2xl">🎉</div>
          <div className="absolute bottom-4 left-4 text-2xl">🎂</div>
          <div className="absolute bottom-4 right-4 text-2xl">🎁</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl opacity-5">
            🎊
          </div>
        </div>

        <CardHeader className="text-center relative z-10 pb-4">
          <CardTitle className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
            {title}
          </CardTitle>
          <div className="text-2xl md:text-3xl font-semibold text-purple-700 mb-2">
            Dear {recipientName}! ✨
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Birthday Message */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-inner border border-purple-100">
            <p className="text-lg leading-relaxed text-gray-700 text-center font-medium">
              {message}
            </p>
          </div>

          {/* Sender Info */}
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">
              With lots of love,
            </p>
            <p className="text-xl font-semibold text-purple-700 mb-6">
              {senderName} 💕
            </p>
          </div>

          {/* Celebration Button */}
          <div className="text-center">
            <Button
              onClick={handleCelebrate}
              disabled={isFlipped}
              className={`
                bg-gradient-to-r from-pink-500 to-purple-600 
                hover:from-pink-600 hover:to-purple-700
                text-white font-bold text-lg px-8 py-4 rounded-full
                transform transition-all duration-300
                ${isFlipped ? 'animate-bounce' : 'hover:scale-110'}
                shadow-lg hover:shadow-xl
                disabled:opacity-50
              `}
            >
              {isFlipped ? '🎊 Celebrating! 🎊' : '🎉 Celebrate! 🎉'}
            </Button>
          </div>

          {/* Birthday wishes animation area */}
          {isFlipped && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="text-3xl animate-bounce">
                🎈🎂🎈
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-purple-600 animate-pulse">
                  🎵 Happy Birthday to You! 🎵
                </p>
                <p className="text-lg font-semibold text-pink-600">
                  Make this year amazing!
                </p>
                <div className="flex justify-center space-x-2 text-2xl">
                  <span className="animate-bounce delay-100">🌟</span>
                  <span className="animate-bounce delay-200">✨</span>
                  <span className="animate-bounce delay-300">💫</span>
                  <span className="animate-bounce delay-400">⭐</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
