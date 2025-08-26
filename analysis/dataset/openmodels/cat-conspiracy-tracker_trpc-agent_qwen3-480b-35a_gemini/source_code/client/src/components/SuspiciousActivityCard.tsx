import { SuspiciousActivity } from '../../../server/src/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cat } from 'lucide-react';

interface SuspiciousActivityCardProps {
  activity: SuspiciousActivity;
}

const activityTypeDisplay: Record<string, { label: string; icon: string }> = {
  PROLONGED_STARE: { label: 'Prolonged Stare', icon: '👁️' },
  GIFT_BRINGING: { label: 'Gift Bringing', icon: '🎁' },
  SUDDEN_PURRING: { label: 'Sudden Purring', icon: '😻' },
  AGGRESSIVE_KNEADING: { label: 'Aggressive Kneading', icon: '🐾' },
  MIDDLE_OF_NIGHT_ZOOMIES: { label: 'Midnight Zoomies', icon: '🌙' },
  ATTACKING_INVISIBLE_ENEMIES: { label: 'Attacking Invisible Enemies', icon: '👻' },
  SITTING_IN_FRONT_OF_MONITOR: { label: 'Monitor Blocking', icon: '📺' },
  KNOCKING_THINGS_OFF_COUNTERS: { label: 'Counter Surfing', icon: '🍽️' },
  HIDING_AND_POUNCE: { label: 'Ambush Pounce', icon: '🐅' },
  CONSTANT_OBSERVATION: { label: 'Constant Observation', icon: '🫣' }
};

export function SuspiciousActivityCard({ activity }: SuspiciousActivityCardProps) {
  const activityDisplay = activityTypeDisplay[activity.activity_type] || { 
    label: activity.activity_type, 
    icon: '🐱' 
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{activityDisplay.icon}</span>
            {activityDisplay.label}
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Cat className="w-3 h-3" />
            {activity.conspiracy_points} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-muted-foreground mb-2">{activity.description}</p>
        <p className="text-xs text-muted-foreground">
          Recorded: {activity.recorded_at.toLocaleDateString()} at {activity.recorded_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </CardContent>
    </Card>
  );
}
