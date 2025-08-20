import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MoodLegend() {
  return (
    <Card className="mt-8 bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg text-green-800 text-center">🌱 Plant Mood Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl">😊</div>
            <div className="font-medium text-green-800">Happy</div>
            <div className="text-xs text-gray-600">Watered ≤2 days, Medium/High sun</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">😰</div>
            <div className="font-medium text-yellow-800">Thirsty</div>
            <div className="text-xs text-gray-600">Not watered {'>'}2 days</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">😴</div>
            <div className="font-medium text-blue-800">Sun-deprived</div>
            <div className="text-xs text-gray-600">Low sunlight exposure</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">🤢</div>
            <div className="font-medium text-purple-800">Over-watered</div>
            <div className="text-xs text-gray-600">Watered {'<'}1 day ago</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
