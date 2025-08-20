import { DailyConspiracyLevel } from '../../../server/src/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Calendar } from 'lucide-react';

interface ConspiracyLevelDisplayProps {
  dailyLevel: DailyConspiracyLevel | null;
}

export function ConspiracyLevelDisplay({ dailyLevel }: ConspiracyLevelDisplayProps) {
  const getConspiracyLevel = (points: number) => {
    if (points < 20) return { label: 'Low', color: 'bg-green-500', text: 'text-green-500' };
    if (points < 50) return { label: 'Moderate', color: 'bg-yellow-500', text: 'text-yellow-500' };
    if (points < 80) return { label: 'High', color: 'bg-orange-500', text: 'text-orange-500' };
    return { label: 'Extreme', color: 'bg-red-500', text: 'text-red-500' };
  };

  if (!dailyLevel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Today's Conspiracy Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading conspiracy data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const level = getConspiracyLevel(dailyLevel.total_points);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Today's Conspiracy Level
        </CardTitle>
        <CardDescription>
          Based on {dailyLevel.activity_count} suspicious activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">
            {dailyLevel.total_points}
          </div>
          <div className="text-sm text-muted-foreground">
            Total Conspiracy Points
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Level:</span>
            <span className={`font-bold ${level.text}`}>
              {level.label}
            </span>
          </div>
          <Progress 
            value={Math.min(dailyLevel.total_points, 100)} 
            className="h-3"
          />
        </div>
        
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span>
              {level.label === 'Low' && 'Your cat seems innocent today'}
              {level.label === 'Moderate' && 'Your cat is up to something'}
              {level.label === 'High' && 'Your cat is definitely plotting'}
              {level.label === 'Extreme' && 'Your cat is organizing a coup!'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
