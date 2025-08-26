import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { DailyConspiracyLevel } from '../../../server/src/schema';

interface ConspiracyMeterProps {
  conspiracyLevel: DailyConspiracyLevel;
}

export function ConspiracyMeter({ conspiracyLevel }: ConspiracyMeterProps) {
  const getConspiracyDetails = (level: string, points: number) => {
    switch (level) {
      case 'LOW':
        return {
          emoji: '😸',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Innocent as a sleeping kitten... or so they want you to think.',
          progressColor: 'bg-green-500',
          percentage: Math.min((points / 10) * 100, 100)
        };
      case 'MODERATE':
        return {
          emoji: '🤔',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Definitely plotting something. Keep a close eye on this one.',
          progressColor: 'bg-yellow-500',
          percentage: Math.min(((points - 10) / 15) * 100, 100)
        };
      case 'HIGH':
        return {
          emoji: '😼',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Major conspiracy underway! This cat is up to no good.',
          progressColor: 'bg-orange-500',
          percentage: Math.min(((points - 25) / 25) * 100, 100)
        };
      case 'EXTREME':
        return {
          emoji: '🙀',
          color: 'bg-red-100 text-red-800 border-red-200 pulse-danger',
          description: 'DANGER! This cat poses a serious threat to household security!',
          progressColor: 'bg-red-500',
          percentage: Math.min(((points - 50) / 50) * 100, 100)
        };
      case 'WORLD_DOMINATION':
        return {
          emoji: '👑',
          color: 'bg-purple-100 text-purple-800 border-purple-200 pulse-danger',
          description: '🚨 WORLD DOMINATION IMMINENT! 🚨 This cat is beyond containment!',
          progressColor: 'bg-purple-500',
          percentage: 100
        };
      default:
        return {
          emoji: '🐱',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Status unknown. Investigation required.',
          progressColor: 'bg-gray-500',
          percentage: 0
        };
    }
  };

  const details = getConspiracyDetails(conspiracyLevel.conspiracy_level, conspiracyLevel.total_suspicion_points);

  return (
    <Card className="border-2 activity-card relative overflow-hidden">
      <div className="absolute inset-0 cat-pattern opacity-30"></div>
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="text-3xl">{details.emoji}</span>
          <div className="flex-1">
            <div className="gradient-text text-2xl font-bold">
              {conspiracyLevel.cat_name}'s Conspiracy Status
            </div>
            <div className="text-sm text-purple-600 font-normal">
              Investigation Date: {conspiracyLevel.date}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        {/* Conspiracy Level Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`text-lg px-4 py-2 conspiracy-badge ${details.color}`}>
            {conspiracyLevel.conspiracy_level.replace('_', ' ')}
          </Badge>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-800">
              {conspiracyLevel.total_suspicion_points}
              <span className="text-base font-normal text-purple-600 ml-1">points</span>
            </div>
            <div className="text-sm text-purple-600">
              {conspiracyLevel.activity_count} suspicious {conspiracyLevel.activity_count === 1 ? 'activity' : 'activities'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Threat Level</span>
            <span>{Math.round(details.percentage)}%</span>
          </div>
          <Progress 
            value={details.percentage} 
            className="h-3"
          />
        </div>

        {/* Description */}
        <div className={`p-3 rounded-lg border-l-4 ${
          conspiracyLevel.conspiracy_level === 'WORLD_DOMINATION' || conspiracyLevel.conspiracy_level === 'EXTREME'
            ? 'bg-red-50 border-red-400 text-red-800'
            : 'bg-purple-50 border-purple-400 text-purple-800'
        }`}>
          <p className="font-medium text-sm">
            {details.description}
          </p>
        </div>

        {/* Threat Level Scale */}
        <div className="text-xs text-gray-600 mt-4">
          <div className="font-semibold mb-1">Threat Level Scale:</div>
          <div className="grid grid-cols-5 gap-1 text-center">
            <div className="text-green-600">LOW<br/>0-10</div>
            <div className="text-yellow-600">MODERATE<br/>11-25</div>
            <div className="text-orange-600">HIGH<br/>26-50</div>
            <div className="text-red-600">EXTREME<br/>51-100</div>
            <div className="text-purple-600">DOMINATION<br/>100+</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
