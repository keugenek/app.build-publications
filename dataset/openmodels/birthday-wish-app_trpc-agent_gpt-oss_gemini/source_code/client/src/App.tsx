import { useEffect, useState } from 'react';

import { PhotoGallery } from './components/PhotoGallery';
import { Confetti } from './components/Confetti';

// Hard‑coded data for the birthday card
const BIRTHDAY_MESSAGE = `Happy Birthday, Alex! 🎉\nWishing you a day filled with love, laughter, and unforgettable moments.`;
const PHOTOS: string[] = [
  'https://picsum.photos/seed/1/300/200',
  'https://picsum.photos/seed/2/300/200',
  'https://picsum.photos/seed/3/300/200',
  'https://picsum.photos/seed/4/300/200',
];

import { Card } from './components/Card';

export default function App() {
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti once when the component mounts
  useEffect(() => {
    setShowConfetti(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-pink-50 to-rose-100 flex flex-col items-center p-4">
      {/* Confetti animation */}
      {showConfetti && <Confetti />}

      <Card className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-3xl font-extrabold text-center text-indigo-800">
          {BIRTHDAY_MESSAGE.split('\n')[0]}
        </h1>
        <p className="text-lg text-center text-gray-700 whitespace-pre-line">
          {BIRTHDAY_MESSAGE.split('\n')[1]}
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-center text-pink-600">Memories</h2>
          <PhotoGallery photos={PHOTOS} />
        </section>

        <footer className="flex justify-center">
          <button
            className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded"
            onClick={() => setShowConfetti(true)}
          >
            Celebrate Again!
          </button>
        </footer>
      </Card>
    </div>
  );
}
