import React from 'react';

interface ChartProps {
  data: {
    date: string;
    sleep: number;
    work: number;
    social: number;
    screen: number;
    energy: number;
  }[];
}

export function Chart({ data }: ChartProps) {
  // Find maximum values for scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.sleep, d.work, d.social, d.screen, d.energy)),
    1 // Ensure we don't divide by zero
  );

  return (
    <div className="h-64">
      <div className="flex items-end h-5/6 gap-2 border-b border-l border-gray-200 pb-4 pl-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="flex items-end justify-center h-full w-full gap-1">
              <div 
                className="w-1/5 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                style={{ height: `${(item.sleep / maxValue) * 100}%` }}
                title={`Sleep: ${item.sleep} hours`}
              />
              <div 
                className="w-1/5 bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                style={{ height: `${(item.work / maxValue) * 100}%` }}
                title={`Work: ${item.work} hours`}
              />
              <div 
                className="w-1/5 bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                style={{ height: `${(item.social / maxValue) * 100}%` }}
                title={`Social: ${item.social} hours`}
              />
              <div 
                className="w-1/5 bg-yellow-500 rounded-t hover:bg-yellow-600 transition-colors"
                style={{ height: `${(item.screen / maxValue) * 100}%` }}
                title={`Screen: ${item.screen} hours`}
              />
              <div 
                className="w-1/5 bg-red-500 rounded-t hover:bg-red-600 transition-colors"
                style={{ height: `${(item.energy / 10) * 100}%` }}
                title={`Energy: ${item.energy}/10`}
              />
            </div>
            <div className="text-xs mt-2 text-gray-600 text-center">
              {item.date}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span>Sleep</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span>Work</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
          <span>Social</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span>Screen</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span>Energy</span>
        </div>
      </div>
    </div>
  );
}
