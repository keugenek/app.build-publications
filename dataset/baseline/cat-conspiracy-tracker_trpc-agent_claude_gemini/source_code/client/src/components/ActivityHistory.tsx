import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { ActivityWithBehaviorType } from '../../../server/src/schema';

interface ActivityHistoryProps {
  activities: ActivityWithBehaviorType[];
}

export function ActivityHistory({ activities }: ActivityHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [catNameFilter, setCatNameFilter] = useState('all');
  const [behaviorTypeFilter, setBehaviorTypeFilter] = useState('all');

  // Get unique cat names for filtering
  const uniqueCatNames = Array.from(
    new Set(
      activities
        .map((activity: ActivityWithBehaviorType) => activity.cat_name)
        .filter((name): name is string => name !== null)
    )
  ).sort();

  // Get unique behavior types for filtering
  const uniqueBehaviorTypes = Array.from(
    new Set(
      activities.map((activity: ActivityWithBehaviorType) => activity.behavior_type.name)
    )
  ).sort();

  // Filter activities based on search and filters
  const filteredActivities = activities.filter((activity: ActivityWithBehaviorType) => {
    const matchesSearch = 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.behavior_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.cat_name && activity.cat_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCatName = 
      catNameFilter === 'all' || 
      (catNameFilter === 'unnamed' && !activity.cat_name) ||
      activity.cat_name === catNameFilter;

    const matchesBehaviorType = 
      behaviorTypeFilter === 'all' || 
      activity.behavior_type.name === behaviorTypeFilter;

    return matchesSearch && matchesCatName && matchesBehaviorType;
  });

  const getScoreColor = (score: number): string => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 5) return 'bg-yellow-500';
    if (score <= 7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const totalConspiracyScore = filteredActivities.reduce(
    (sum: number, activity: ActivityWithBehaviorType) => sum + activity.behavior_type.conspiracy_score,
    0
  );

  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📚 Suspicious Activity Archive
        </CardTitle>
        <CardDescription>
          Complete history of documented feline conspiracies
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="search">Search Activities</Label>
            <Input
              id="search"
              placeholder="Search descriptions, behaviors..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Filter by Cat</Label>
            <Select value={catNameFilter} onValueChange={setCatNameFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All cats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cats</SelectItem>
                <SelectItem value="unnamed">Unnamed Cat</SelectItem>
                {uniqueCatNames.map((name: string) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filter by Behavior</Label>
            <Select value={behaviorTypeFilter} onValueChange={setBehaviorTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All behaviors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Behaviors</SelectItem>
                {uniqueBehaviorTypes.map((behaviorType: string) => (
                  <SelectItem key={behaviorType} value={behaviorType}>
                    {behaviorType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Summary</Label>
            <div className="p-3 bg-purple-50 rounded-md border">
              <p className="text-sm text-purple-800 font-semibold">
                {filteredActivities.length} activities
              </p>
              <p className="text-sm text-purple-600">
                Total Score: {totalConspiracyScore}
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Activities List */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            {activities.length === 0 ? (
              <>
                <p>No suspicious activities recorded yet.</p>
                <p className="text-sm mt-2">Start logging your cat's schemes in the "Log Activity" tab!</p>
              </>
            ) : (
              <>
                <p>No activities match your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your filters or search term.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity: ActivityWithBehaviorType, index: number) => (
              <div key={activity.id}>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getScoreColor(activity.behavior_type.conspiracy_score)} text-white`}>
                        {activity.behavior_type.name}
                      </Badge>
                      <Badge variant="outline">
                        Score: {activity.behavior_type.conspiracy_score}/10
                      </Badge>
                      {activity.cat_name && (
                        <Badge variant="secondary">
                          🐱 {activity.cat_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(activity.activity_date)}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-gray-800 leading-relaxed">{activity.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Logged: {activity.created_at.toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      🔍 Evidence #{activity.id}
                    </span>
                  </div>
                </div>
                {index < filteredActivities.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
