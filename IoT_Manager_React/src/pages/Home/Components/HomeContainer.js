import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AxiosClient from '../../../config/axios';
import { toast } from 'react-toastify';
import { ContentLoading } from '../../../shared/LoadingSpinner';

export default function HomeContainer() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalDevices: 0,
    totalDataPoints: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [devicesResponse] = await Promise.all([
        AxiosClient.get('/devices'),
      ]);

      const devices = Array.isArray(devicesResponse.data) ? devicesResponse.data : devicesResponse.data?.data || [];
      let totalDataPoints = 0;

      if (devices.length > 0) {
        try {
          const now = new Date();
          const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const dataResponse = await AxiosClient.get(`/devices/${devices[0].id}/data`, {
            params: {
              start_time: startDate.toISOString(),
              end_time: now.toISOString(),
            },
          });
          const dataArray = Array.isArray(dataResponse.data)
            ? dataResponse.data
            : dataResponse.data?.data || [];
          totalDataPoints = dataArray.length;
        } catch (error) {
          totalDataPoints = 0;
        }
      }

      setStats({
        totalDevices: devices.length,
        totalDataPoints,
        recentActivity: devices.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({
        totalDevices: 0,
        totalDataPoints: 0,
        recentActivity: [],
      });
      if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.');
      } else {
        toast.error('Failed to load dashboard statistics.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-card p-8 border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome to IoT Management Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your IoT devices and data</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <ContentLoading text="Loading dashboard..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/devices"
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-card p-6 border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Total Devices</h3>
              <p className="text-3xl font-bold text-blue-700">{stats.totalDevices}</p>
              <p className="text-sm text-blue-600 mt-2">View all devices →</p>
            </Link>

            <Link
              to="/data"
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-card p-6 border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">Data Points (24h)</h3>
              <p className="text-3xl font-bold text-green-700">{stats.totalDataPoints}</p>
              <p className="text-sm text-green-600 mt-2">View data analytics →</p>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/devices"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Add New Device</h3>
                  <p className="text-sm text-gray-600">Register a new IoT device</p>
                </div>
              </Link>
              <Link
                to="/data"
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-600">Analyze time-series data</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Devices */}
          {stats.recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Devices</h2>
                <Link
                  to="/devices"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {stats.recentActivity.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{device.name}</h3>
                      <p className="text-sm text-gray-600">ID: {device.device_id || device.id}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(device.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
