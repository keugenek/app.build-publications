import { useEffect, useRef } from 'react';
import type { Log } from '../../../server/src/schema';

/**
 * Simple line chart rendered on a HTML canvas.
 * It plots multiple wellbeing metrics over time.
 * This implementation avoids external chart libraries to keep the project lightweight.
 */
export function LogChart({ logs }: { logs: Log[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Define colors for each metric
  const colors: { [key: string]: string } = {
    sleep_duration: '#3b82f6', // blue
    work_hours: '#ef4444', // red
    social_time: '#10b981', // green
    screen_time: '#f59e0b', // amber
    emotional_energy: '#8b5cf6', // purple
  };

  // Utility to map logs to points
  const getPoints = (key: keyof Omit<Log, 'id' | 'date' | 'created_at'>) => {
    return logs.map((log) => ({ x: new Date(log.date).getTime(), y: Number(log[key]) }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (logs.length === 0) return;

    // Determine bounds
    const allDates = logs.map((l) => new Date(l.date).getTime());
    const minX = Math.min(...allDates);
    const maxX = Math.max(...allDates);

    // For Y, find max across all metrics to scale uniformly
    const metricKeys: (keyof Omit<Log, 'id' | 'date' | 'created_at'>)[] = [
      'sleep_duration',
      'work_hours',
      'social_time',
      'screen_time',
      'emotional_energy',
    ];
    const maxY = Math.max(
      ...logs.flatMap((log) => metricKeys.map((k) => Number(log[k])))
    );
    const minY = 0; // all metrics are non‑negative

    const padding = 40; // canvas padding for axes
    const width = canvas.width - padding * 2;
    const height = canvas.height - padding * 2;

    const xScale = (x: number) => padding + ((x - minX) / (maxX - minX)) * width;
    const yScale = (y: number) => padding + height - ((y - minY) / (maxY - minY)) * height;

    // Draw axes
    ctx.strokeStyle = '#6b7280'; // gray-500
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    // X axis
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw each metric line
    metricKeys.forEach((key) => {
      const points = getPoints(key);
      if (points.length < 2) return;
      ctx.strokeStyle = colors[key];
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((pt, idx) => {
        const x = xScale(pt.x);
        const y = yScale(pt.y);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [logs]);

  // Set a fixed canvas size; it will be responsive via CSS
  return (
    <div className="my-6">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full max-w-2xl mx-auto border border-gray-200 rounded"
      />
    </div>
  );
}
