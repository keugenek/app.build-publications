import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DailyMetrics } from '../../../server/src/schema';

interface MetricsSummaryProps {
  metric: DailyMetrics | undefined;
  onDelete: (id: number) => void;
}

export function MetricsSummary({ metric, onDelete }: MetricsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {metric ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Sleep:</span>
              <span className="font-medium">{metric.sleep_duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Work:</span>
              <span className="font-medium">{metric.work_hours} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Social:</span>
              <span className="font-medium">{metric.social_time} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Screen Time:</span>
              <span className="font-medium">{metric.screen_time} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Energy:</span>
              <span className="font-medium">{metric.emotional_energy}/10</span>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => onDelete(metric.id)}
            >
              Delete Entry
            </Button>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No data for selected date</p>
        )}
      </CardContent>
    </Card>
  );
}
