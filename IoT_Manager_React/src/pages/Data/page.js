import React, { useState, useEffect, useRef } from 'react';
import AxiosClient from '../../config/axios';
import { toast } from 'react-toastify';
import { ContentLoading } from '../../shared/LoadingSpinner';
import { GaugeChart } from './Components/Charts';
import InteractiveLineChart from './Components/InteractiveLineChart';
import InteractiveHistogram from './Components/InteractiveHistogram';
import { DevicePieChart } from './Components/DevicePieChart';
import { subscribeToDeviceData } from '../../config/serverSentEvents';

export default function Data() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [appliedCustomRange, setAppliedCustomRange] = useState({ start: '', end: '' });
  const eventSourceRef = useRef(null);
  const connectionAlertedRef = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const response = await AxiosClient.get('/devices');
      const devicesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setDevices(devicesData);
      if (devicesData.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setDevices([]);

      if (error.response?.status === 404) {
        toast.error('Backend route not found. Please ensure the backend server is running on port 3000.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in or check your token.');
      } else if (!error.response) {
        toast.error('Cannot connect to backend. Please ensure the server is running');
      } else {
        toast.error('Failed to fetch devices. Please check your backend connection.');
      }
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (!selectedDevice) {
      setData([]);
      setLoading(false);
      return;
    }

    if (showCustomRange && (!appliedCustomRange.start)) {
      setData([]);
      setLoading(false);
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setData([]);
    const now = new Date();
    const startDate = new Date();

    if (showCustomRange) {
      const start = new Date(appliedCustomRange.start);

      if (Number.isNaN(start.getTime())) {
        toast.error('Invalid custom date range');
        setData([]);
        setLoading(false);
        return;
      }

      startDate.setTime(start.getTime());
    } else {
      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setHours(now.getHours() - 24);
      }
    }

    setLoading(true);
    connectionAlertedRef.current = false;
    const currentDeviceId = selectedDevice;

    const source = subscribeToDeviceData({
      deviceId: currentDeviceId,
      startTime: startDate.toISOString(),
      onData: (payload) => {
        setData((prev) => {
          const combined = [...prev, ...payload];
          const unique = Array.from(
            new Map(combined.map(item => [item.timestamp, item])).values()
          );
          unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          return unique;
        });

        setLoading(false);
        connectionAlertedRef.current = false;
      },
      onError: () => {
        if (!connectionAlertedRef.current) {
          toast.error('Realtime connection interrupted. Retrying...');
          connectionAlertedRef.current = true;
        }
        setLoading(false);
      },
    });

    eventSourceRef.current = source;

    return () => {
      source.close();
      if (eventSourceRef.current === source) {
        eventSourceRef.current = null;
      }
    };
  }, [selectedDevice, timeRange, showCustomRange, appliedCustomRange.start]);

  const getMaxValue = () => {
    if (data.length === 0) return 100;
    return Math.max(...data.map((d) => d.value), 0) * 1.1;
  };

  const handleCustomRangeToggle = () => {
    const newValue = !showCustomRange;
    setShowCustomRange(newValue);
    if (newValue) {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setHours(now.getHours() - 24);
      setCustomDateRange({
        start: yesterday.toISOString().slice(0, 16),
        end: now.toISOString().slice(0, 16),
      });
    } else {
      setCustomDateRange({ start: '', end: '' });
      setAppliedCustomRange({ start: '', end: '' });
    }
  };

  const handleCustomRangeApply = () => {
    if (!customDateRange.start || !customDateRange.end) {
      toast.error('Please select both start and end dates');
      return;
    }
    const start = new Date(customDateRange.start);
    const end = new Date(customDateRange.end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error('Invalid date selection');
      return;
    }

    if (end < start) {
      toast.error('End date must be after start date');
      return;
    }

    setAppliedCustomRange({
      start: customDateRange.start,
      end: customDateRange.end,
    });
  };

  const maxValue = getMaxValue();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 lg:py-10">
        <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Time-Series Data</h1>
            <p className="text-gray-600">Visualize and analyze IoT device data over time</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 mb-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Device
                  </label>
                  {loadingDevices ? (
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                  ) : (
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select a device</option>
                      {devices.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.name} (ID: {device.device_id || device.id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Range
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => {
                      setTimeRange(e.target.value);
                      setShowCustomRange(false);
                    }}
                    disabled={showCustomRange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="customRange"
                      checked={showCustomRange}
                      onChange={handleCustomRangeToggle}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="customRange" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Use Custom Date Range
                    </label>
                  </div>
                </div>

                {showCustomRange && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={customDateRange.start}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={customDateRange.end}
                        onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleCustomRangeApply}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        Apply Range
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Visualization */}
          {!selectedDevice ? (
            <div className="bg-white rounded-2xl shadow-card p-12 border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Device Selected</h3>
              <p className="text-gray-600">Please select a device to view its data</p>
            </div>
          ) : loading ? (
            <ContentLoading text="Loading data..." />
          ) : data.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-12 border border-gray-100 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">No data found for the selected time range</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Value Gauge and Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <GaugeChart
                    value={data[data.length - 1]?.value || 0}
                    min={Math.min(...data.map((d) => d.value))}
                    max={maxValue}
                    label="Current Value"
                    previousValue={data.length > 1 ? data[data.length - 2]?.value : undefined}
                    data={data}
                  />
                </div>
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">Average</span>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Maximum</span>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {Math.max(...data.map((d) => d.value)).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-700">Minimum</span>
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {Math.min(...data.map((d) => d.value)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Interactive Line Chart */}
                <InteractiveLineChart
                  data={data}
                  maxValue={maxValue}
                  height={200}
                  onDataPointClick={(point, index) => {
                    toast.info(`Selected: ${point.value.toFixed(2)} at ${new Date(point.timestamp).toLocaleString()}`);
                  }}
                />

                {/* Device Pie Chart */}
                <DevicePieChart devices={devices} />
              </div>

              {/* Interactive Histogram */}
              <InteractiveHistogram data={data} maxValue={maxValue} bins={10} height={200} />

              {/* Data Insights Panel */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-card p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    const values = data.map(d => d.value);
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    const sorted = [...values].sort((a, b) => a - b);
                    const median = sorted[Math.floor(sorted.length / 2)];
                    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);
                    const variance = stdDev * stdDev;
                    const range = Math.max(...values) - Math.min(...values);
                    const cv = (stdDev / avg) * 100; // Coefficient of variation
                    const firstHalf = values.slice(0, Math.floor(values.length / 2));
                    const secondHalf = values.slice(Math.floor(values.length / 2));
                    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
                    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
                    const trend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

                    return (
                      <>
                        <div className="bg-white rounded-xl p-4 border border-blue-100">
                          <div className="text-xs text-gray-600 mb-1">Standard Deviation</div>
                          <div className="text-2xl font-bold text-blue-700">{stdDev.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">±{cv.toFixed(1)}% variation</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-green-100">
                          <div className="text-xs text-gray-600 mb-1">Data Range</div>
                          <div className="text-2xl font-bold text-green-700">{range.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">Min: {Math.min(...values).toFixed(2)}</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-orange-100">
                          <div className="text-xs text-gray-600 mb-1">Overall Trend</div>
                          <div className="text-2xl font-bold" style={{ color: trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#6b7280' }}>
                            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Comparing halves</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-purple-100">
                          <div className="text-xs text-gray-600 mb-1">Variance</div>
                          <div className="text-2xl font-bold text-purple-700">{variance.toFixed(2)}</div>
                          <div className="text-xs text-gray-500 mt-1">Data spread</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Data Points</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.slice(-20).reverse().map((item) => (
                        <tr key={item.id || item.timestamp} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.value.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.length > 20 && (
                  <div className="px-6 py-4 border-t border-gray-100 text-center text-sm text-gray-600">
                    Showing last 20 of {data.length} data points
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
