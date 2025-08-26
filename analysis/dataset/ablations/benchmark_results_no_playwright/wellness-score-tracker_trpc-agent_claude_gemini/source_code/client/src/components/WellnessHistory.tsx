import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WellnessEntry } from '../../../server/src/schema';

interface WellnessHistoryProps {
  entries: WellnessEntry[];
  onDeleteEntry?: (id: number) => void;
  isDeleting?: boolean;
}

export function WellnessHistory({ entries, onDeleteEntry, isDeleting = false }: WellnessHistoryProps) {
  const getWellnessScoreColor = (score: number): string => {
    if (score >= 80) return 'score-excellent bg-green-500';
    if (score >= 60) return 'score-good bg-yellow-500';
    if (score >= 40) return 'score-fair bg-orange-500';
    return 'score-poor bg-red-500';
  };

  const getWellnessScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '😊';
    if (score >= 40) return '😐';
    return '😔';
  };

  const getSleepQuality = (hours: number): string => {
    if (hours >= 7 && hours <= 9) return '✅ Optimal';
    if (hours >= 6 && hours <= 10) return '⚠️ Acceptable';
    return '❌ Poor';
  };

  const getStressLevel = (level: number): string => {
    if (level <= 3) return '😌 Low';
    if (level <= 6) return '😐 Moderate';
    if (level <= 8) return '😰 High';
    return '🚨 Very High';
  };

  if (entries.length === 0) {
    return (
      <Card className="shadow-lg wellness-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Wellness History
          </CardTitle>
          <CardDescription>
            Your recent wellness entries and scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-xl font-semibold mb-2">No entries yet!</p>
            <p className="text-gray-600">Start tracking your wellness by adding your first entry.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg wellness-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Wellness History
        </CardTitle>
        <CardDescription>
          Your recent wellness entries and scores ({entries.length} total entries)
        </CardDescription>
      </CardHeader>
      <CardContent className="wellness-scroll max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {entries.map((entry: WellnessEntry) => (
            <Card key={entry.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getScoreEmoji(entry.wellness_score)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {entry.date.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </h3>
                      <Badge 
                        className={`${getWellnessScoreColor(entry.wellness_score)} text-white wellness-badge`}
                      >
                        {entry.wellness_score.toFixed(1)} - {getWellnessScoreLabel(entry.wellness_score)}
                      </Badge>
                    </div>
                  </div>
                  
                  {onDeleteEntry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteEntry(entry.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting ? '⏳' : '🗑️'}
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">😴</span>
                      <span className="font-medium text-gray-700">Sleep</span>
                    </div>
                    <p className="font-bold text-blue-600">{entry.hours_of_sleep}h</p>
                    <p className="text-xs text-gray-600">{getSleepQuality(entry.hours_of_sleep)}</p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">😰</span>
                      <span className="font-medium text-gray-700">Stress</span>
                    </div>
                    <p className="font-bold text-orange-600">{entry.stress_level}/10</p>
                    <p className="text-xs text-gray-600">{getStressLevel(entry.stress_level)}</p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">☕</span>
                      <span className="font-medium text-gray-700">Caffeine</span>
                    </div>
                    <p className="font-bold text-yellow-600">{entry.caffeine_intake}mg</p>
                    <p className="text-xs text-gray-600">
                      {entry.caffeine_intake === 0 ? 'None' : 
                       entry.caffeine_intake <= 400 ? 'Moderate' : 'High'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🍷</span>
                      <span className="font-medium text-gray-700">Alcohol</span>
                    </div>
                    <p className="font-bold text-purple-600">{entry.alcohol_intake} drinks</p>
                    <p className="text-xs text-gray-600">
                      {entry.alcohol_intake === 0 ? 'None' : 
                       entry.alcohol_intake <= 2 ? 'Light' : 'Heavy'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Logged: {entry.created_at.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
