import React from 'react';

// Gauge/Meter Chart - Shows current value with trend
export function GaugeChart({ value, min, max, label, previousValue, data = [] }) {
  // Handle edge cases
  const range = max - min;
  const percentage = range === 0 ? 50 : Math.min(Math.max(((value - min) / range) * 100, 0), 100);
  // Convert percentage to angle: 0% = -90°, 50% = 0°, 100% = 90°
  const angle = (percentage / 100) * 180 - 90;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  
  // Calculate needle position (needle points upward at 0%, so we need to adjust)
  const needleLength = 60;
  const angleRad = (angle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(angleRad);
  const needleY = centerY + needleLength * Math.sin(angleRad);
  
  // Color based on percentage
  let color = '#3b82f6'; // blue
  if (percentage > 75) color = '#ef4444'; // red
  else if (percentage > 50) color = '#f59e0b'; // orange
  else if (percentage > 25) color = '#10b981'; // green
  
  // Calculate trend
  let trend = 0;
  let trendColor = '#6b7280';
  let trendIcon = '→';
  if (previousValue !== undefined && previousValue !== null) {
    trend = ((value - previousValue) / previousValue) * 100;
    trendColor = trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#6b7280';
    trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  } else if (data.length > 1) {
    const avg = data.slice(0, Math.floor(data.length / 2)).reduce((sum, d) => sum + d.value, 0) / Math.floor(data.length / 2);
    trend = ((value - avg) / avg) * 100;
    trendColor = trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#6b7280';
    trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>
      <div className="flex items-center justify-center">
        <svg width="200" height="140" viewBox="0 0 200 140">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          
          {/* Gauge arc background */}
          <path
            d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Gauge arc filled */}
          <path
            d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 502.65} 502.65`}
          />
          
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={centerX} cy={centerY} r="6" fill={color} />
          
          {/* Labels */}
          <text x="20" y="125" fontSize="12" fill="#6b7280" textAnchor="start">{min.toFixed(1)}</text>
          <text x="100" y="125" fontSize="12" fill="#6b7280" textAnchor="middle">{((min + max) / 2).toFixed(1)}</text>
          <text x="180" y="125" fontSize="12" fill="#6b7280" textAnchor="end">{max.toFixed(1)}</text>
        </svg>
      </div>
      <div className="text-center mt-4">
        <p className="text-3xl font-bold" style={{ color }}>{value.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">Current Value</p>
        {trend !== 0 && (
          <div className="mt-2 flex items-center justify-center gap-1 text-sm" style={{ color: trendColor }}>
            <span className="font-semibold">{trendIcon}</span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Histogram - Value distribution
export function Histogram({ data, maxValue, bins = 10, height = 200 }) {
  if (!data || data.length === 0) return null;
  
  // Create bins
  const binSize = maxValue / bins;
  const binsData = Array(bins).fill(0);
  
  data.forEach(d => {
    const binIndex = Math.min(Math.floor(d.value / binSize), bins - 1);
    binsData[binIndex]++;
  });
  
  const maxCount = Math.max(...binsData);
  const width = 800;
  const barWidth = width / bins;
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Value Distribution</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={(percent / 100) * height}
              x2={width}
              y2={(percent / 100) * height}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}
          
          {/* Histogram bars */}
          {binsData.map((count, i) => {
            const barHeight = (count / maxCount) * height;
            const x = (i / bins) * width;
            const y = height - barHeight;
            
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth - 2}
                  height={barHeight}
                  fill="#3b82f6"
                  rx="2"
                  className="hover:opacity-80 transition-opacity"
                />
                {count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-4 text-xs text-gray-600 text-center">
        <p>Distribution across {bins} value ranges</p>
      </div>
    </div>
  );
}
