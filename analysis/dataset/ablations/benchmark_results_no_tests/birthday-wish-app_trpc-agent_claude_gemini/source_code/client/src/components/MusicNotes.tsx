import { useEffect, useState } from 'react';

export function MusicNotes() {
  const [notes, setNotes] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    const musicNotes = ['🎵', '🎶', '🎼'];
    const initialNotes = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: i * 300,
      note: musicNotes[Math.floor(Math.random() * musicNotes.length)]
    }));

    setNotes(initialNotes as any);

    // Clear notes after animation
    const timer = setTimeout(() => {
      setNotes([]);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (notes.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {notes.map((note) => (
        <div
          key={note.id}
          className="absolute text-2xl animate-bounce opacity-70"
          style={{
            left: `${note.x}%`,
            animationDelay: `${note.delay}ms`,
            animationDuration: '2s',
            top: '20%'
          }}
        >
          {(note as any).note}
        </div>
      ))}
    </div>
  );
}
