import { useState, useRef } from "react";
import Tooltip from "./Tooltip";

// Enhanced Line Chart with interactivity
export default function InteractiveLineChart({ data, maxValue, height = 200, onDataPointClick }) {
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