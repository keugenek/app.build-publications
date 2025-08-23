// client/src/App.tsx
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';

// Local type definitions (mirroring server schema)
export type Message = {
  id: number;
  message: string;
  created_at: Date;
};

export type Photo = {
  id: number;
  url: string;
  caption: string | null;
  order: number;
  created_at: Date;
};

// Hard‑coded data – in a real project this could be fetched from a static JSON file
const messages: Message[] = [
  {
    id: 1,
    message:
      "Wishing you a day filled with love, laughter, and wonderful memories. Happy Birthday!",
    created_at: new Date(),
  },
];

const photos: Photo[] = [
  {
    id: 1,
    url: "https://picsum.photos/seed/1/300/200",
    caption: "Cake time!",
    order: 1,
    created_at: new Date(),
  },
  {
    id: 2,
    url: "https://picsum.photos/seed/2/300/200",
    caption: "Friends gathering",
    order: 2,
    created_at: new Date(),
  },
  {
    id: 3,
    url: "https://picsum.photos/seed/3/300/200",
    caption: null,
    order: 3,
    created_at: new Date(),
  },
];

function Confetti() {
  // Create a few confetti pieces with random positions & animation delays
  const [pieces] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    }))
  );

  // Define keyframes via a style tag (Tailwind does not include this animation by default)
  const confettiStyle = `
    @keyframes fall {
      0% { transform: translateY(0); opacity: 1; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
  `;

  return (
    <>
      <style>{confettiStyle}</style>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {pieces.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 w-2 h-4 rotate-45"
            style={{
              left: `${p.left}%`,
              backgroundColor: p.color,
              animation: `fall 3s ease-out forwards`,
              animationDelay: `${p.delay}s`,
            }}
          ></div>
        ))}
      </div>
    </>
  );
}

// This is a purely static React application with no server-side dependencies.
// This is a purely static client‑side React application
// This is a purely static client‑side React application
export default function App() { // Final static app
  // Simple effect to start confetti on mount (visible for a few seconds)
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-100 flex flex-col items-center p-4">
      {showConfetti && <Confetti />}

      <h1 className="text-4xl font-extrabold text-center mb-6 text-pink-800">
        🎉 Happy Birthday! 🎉
      </h1>

      {/* Message Card */}
      <Card className="w-full max-w-md p-6 mb-8 bg-white shadow-lg rounded-lg">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar>
  <AvatarImage src="https://i.pravatar.cc/80" alt="Birthday avatar" />
  <AvatarFallback>👤</AvatarFallback>
</Avatar>
          <div>
            <p className="text-lg text-gray-800">{messages[0].message}</p>
            <span className="text-sm text-gray-500">
              {messages[0].created_at.toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Photo Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl">
        {photos
          .sort((a, b) => a.order - b.order)
          .map((photo) => (
            <Card
              key={photo.id}
              className="overflow-hidden rounded-lg shadow-md bg-white"
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Birthday photo'}
                className="w-full h-48 object-cover"
              />
              {photo.caption && (
                <div className="p-2 text-center text-sm text-gray-700">
                  {photo.caption}
                </div>
              )}
            </Card>
          ))}
      </div>
    </div>
  );
}
