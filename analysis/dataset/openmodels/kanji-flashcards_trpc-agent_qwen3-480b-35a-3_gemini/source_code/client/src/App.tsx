import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { KanjiFlashcards } from '@/components/KanjiFlashcards';
import { KanjiManager } from '@/components/KanjiManager';

function App() {
  const [activeTab, setActiveTab] = useState<'study' | 'manage'>('study');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-indigo-800 dark:text-indigo-200">
                Kanji Learning App
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Spaced Repetition System for JLPT Kanji
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'study' ? 'default' : 'outline'}
                onClick={() => setActiveTab('study')}
                className="px-4"
              >
                Study Flashcards
              </Button>
              <Button
                variant={activeTab === 'manage' ? 'default' : 'outline'}
                onClick={() => setActiveTab('manage')}
                className="px-4"
              >
                Manage Kanji
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'study' ? <KanjiFlashcards /> : <KanjiManager />}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>Spaced Repetition System (SRS) helps you remember kanji more effectively</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
