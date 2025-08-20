import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExpandedSuspiciousActivity } from '../../../server/src/schema';

interface ActivityLogProps {
  activities: ExpandedSuspiciousActivity[];
  selectedDate: string;
}

export function ActivityLog({ activities, selectedDate }: ActivityLogProps) {
  const getActivityEmoji = (activityName: string) => {
    const name = activityName.toLowerCase();
    if (name.includes('staring')) return '👁️';
    if (name.includes('knock') || name.includes('push')) return '💥';
    if (name.includes('gift') || name.includes('dead')) return '🎁';
    if (name.includes('zoom') || name.includes('run')) return '💨';
    if (name.includes('purr')) return '😸';
    if (name.includes('ignore') || name.includes('command')) return '🙄';
    if (name.includes('hide') || name.includes('lurk')) return '🫥';
    if (name.includes('vocal') || name.includes('meow')) return '🗣️';
    return '🐾';
  };

  const getSuspicionLevel = (points: number) => {
    if (points <= 2) return { level: 'Minor', color: 'bg-green-100 text-green-700' };
    if (points <= 5) return { level: 'Moderate', color: 'bg-yellow-100 text-yellow-700' };
    if (points <= 8) return { level: 'High', color: 'bg-orange-100 text-orange-700' };
    return { level: 'Extreme', color: 'bg-red-100 text-red-700' };
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Activity Log - {selectedDate}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <div className="text-4xl mb-2">🤔</div>
            <AlertDescription className="text-lg">
              No suspicious activities recorded for this date.
              <br />
              <span className="text-sm text-gray-600 mt-1 block">
                Either your cats are being angels... or they've evolved their stealth capabilities! 
                Keep watching! 🕵️‍♂️
              </span>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group activities by cat for better organization
  const activitiesByCat = activities.reduce((acc, activity) => {
    const catId = activity.cat_id;
    if (!acc[catId]) {
      acc[catId] = [];
    }
    acc[catId].push(activity);
    return acc;
  }, {} as Record<number, ExpandedSuspiciousActivity[]>);

  const totalSuspicionPoints = activities.reduce((sum, activity) => sum + activity.suspicion_points, 0);
  const totalActivities = activities.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            📋 Activity Log - {selectedDate}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-purple-800">
              {totalSuspicionPoints} total points
            </div>
            <div className="text-sm text-purple-600">
              {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(activitiesByCat).map(([catId, catActivities]) => (
          <div key={catId} className="space-y-3">
            {/* Cat header with daily stats */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border">
              <h3 className="font-semibold text-purple-800 text-lg">
                🐱 Cat #{catId} Daily Report
              </h3>
              <div className="text-right">
                <div className="text-purple-800 font-medium">
                  {catActivities.reduce((sum, act) => sum + act.suspicion_points, 0)} points
                </div>
                <div className="text-sm text-purple-600">
                  {catActivities.length} {catActivities.length === 1 ? 'incident' : 'incidents'}
                </div>
              </div>
            </div>

            {/* Activities for this cat */}
            <div className="space-y-2 pl-4">
              {catActivities.map((activity: ExpandedSuspiciousActivity) => {
                const suspicionLevel = getSuspicionLevel(activity.suspicion_points);
                return (
                  <div key={activity.id} className="border rounded-lg p-4 bg-white activity-card hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">{getActivityEmoji(activity.activity_name)}</span>
                        <div>
                          <h4 className="font-medium text-purple-800 text-lg">
                            {activity.activity_name}
                          </h4>
                          {activity.activity_description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.activity_description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${suspicionLevel.color} font-medium`}>
                          {activity.suspicion_points} pts
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suspicionLevel.level}
                        </Badge>
                      </div>
                    </div>

                    {activity.notes && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3 rounded-r-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Field Notes:</span> "{activity.notes}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>🕐 Logged: {activity.logged_at.toLocaleString()}</span>
                      <span>📅 Occurred: {activity.activity_date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
