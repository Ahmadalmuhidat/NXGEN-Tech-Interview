import React, { useState, useRef } from 'react';

// Tooltip component
function Tooltip({ x, y, data, visible }) {
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

// Enhanced Line Chart with interactivity
export function InteractiveLineChart({ data, maxValue, height = 200, onDataPointClick }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false, data: null });
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) return null;

  const width = Math.max(data.length * 20, 800);
  
  // Calculate statistics
  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

  // Calculate change from previous point
  const dataWithChange = data.map((d, i) => ({
    ...d,
    change: i > 0 ? d.value - data[i - 1].value : 0,
  }));

  const handleMouseMove = (e) => {
    if (!svgRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * width;
    const index = Math.round((svgX / width) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    
    setHoveredIndex(clampedIndex);
    
    const pointX = (clampedIndex / (data.length - 1 || 1)) * width;
    const pointY = height - (data[clampedIndex].value / maxValue) * height;
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    
    setTooltip({
      x: pointX * scaleX,
      y: pointY * scaleY,
      visible: true,
      data: dataWithChange[clampedIndex],
    });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltip({ ...tooltip, visible: false });
  };

  const handleClick = (index) => {
    setSelectedIndex(index);
    if (onDataPointClick) {
      onDataPointClick(data[index], index);
    }
  };

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - (d.value / maxValue) * height;
    return { x, y, ...d };
  });

  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M 0,${height} L ${pointsString} L ${width},${height} Z`;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Line Chart</h3>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Mean: {mean.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Median: {median.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative cursor-crosshair"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="interactiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

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

          {/* Reference lines */}
          <line
            x1="0"
            y1={height - (mean / maxValue) * height}
            x2={width}
            y2={height - (mean / maxValue) * height}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.6"
          />
          <line
            x1="0"
            y1={height - (median / maxValue) * height}
            x2={width}
            y2={height - (median / maxValue) * height}
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="6 6"
            opacity="0.6"
          />

          {/* Area fill */}
          <path d={areaPath} fill="url(#interactiveGradient)" />

          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />

          {/* Interactive points */}
          {points.map((point, i) => {
            const isHovered = hoveredIndex === i;
            const isSelected = selectedIndex === i;
            const radius = isHovered || isSelected ? 8 : 4;
            const fill = isSelected ? '#ef4444' : isHovered ? '#f59e0b' : '#3b82f6';
            
            return (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius + 2}
                  fill="white"
                  opacity={isHovered || isSelected ? 1 : 0}
                  className="transition-all"
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={fill}
                  filter={isHovered || isSelected ? 'url(#glow)' : ''}
                  className="cursor-pointer transition-all"
                  onClick={() => handleClick(i)}
                />
                {isSelected && (
                  <text
                    x={point.x}
                    y={point.y - 15}
                    fontSize="10"
                    fill="#ef4444"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {point.value.toFixed(2)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover line */}
          {hoveredIndex !== null && (
            <line
              x1={(hoveredIndex / (data.length - 1 || 1)) * width}
              y1="0"
              x2={(hoveredIndex / (data.length - 1 || 1)) * width}
              y2={height}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          )}
        </svg>
        <Tooltip {...tooltip} />
      </div>
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>Hover to see details • Click to select</span>
        <span>Std Dev: ±{stdDev.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Enhanced Area Chart with interactivity
export function InteractiveAreaChart({ data, maxValue, height = 200 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false, data: null });
  const containerRef = useRef(null);

  if (!data || data.length === 0) return null;

  const width = Math.max(data.length * 20, 800);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - (d.value / maxValue) * height;
    return { x, y, ...d };
  });

  const areaPath = `M 0,${height} L ${points.map(p => `${p.x},${p.y}`).join(' ')} L ${width},${height} Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * width;
    const index = Math.round((svgX / width) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    
    setHoveredIndex(clampedIndex);
    
    const point = points[clampedIndex];
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    
    setTooltip({
      x: point.x * scaleX,
      y: point.y * scaleY,
      visible: true,
      data: { ...point, timestamp: data[clampedIndex].timestamp },
    });
  };

  // Calculate trend
  const trend = data.length > 1 
    ? ((data[data.length - 1].value - data[0].value) / data[0].value) * 100 
    : 0;
  const trendColor = trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#6b7280';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Area Chart with Trend</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Trend:</span>
          <span style={{ color: trendColor }} className="font-semibold">
            {trendIcon} {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative cursor-crosshair"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setTooltip({ ...tooltip, visible: false });
        }}
      >
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaInteractiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

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

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaInteractiveGradient)" />

          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
          />

          {/* Interactive points */}
          {points.map((point, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={isHovered ? 6 : 4}
                fill="#3b82f6"
                className="transition-all"
                opacity={isHovered ? 1 : 0.7}
              />
            );
          })}
        </svg>
        <Tooltip {...tooltip} />
      </div>
    </div>
  );
}

