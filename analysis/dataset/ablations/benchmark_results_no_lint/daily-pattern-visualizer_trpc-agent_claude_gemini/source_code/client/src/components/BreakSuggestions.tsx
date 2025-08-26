import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Coffee, 
  Eye, 
  Heart, 
  CheckCircle, 
  Clock,
  Briefcase,
  Monitor,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import type { BreakSuggestion } from '../../../server/src/schema';

interface BreakSuggestionsProps {
  suggestions: BreakSuggestion[];
}

export function BreakSuggestions({ suggestions }: BreakSuggestionsProps) {
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<number>>(new Set());

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'work_break':
        return Coffee;
      case 'screen_break':
        return Eye;
      case 'general_wellness':
        return Heart;
      default:
        return AlertTriangle;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'work_break':
        return 'text-orange-600';
      case 'screen_break':
        return 'text-blue-600';
      case 'general_wellness':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUrgencyVariant = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleMarkComplete = (index: number) => {
    setCompletedSuggestions((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const urgencyStats = {
    high: suggestions.filter((s: BreakSuggestion) => s.urgency_level === 'high').length,
    medium: suggestions.filter((s: BreakSuggestion) => s.urgency_level === 'medium').length,
    low: suggestions.filter((s: BreakSuggestion) => s.urgency_level === 'low').length,
  };

  const typeStats = {
    work_break: suggestions.filter((s: BreakSuggestion) => s.suggestion_type === 'work_break').length,
    screen_break: suggestions.filter((s: BreakSuggestion) => s.suggestion_type === 'screen_break').length,
    general_wellness: suggestions.filter((s: BreakSuggestion) => s.suggestion_type === 'general_wellness').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Break Suggestions & Wellness Tips
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your recent well-being data 💡
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{urgencyStats.high}</div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{urgencyStats.medium}</div>
              <div className="text-sm text-gray-600">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{urgencyStats.low}</div>
              <div className="text-sm text-gray-600">Low Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedSuggestions.size}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions by Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Work Break Suggestions */}
        {typeStats.work_break > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-orange-600" />
                Work Breaks
              </CardTitle>
              <CardDescription>
                {typeStats.work_break} recommendation{typeStats.work_break > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions
                .filter((s: BreakSuggestion) => s.suggestion_type === 'work_break')
                .map((suggestion: BreakSuggestion, index: number) => {
                  const globalIndex = suggestions.indexOf(suggestion);
                  const isCompleted = completedSuggestions.has(globalIndex);
                  const SuggestionIcon = getSuggestionIcon(suggestion.suggestion_type);
                  
                  return (
                    <Alert
                      key={globalIndex}
                      className={`transition-all ${isCompleted ? 'opacity-60 bg-green-50' : ''}`}
                    >
                      <SuggestionIcon className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Badge variant={getUrgencyVariant(suggestion.urgency_level)}>
                            {suggestion.urgency_level}
                          </Badge>
                          {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkComplete(globalIndex)}
                        >
                          {isCompleted ? 'Undo' : 'Done'}
                        </Button>
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">{suggestion.message}</p>
                        <p className="text-sm text-gray-600">
                          💡 {suggestion.recommended_action}
                        </p>
                      </AlertDescription>
                    </Alert>
                  );
                })}
            </CardContent>
          </Card>
        )}

        {/* Screen Break Suggestions */}
        {typeStats.screen_break > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-5 w-5 text-blue-600" />
                Screen Breaks
              </CardTitle>
              <CardDescription>
                {typeStats.screen_break} recommendation{typeStats.screen_break > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions
                .filter((s: BreakSuggestion) => s.suggestion_type === 'screen_break')
                .map((suggestion: BreakSuggestion, index: number) => {
                  const globalIndex = suggestions.indexOf(suggestion);
                  const isCompleted = completedSuggestions.has(globalIndex);
                  const SuggestionIcon = getSuggestionIcon(suggestion.suggestion_type);
                  
                  return (
                    <Alert
                      key={globalIndex}
                      className={`transition-all ${isCompleted ? 'opacity-60 bg-green-50' : ''}`}
                    >
                      <SuggestionIcon className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Badge variant={getUrgencyVariant(suggestion.urgency_level)}>
                            {suggestion.urgency_level}
                          </Badge>
                          {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkComplete(globalIndex)}
                        >
                          {isCompleted ? 'Undo' : 'Done'}
                        </Button>
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">{suggestion.message}</p>
                        <p className="text-sm text-gray-600">
                          💡 {suggestion.recommended_action}
                        </p>
                      </AlertDescription>
                    </Alert>
                  );
                })}
            </CardContent>
          </Card>
        )}

        {/* General Wellness Suggestions */}
        {typeStats.general_wellness > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-green-600" />
                General Wellness
              </CardTitle>
              <CardDescription>
                {typeStats.general_wellness} recommendation{typeStats.general_wellness > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions
                .filter((s: BreakSuggestion) => s.suggestion_type === 'general_wellness')
                .map((suggestion: BreakSuggestion, index: number) => {
                  const globalIndex = suggestions.indexOf(suggestion);
                  const isCompleted = completedSuggestions.has(globalIndex);
                  const SuggestionIcon = getSuggestionIcon(suggestion.suggestion_type);
                  
                  return (
                    <Alert
                      key={globalIndex}
                      className={`transition-all ${isCompleted ? 'opacity-60 bg-green-50' : ''}`}
                    >
                      <SuggestionIcon className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Badge variant={getUrgencyVariant(suggestion.urgency_level)}>
                            {suggestion.urgency_level}
                          </Badge>
                          {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkComplete(globalIndex)}
                        >
                          {isCompleted ? 'Undo' : 'Done'}
                        </Button>
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">{suggestion.message}</p>
                        <p className="text-sm text-gray-600">
                          💡 {suggestion.recommended_action}
                        </p>
                      </AlertDescription>
                    </Alert>
                  );
                })}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {suggestions.length === 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">All Good! 🎉</h3>
            <p className="text-gray-600 mb-4">
              No immediate break suggestions. You're maintaining good well-being habits!
            </p>
            <p className="text-sm text-gray-500">
              Keep logging your daily metrics to get personalized recommendations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Break Timer Tool */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Quick Break Timer
          </CardTitle>
          <CardDescription>
            Set a timer for your next break
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-12 bg-white/50">
              <div className="text-center">
                <div className="font-medium">5 min</div>
                <div className="text-xs text-gray-500">Quick break</div>
              </div>
            </Button>
            <Button variant="outline" className="h-12 bg-white/50">
              <div className="text-center">
                <div className="font-medium">15 min</div>
                <div className="text-xs text-gray-500">Coffee break</div>
              </div>
            </Button>
            <Button variant="outline" className="h-12 bg-white/50">
              <div className="text-center">
                <div className="font-medium">30 min</div>
                <div className="text-xs text-gray-500">Lunch break</div>
              </div>
            </Button>
            <Button variant="outline" className="h-12 bg-white/50">
              <div className="text-center">
                <div className="font-medium">Custom</div>
                <div className="text-xs text-gray-500">Set your own</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Educational Tips */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle>💡 Wellness Tips</CardTitle>
          <CardDescription>
            Evidence-based recommendations for better well-being
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-orange-600" />
                Work Balance
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Take a 10-15 minute break every 90-120 minutes</li>
                <li>• Use the Pomodoro Technique: 25 min work, 5 min break</li>
                <li>• Stand and stretch regularly to prevent stiffness</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Screen Health
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Follow the 20-20-20 rule for eye strain</li>
                <li>• Reduce screen brightness in dim environments</li>
                <li>• Use blue light filters in the evening</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
