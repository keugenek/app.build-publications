interface BarChartData {
  month: string;
  income: number;
  expenses: number;
}

interface BarChartProps {
  data: BarChartData[];
}

export function BarChart({ data }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }

  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.flatMap(item => [item.income, item.expenses]),
    0
  );

  // Chart dimensions
  const chartWidth = 600;
  const chartHeight = 200;
  const barWidth = (chartWidth - 100) / (data.length * 2.5); // Space for bars and gaps
  const maxBarHeight = chartHeight - 60; // Leave space for labels

  const getBarHeight = (value: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * maxBarHeight;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 60} className="min-w-full">
        {/* Background grid lines */}
        <defs>
          <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height={chartHeight} fill="url(#grid)" />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = chartHeight - (ratio * maxBarHeight);
          const value = maxValue * ratio;
          return (
            <g key={index}>
              <line
                x1="50"
                y1={y}
                x2={chartWidth - 20}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray={ratio === 0 ? "0" : "2,2"}
              />
              <text
                x="45"
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                ${value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const baseX = 70 + index * (barWidth * 2.5);
          const incomeHeight = getBarHeight(item.income);
          const expenseHeight = getBarHeight(item.expenses);

          return (
            <g key={index}>
              {/* Income bar */}
              <rect
                x={baseX}
                y={chartHeight - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                fill="#10b981"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              
              {/* Expense bar */}
              <rect
                x={baseX + barWidth + 5}
                y={chartHeight - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                fill="#ef4444"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />

              {/* Month label */}
              <text
                x={baseX + barWidth}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-medium"
              >
                {item.month}
              </text>

              {/* Values on top of bars */}
              {incomeHeight > 20 && (
                <text
                  x={baseX + barWidth / 2}
                  y={chartHeight - incomeHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  ${item.income.toFixed(0)}
                </text>
              )}
              
              {expenseHeight > 20 && (
                <text
                  x={baseX + barWidth + 5 + barWidth / 2}
                  y={chartHeight - expenseHeight + 15}
                  textAnchor="middle"
                  className="text-xs fill-white font-medium"
                >
                  ${item.expenses.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${chartWidth - 150}, 20)`}>
          <rect x="0" y="0" width="12" height="12" fill="#10b981" />
          <text x="20" y="10" className="text-xs fill-gray-700">Income</text>
          
          <rect x="0" y="20" width="12" height="12" fill="#ef4444" />
          <text x="20" y="30" className="text-xs fill-gray-700">Expenses</text>
        </g>
      </svg>
    </div>
  );
}
