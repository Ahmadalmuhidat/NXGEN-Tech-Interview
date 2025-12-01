import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { subscribeToDeviceStats } from '../../../config/serverSentEvents';

export function DevicePieChart({ devices }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [deviceStats, setDeviceStats] = useState([]);
  const [totalDataPoints, setTotalDataPoints] = useState(0);

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  ];

  useEffect(() => {
    if (!devices || devices.length === 0) return;
  
    const eventSource = subscribeToDeviceStats({
      onData: (stats) => {
        const total = stats.reduce((sum, d) => sum + (d.dataCount || 0), 0);
        const updatedStats = stats.map(d => ({
          ...d,
          percentage: total > 0 ? ((d.dataCount || 0) / total) * 100 : 0,
        }));
        setDeviceStats(updatedStats);
        setTotalDataPoints(total);
      },
      onError: (err) => {
        toast.error('Realtime device stats connection failed.');
        console.error('SSE error:', err);
      },
    });
  
    return () => {
      eventSource?.close();
    };
  }, [devices]);

  if (!devices || devices.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Distribution</h3>
        <div className="text-center py-12 text-gray-500">
          <p>No devices available</p>
        </div>
      </div>
    );
  }

  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  let currentAngle = -90;

  const segments = deviceStats.map((device, index) => {
    const angle = (device.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    const largeArcFlag = angle > 180 ? 1 : 0;

    currentAngle = endAngle;

    return {
      device,
      pathData: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
      color: colors[index % colors.length],
      index,
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Distribution</h3>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {segments.map((segment) => {
              const isHovered = hoveredIndex === segment.index;
              return (
                <g key={segment.index}>
                  <path
                    d={segment.pathData}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="2"
                    opacity={isHovered ? 1 : hoveredIndex !== null ? 0.5 : 0.9}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(segment.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: '100px 100px',
                    }}
                  />
                  {isHovered && (
                    <text
                      x={centerX + (radius * 0.7) * Math.cos(((segment.startAngle + segment.endAngle) / 2 * Math.PI) / 180)}
                      y={centerY + (radius * 0.7) * Math.sin(((segment.startAngle + segment.endAngle) / 2 * Math.PI) / 180)}
                      fontSize="12"
                      fill="white"
                      textAnchor="middle"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      {segment.device.percentage.toFixed(1)}%
                    </text>
                  )}
                </g>
              );
            })}
            <circle cx={centerX} cy={centerY} r="40" fill="white" stroke="#e5e7eb" strokeWidth="2" />
            <text x={centerX} y={centerY - 5} fontSize="14" fill="#6b7280" textAnchor="middle" fontWeight="bold">
              {totalDataPoints}
            </text>
            <text x={centerX} y={centerY + 10} fontSize="10" fill="#9ca3af" textAnchor="middle">
              Total Points
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Devices</h4>
          {deviceStats.map((device, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={device.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  isHovered ? 'bg-gray-50 border-gray-300 shadow-sm' : 'bg-white border-gray-200'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{device.name || `Device ${device.id}`}</div>
                  <div className="text-xs text-gray-500">ID: {device.device_id || device.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{device.dataCount}</div>
                  <div className="text-xs text-gray-500">{device.percentage.toFixed(1)}%</div>
                </div>
              </div>
            );
          })}
          {totalDataPoints === 0 && (
            <div className="text-sm text-gray-500 text-center py-4">No data points available</div>
          )}
        </div>
      </div>
    </div>
  );
}
