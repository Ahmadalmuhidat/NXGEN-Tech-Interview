import React from 'react';

// Tooltip component
export default function Tooltip({ x, y, data, visible }) {
  if (!visible || !data) return null;
  
  const date = new Date(data.timestamp);
  const change = data.change || 0;
  const changeColor = change > 0 ? '#ef4444' : change < 0 ? '#10b981' : '#6b7280';
  const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  
  return (
    <div
      className="absolute z-50 bg-gray-900 text-white rounded-lg shadow-2xl p-3 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="text-xs space-y-1">
        <div className="font-semibold text-white">{date.toLocaleString()}</div>
        <div className="text-blue-300 font-bold">Value: {data.value.toFixed(2)}</div>
        {change !== 0 && (
          <div style={{ color: changeColor }} className="flex items-center gap-1">
            <span>{changeIcon}</span>
            <span>{Math.abs(change).toFixed(2)} ({change > 0 ? '+' : ''}{((change / (data.value - change)) * 100).toFixed(1)}%)</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  );
}
