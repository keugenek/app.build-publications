import { Card, CardContent } from '@/components/ui/card';
import type { HabitWithStreak } from '../../../server/src/schema';

interface MotivationalQuoteProps {
  habits: HabitWithStreak[];
}

export function MotivationalQuote({ habits }: MotivationalQuoteProps) {
  const completedToday = habits.filter((h: HabitWithStreak) => h.completed_today).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? (completedToday / totalHabits) : 0;
  const hasActiveStreaks = habits.some((h: HabitWithStreak) => h.current_streak > 0);

  const getQuote = () => {
    if (totalHabits === 0) {
      return {
        quote: "The journey of a thousand miles begins with one step.",
        author: "Lao Tzu",
        emoji: "🌟"
      };
    }

    if (completionRate === 1) {
      return {
        quote: "Success is the sum of small efforts repeated day in and day out.",
        author: "Robert Collier",
        emoji: "🏆"
      };
    }

    if (completionRate >= 0.8) {
      return {
        quote: "Excellence is not a skill, it's an attitude.",
        author: "Ralph Marston",
        emoji: "💪"
      };
    }

    if (completionRate >= 0.5) {
      return {
        quote: "Progress, not perfection, is what we should strive for.",
        author: "Simon Sinek",
        emoji: "🌈"
      };
    }

    if (hasActiveStreaks) {
      return {
        quote: "Don't break the chain. Consistency is the mother of mastery.",
        author: "Robin Sharma",
        emoji: "⛓️"
      };
    }

    return {
      quote: "Every moment is a fresh beginning.",
      author: "T.S. Eliot",
      emoji: "🌅"
    };
  };

  const quote = getQuote();

  if (totalHabits === 0) {
    return null; // Don't show for empty state
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <CardContent className="p-6 text-center">
        <div className="text-3xl mb-3">{quote.emoji}</div>
        <blockquote className="text-lg font-medium text-gray-900 mb-2 italic">
          "{quote.quote}"
        </blockquote>
        <cite className="text-sm text-gray-600">— {quote.author}</cite>
      </CardContent>
    </Card>
  );
}
