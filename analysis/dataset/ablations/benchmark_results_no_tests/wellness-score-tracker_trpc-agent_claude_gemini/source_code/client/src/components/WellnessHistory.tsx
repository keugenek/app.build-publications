import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { WellnessEntry } from '../../../server/src/schema';

interface WellnessHistoryProps {
  entries: WellnessEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function WellnessHistory({ entries, isLoading, onRefresh }: WellnessHistoryProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '😊';
    if (score >= 70) return '🙂';
    if (score >= 60) return '😐';
    if (score >= 50) return '😟';
    return '😞';
  };

  const formatDate = (date: Date): string => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const calculateAverageScore = (): number => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc: number, entry: WellnessEntry) => acc + entry.wellness_score, 0);
    return Math.round(sum / entries.length);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your wellness history...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No entries yet</h3>
        <p className="text-gray-500 mb-4">Start tracking your wellness by logging your first entry!</p>
        <Button onClick={onRefresh} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  const averageScore = calculateAverageScore();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`text-lg font-bold py-1 px-3 ${getScoreColor(averageScore)}`}>
              {averageScore}/100
            </Badge>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Best Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.max(...entries.map((e: WellnessEntry) => e.wellness_score))}/100
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Recent Entries</h3>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entries.map((entry: WellnessEntry, index: number) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-700">
                      {formatDate(entry.date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={`${getScoreColor(entry.wellness_score)} flex items-center gap-1`}>
                    <span>{getScoreEmoji(entry.wellness_score)}</span>
                    <span className="font-bold">{entry.wellness_score}/100</span>
                  </Badge>
                </div>
                
                <Separator className="my-3" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-600">😴 Sleep</div>
                    <div className="text-gray-800">{entry.sleep_hours}h</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600">😰 Stress</div>
                    <div className="text-gray-800">{entry.stress_level}/10</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600">☕ Caffeine</div>
                    <div className="text-gray-800">{entry.caffeine_intake}mg</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600">🍷 Alcohol</div>
                    <div className="text-gray-800">{entry.alcohol_intake} drinks</div>
                  </div>
                </div>
                
                {index < entries.length - 1 && (
                  <div className="mt-3 text-xs text-gray-400 text-center">
                    {entry.wellness_score > entries[index + 1].wellness_score ? (
                      <span className="text-green-600">↗️ +{entry.wellness_score - entries[index + 1].wellness_score} from previous</span>
                    ) : entry.wellness_score < entries[index + 1].wellness_score ? (
                      <span className="text-red-600">↘️ {entry.wellness_score - entries[index + 1].wellness_score} from previous</span>
                    ) : (
                      <span className="text-gray-500">→ No change from previous</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
