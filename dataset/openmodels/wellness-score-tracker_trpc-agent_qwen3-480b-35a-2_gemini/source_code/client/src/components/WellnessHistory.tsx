import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WellnessEntry } from '../../../server/src/schema';

interface WellnessHistoryProps {
  entries: WellnessEntry[];
}

export function WellnessHistory({ entries }: WellnessHistoryProps) {
  // Calculate average wellness score
  const averageWellnessScore = entries.length > 0 
    ? entries.reduce((sum, entry) => sum + entry.wellness_score, 0) / entries.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center py-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Entries</h3>
          <p className="text-3xl font-bold text-indigo-600">{entries.length}</p>
        </Card>
        
        <Card className="text-center py-6">
          <h3 className="text-lg font-semibold text-gray-700">Average Score</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {averageWellnessScore.toFixed(1)}
          </p>
        </Card>
        
        <Card className="text-center py-6">
          <h3 className="text-lg font-semibold text-gray-700">Latest Score</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {entries.length > 0 ? entries[entries.length - 1].wellness_score.toFixed(1) : 'N/A'}
          </p>
        </Card>
      </div>
      
      {entries.length > 0 ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Detailed History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...entries]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div 
                    key={entry.id} 
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="mb-2 md:mb-0">
                      <div className="font-medium">
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        Logged on {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Sleep: {entry.sleep_hours}h
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Stress: {entry.stress_level}/10
                      </Badge>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Caffeine: {entry.caffeine_intake}
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        Alcohol: {entry.alcohol_intake}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={
                          entry.wellness_score >= 70 
                            ? "bg-green-100 text-green-800" 
                            : entry.wellness_score >= 40 
                              ? "bg-yellow-100 text-yellow-800" 
                              : "bg-red-100 text-red-800"
                        }
                      >
                        Wellness: {entry.wellness_score.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg text-center py-12">
          <CardContent>
            <p className="text-gray-500">No wellness entries yet. Start by logging your first entry!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
