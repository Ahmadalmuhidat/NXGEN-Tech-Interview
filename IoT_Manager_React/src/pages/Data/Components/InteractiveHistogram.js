import { useState, useRef } from "react";

// Enhanced Histogram with interactivity
export default function InteractiveHistogram({ data, maxValue, bins = 10, height = 200 }) {
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
