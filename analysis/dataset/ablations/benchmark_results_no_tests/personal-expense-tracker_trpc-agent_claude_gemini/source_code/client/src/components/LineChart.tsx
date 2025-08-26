interface LineChartData {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

interface LineChartProps {
  data: LineChartData[];
}

export function LineChart({ data }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p>No trend data available</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scales
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min and max values for scaling
  const allValues = data.flatMap(d => [d.income, d.expenses, Math.abs(d.net)]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...data.map(d => d.net));
  const valueRange = maxValue - minValue;

  // Create scale functions
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth + padding;
  const yScale = (value: number) => height - padding - ((value - minValue) / valueRange) * chartHeight;

  // Generate path data for lines
  const createPath = (values: number[]) => {
    return values.map((value, index) => {
      const x = xScale(index);
      const y = yScale(value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const incomePath = createPath(data.map(d => d.income));
  const expensesPath = createPath(data.map(d => d.expenses));
  const netPath = createPath(data.map(d => d.net));

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <svg width={width} height={height} className="border border-gray-100 rounded-lg bg-white">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Zero line */}
          {minValue < 0 && (
            <line
              x1={padding}
              y1={yScale(0)}
              x2={width - padding}
              y2={yScale(0)}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          )}

          {/* Income line */}
          <path
            d={incomePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Expenses line */}
          <path
            d={expensesPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Net line */}
          <path
            d={netPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, index) => {
            const x = xScale(index);
            return (
              <g key={index}>
                <circle cx={x} cy={yScale(d.income)} r="3" fill="#10b981" />
                <circle cx={x} cy={yScale(d.expenses)} r="3" fill="#ef4444" />
                <circle cx={x} cy={yScale(d.net)} r="3" fill="#3b82f6" />
              </g>
            );
          })}

          {/* Y-axis labels */}
          <text x="10" y={yScale(maxValue)} fontSize="12" fill="#6b7280" dominantBaseline="middle">
            ${maxValue.toFixed(0)}
          </text>
          {minValue < 0 && (
            <text x="10" y={yScale(minValue)} fontSize="12" fill="#6b7280" dominantBaseline="middle">
              ${minValue.toFixed(0)}
            </text>
          )}
          <text x="10" y={yScale(0)} fontSize="12" fill="#6b7280" dominantBaseline="middle">
            $0
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Net</span>
        </div>
      </div>

      {/* Date range info */}
      {data.length > 0 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          {new Date(data[0].date).toLocaleDateString()} - {new Date(data[data.length - 1].date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