// Enhanced Bar Chart with interactivity
export function InteractiveBarChart({ data, maxValue, height = 200 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false, data: null });
  const containerRef = useRef(null);

  if (!data || data.length === 0) return null;

  const width = Math.max(data.length * 20, 800);
  const barWidth = width / data.length - 2;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * width;
    const index = Math.floor((svgX / width) * data.length);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    
    setHoveredIndex(clampedIndex);
    
    const barX = (clampedIndex / data.length) * width;
    const barHeight = (data[clampedIndex].value / maxValue) * height;
    const barY = height - barHeight;
    const scaleX = rect.width / width;
    const scaleY = rect.height / height;
    
    setTooltip({
      x: (barX + barWidth / 2) * scaleX,
      y: barY * scaleY,
      visible: true,
      data: data[clampedIndex],
    });
  };

  // Calculate average for comparison
  const avg = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Bar Chart</h3>
        <div className="text-xs text-gray-600">
          Avg: <span className="font-semibold">{avg.toFixed(2)}</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative cursor-pointer"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setTooltip({ ...tooltip, visible: false });
        }}
      >
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

          {/* Average line */}
          <line
            x1="0"
            y1={height - (avg / maxValue) * height}
            x2={width}
            y2={height - (avg / maxValue) * height}
            stroke="#6b7280"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * height;
            const x = (i / data.length) * width + 1;
            const y = height - barHeight;
            const isHovered = hoveredIndex === i;
            const isAboveAvg = d.value > avg;
            
            let color = '#3b82f6';
            const percentage = (d.value / maxValue) * 100;
            if (percentage > 75) color = '#ef4444';
            else if (percentage > 50) color = '#f59e0b';
            else if (percentage > 25) color = '#10b981';
            
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx="2"
                  className="transition-all"
                  opacity={isHovered ? 1 : 0.8}
                  style={{
                    transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
                {isHovered && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize="10"
                    fill={color}
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {d.value.toFixed(2)}
                  </text>
                )}
                {isAboveAvg && !isHovered && (
                  <circle
                    cx={x + barWidth / 2}
                    cy={y - 3}
                    r="3"
                    fill="#10b981"
                    opacity="0.7"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <Tooltip {...tooltip} />
      </div>
    </div>
  );
}

// Enhanced Scatter Plot with interactivity
export function InteractiveScatterPlot({ data, maxValue, height = 200 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false, data: null });
  const containerRef = useRef(null);

  if (!data || data.length === 0) return null;

  const width = Math.max(data.length * 20, 800);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const svgX = (x / rect.width) * width;
    const svgY = (y / rect.height) * height;
    
    // Find nearest point
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    data.forEach((d, i) => {
      const pointX = (i / (data.length - 1 || 1)) * width;
      const pointY = height - (d.value / maxValue) * height;
      const distance = Math.sqrt(Math.pow(svgX - pointX, 2) + Math.pow(svgY - pointY, 2));
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    });
    
    if (minDistance < 30) {
      setHoveredIndex(nearestIndex);
      const pointX = (nearestIndex / (data.length - 1 || 1)) * width;
      const pointY = height - (data[nearestIndex].value / maxValue) * height;
      const scaleX = rect.width / width;
      const scaleY = rect.height / height;
      
      setTooltip({
        x: pointX * scaleX,
        y: pointY * scaleY,
        visible: true,
        data: data[nearestIndex],
      });
    } else {
      setHoveredIndex(null);
      setTooltip({ ...tooltip, visible: false });
    }
  };

  // Calculate outliers
  const values = data.map(d => d.value);
  const q1 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.25)];
  const q3 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Scatter Plot Analysis</h3>
        <div className="text-xs text-gray-600">
          Outliers: {data.filter(d => d.value < lowerBound || d.value > upperBound).length}
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative cursor-crosshair"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setTooltip({ ...tooltip, visible: false });
        }}
      >
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

          {/* Outlier bounds */}
          <line
            x1="0"
            y1={height - (upperBound / maxValue) * height}
            x2={width}
            y2={height - (upperBound / maxValue) * height}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.3"
          />
          <line
            x1="0"
            y1={height - (lowerBound / maxValue) * height}
            x2={width}
            y2={height - (lowerBound / maxValue) * height}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.3"
          />

          {/* Scatter points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1 || 1)) * width;
            const y = height - (d.value / maxValue) * height;
            const radius = 4 + (d.value / maxValue) * 4;
            const isHovered = hoveredIndex === i;
            const isOutlier = d.value < lowerBound || d.value > upperBound;
            
            let color = '#3b82f6';
            const percentage = (d.value / maxValue) * 100;
            if (percentage > 75) color = '#ef4444';
            else if (percentage > 50) color = '#f59e0b';
            else if (percentage > 25) color = '#10b981';
            
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isHovered ? radius + 4 : radius}
                fill={isOutlier ? '#ef4444' : color}
                opacity={isHovered ? 1 : 0.7}
                stroke={isOutlier ? '#ef4444' : 'none'}
                strokeWidth={isOutlier ? 2 : 0}
                className="transition-all"
              />
            );
          })}
        </svg>
        <Tooltip {...tooltip} />
      </div>
    </div>
  );
}

// Enhanced Histogram with interactivity
export function InteractiveHistogram({ data, maxValue, bins = 10, height = 200 }) {
  const [hoveredBin, setHoveredBin] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false, data: null });
  const containerRef = useRef(null);

  if (!data || data.length === 0) return null;

  const binSize = maxValue / bins;
  const binsData = Array(bins).fill(0).map((_, i) => ({
    count: 0,
    min: i * binSize,
    max: (i + 1) * binSize,
    values: [],
  }));

  data.forEach(d => {
    const binIndex = Math.min(Math.floor(d.value / binSize), bins - 1);
    binsData[binIndex].count++;
    binsData[binIndex].values.push(d.value);
  });

  const maxCount = Math.max(...binsData.map(b => b.count));
  const width = 800;
  const barWidth = width / bins;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const svgX = (x / rect.width) * width;
    const binIndex = Math.floor((svgX / width) * bins);
    const clampedIndex = Math.max(0, Math.min(binIndex, bins - 1));
    
    if (binsData[clampedIndex].count > 0) {
      setHoveredBin(clampedIndex);
      const barX = (clampedIndex / bins) * width;
      const barHeight = (binsData[clampedIndex].count / maxCount) * height;
      const barY = height - barHeight;
      const scaleX = rect.width / width;
      const scaleY = rect.height / height;
      
      const bin = binsData[clampedIndex];
      const avg = bin.values.reduce((a, b) => a + b, 0) / bin.values.length;
      
      setTooltip({
        x: (barX + barWidth / 2) * scaleX,
        y: barY * scaleY,
        visible: true,
        data: {
          count: bin.count,
          range: `${bin.min.toFixed(1)} - ${bin.max.toFixed(1)}`,
          average: avg,
        },
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Value Distribution</h3>
        <div className="text-xs text-gray-600">
          Total: {data.length} points across {bins} bins
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative cursor-pointer"
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredBin(null);
          setTooltip({ ...tooltip, visible: false });
        }}
      >
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
          {binsData.map((bin, i) => {
            const barHeight = (bin.count / maxCount) * height;
            const x = (i / bins) * width;
            const y = height - barHeight;
            const isHovered = hoveredBin === i;
            
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth - 2}
                  height={barHeight}
                  fill="#3b82f6"
                  rx="2"
                  className="transition-all"
                  opacity={isHovered ? 1 : 0.8}
                  style={{
                    transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                />
                {bin.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {bin.count}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {tooltip.visible && tooltip.data && (
          <div
            className="absolute z-50 bg-gray-900 text-white rounded-lg shadow-2xl p-3 pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 10}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="text-xs space-y-1">
              <div className="font-semibold text-white">Range: {tooltip.data.range}</div>
              <div className="text-blue-300">Count: {tooltip.data.count}</div>
              <div className="text-green-300">Avg: {tooltip.data.average.toFixed(2)}</div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-gray-600 text-center">
        <p>Hover over bars to see distribution details</p>
      </div>
    </div>
  );
}


