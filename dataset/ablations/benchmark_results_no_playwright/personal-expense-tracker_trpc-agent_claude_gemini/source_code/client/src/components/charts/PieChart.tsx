interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
}

export function PieChart({ data }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500">
        No data to display
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  // Create SVG pie chart
  const radius = 90;
  const centerX = 120;
  const centerY = 120;
  const strokeWidth = 2;

  const createPath = (startAngle: number, endAngle: number) => {
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <svg width="240" height="240" className="drop-shadow-sm">
        {data.map((item, index) => {
          if (item.value === 0) return null;

          const percentage = (item.value / total) * 100;
          const startAngle = cumulativePercentage * 3.6; // Convert percentage to degrees
          const endAngle = (cumulativePercentage + percentage) * 3.6;
          
          const path = createPath(startAngle, endAngle);
          cumulativePercentage += percentage;

          return (
            <g key={index}>
              <path
                d={path}
                fill={item.color}
                stroke="white"
                strokeWidth={strokeWidth}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            </g>
          );
        })}
        
        {/* Center circle to make it look like a donut chart */}
        <circle
          cx={centerX}
          cy={centerY}
          r="35"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Total in the center */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          className="text-xs fill-gray-600 font-medium"
        >
          Total
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className="text-sm fill-gray-800 font-bold"
        >
          ${total.toFixed(2)}
        </text>
      </svg>
    </div>
  );
}
