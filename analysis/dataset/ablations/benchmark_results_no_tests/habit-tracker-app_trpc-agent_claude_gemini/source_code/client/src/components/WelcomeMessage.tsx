import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function WelcomeMessage() {
  const tips = [
    "Start small - even 5 minutes counts! 🕐",
    "Consistency beats perfection 💫",
    "Track your progress daily 📈",
    "Celebrate your wins, big and small 🎉"
  ];

  return (
    <Card className="text-center py-12 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
      <CardContent>
        <div className="text-6xl mb-4">🌟</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Ready to Start Your Journey?
        </h2>
        <p className="text-gray-500 text-lg mb-6">
          Create your first habit above and begin building a better you!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
          {tips.map((tip, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="p-3 text-sm bg-white/70 border-purple-200 text-purple-700"
            >
              {tip}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
