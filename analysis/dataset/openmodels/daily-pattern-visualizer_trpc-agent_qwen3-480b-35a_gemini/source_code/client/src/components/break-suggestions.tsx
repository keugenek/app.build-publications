import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreakSuggestion } from '../../../server/src/handlers/get_break_suggestions';

interface BreakSuggestionsProps {
  suggestions: BreakSuggestion[];
  hasMetrics: boolean;
}

export function BreakSuggestions({ suggestions, hasMetrics }: BreakSuggestionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Break Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {suggestions.length > 0 ? (
          <ul className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>
                  <strong className="capitalize">{suggestion.type}:</strong> {suggestion.message} - {suggestion.recommendation}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-4">
            {hasMetrics
              ? "No specific suggestions at the moment. Keep logging your metrics!"
              : "Log some metrics to get personalized break suggestions"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
