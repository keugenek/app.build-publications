import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyHabitsProps {
  onCreateHabit: () => void;
}

export function EmptyHabits({ onCreateHabit }: EmptyHabitsProps) {
  const habitSuggestions = [
    { emoji: '💧', text: 'Drink 8 glasses of water' },
    { emoji: '📚', text: 'Read for 20 minutes' },
    { emoji: '🏃‍♂️', text: 'Walk 10,000 steps' },
    { emoji: '🧘‍♀️', text: 'Meditate for 10 minutes' },
    { emoji: '🍎', text: 'Eat a healthy breakfast' },
    { emoji: '😴', text: 'Sleep before 11 PM' }
  ];

  return (
    <div className="space-y-8">
      <Card className="text-center py-16">
        <CardContent>
          <div className="text-8xl mb-6">🌱</div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Ready to build great habits?</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start your journey toward positive change. Every expert was once a beginner, 
            and every pro was once an amateur.
          </p>
          <Button 
            onClick={onCreateHabit}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            🚀 Create Your First Habit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">💡 Popular Habit Ideas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {habitSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={onCreateHabit}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <span className="text-2xl">{suggestion.emoji}</span>
                <span className="text-sm text-gray-700">{suggestion.text}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Click any suggestion to get started, or create your own custom habit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
