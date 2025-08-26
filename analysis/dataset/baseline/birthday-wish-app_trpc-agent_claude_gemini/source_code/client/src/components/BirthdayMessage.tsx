import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BirthdayMessageProps {
  recipientName: string;
  message: string;
  onCelebrate: () => void;
}

export function BirthdayMessage({ recipientName, message, onCelebrate }: BirthdayMessageProps) {
  return (
    <div className="text-center mb-12">
      {/* Header */}
      <h1 className="text-6xl font-bold text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text mb-4 animate-pulse">
        Happy Birthday! 🎉
      </h1>
      <div className="text-4xl font-bold text-purple-700 mb-6">
        Dear {recipientName} 💝
      </div>

      {/* Birthday Message Card */}
      <Card className="max-w-2xl mx-auto shadow-2xl border-4 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 birthday-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-purple-700 flex items-center justify-center gap-2">
            🎂 Your Special Message 🎂
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-700 leading-relaxed text-center font-medium mb-6">
            {message}
          </p>
          <div className="text-center">
            <Button 
              onClick={onCelebrate}
              className="celebration-button bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 glow"
            >
              🎉 Celebrate Again! 🎉
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
