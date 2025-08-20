interface PieChartData {
  id: number;
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
}

export function PieChart({ data }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🥧</div>
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="w-full h-64 flex items-center gap-8">
      {/* SVG Pie Chart */}
      <div className="flex-shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth="2"
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage * 2.51} ${251 - percentage * 2.51}`;
            const strokeDashoffset = -cumulativePercentage * 2.51;
            
            cumulativePercentage += percentage;

            return (
              <circle
                key={item.id}
                cx="100"
                cy="100"
                r="80"
                fill="transparent"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:stroke-width-16"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 max-h-64 overflow-y-auto">
        {data.map((item) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  ${item.value.toFixed(2)} ({percentage}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
