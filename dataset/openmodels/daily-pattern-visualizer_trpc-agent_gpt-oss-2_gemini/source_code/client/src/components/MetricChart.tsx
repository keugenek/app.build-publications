// client/src/components/MetricChart.tsx
import { useMemo } from 'react';
import type { DailyMetrics } from '../../../server/src/schema';

interface MetricChartProps {
  metrics: DailyMetrics[];
}

// Simple SVG line chart for multiple metrics
export function MetricChart({ metrics }: MetricChartProps) {
  // Sort metrics by date ascending for chart
  const sorted = useMemo(() => {
    return [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [metrics]);

  // Extract data series
  const series = {
    sleep: sorted.map((m) => m.sleep_duration),
    work: sorted.map((m) => m.work_hours),
    social: sorted.map((m) => m.social_time),
    screen: sorted.map((m) => m.screen_time),
    emotion: sorted.map((m) => m.emotional_energy),
  } as const;

  const dates = sorted.map((m) => new Date(m.date));

  // Determine scaling
  const maxY = Math.max(
    ...Object.values(series).map((arr) => Math.max(...arr, 0)),
    10
  );
  const maxX = dates.length > 0 ? dates.length - 1 : 0;

  const width = 600;
  const height = 200;
  const padding = 30;

  const xScale = (index: number) => {
    return (
      (index / (maxX || 1)) * (width - padding * 2) + padding
    );
  };
  const yScale = (value: number) => {
    const scaled = (value / (maxY || 1)) * (height - padding * 2);
    return height - padding - scaled;
  };

  const renderLine = (data: number[], color: string) => {
    if (data.length === 0) return null;
    const points = data.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ');
    return (
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    );
  };

  return (
    <div className="border rounded-md p-2 bg-white overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
        {/* X axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#999"
          strokeWidth="1"
        />
        {/* Y axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#999"
          strokeWidth="1"
        />
        {/* Lines */}
        {renderLine(series.sleep, '#3b82f6')}
        {renderLine(series.work, '#ef4444')}
        {renderLine(series.social, '#10b981')}
        {renderLine(series.screen, '#f59e0b')}
        {renderLine(series.emotion, '#6366f1')}
      </svg>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <span className="text-[#3b82f6]">Sleep</span>
        <span className="text-[#ef4444]">Work</span>
        <span className="text-[#10b981]">Social</span>
        <span className="text-[#f59e0b]">Screen</span>
        <span className="text-[#6366f1]">Emotion</span>
      </div>
    </div>
  );
}
