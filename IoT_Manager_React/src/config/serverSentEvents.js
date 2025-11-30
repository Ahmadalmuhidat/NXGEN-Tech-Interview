const buildDeviceStatStreamUrl = () => {
  const sanitizedBase = process.env.REACT_APP_BASE_URL.replace(/\/$/, '');
  return `${sanitizedBase}/devices/stats`;
};

const subscribeToDeviceStats = ({ onData, onError }) => {
  const eventSource = new EventSource(buildDeviceStatStreamUrl());

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onData?.(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to parse SSE payload', err);
    }
  };

  eventSource.onerror = (event) => {
    console.error('SSE connection error', event);
    onError?.(event);
  };

  return eventSource;
};

const buildDeviceDataStreamUrl = (deviceId, startTime) => {
  const sanitizedBase = process.env.REACT_APP_BASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams({ start_time: startTime });
  return `${sanitizedBase}/devices/${deviceId}/data?${params.toString()}`;
};

const subscribeToDeviceData = ({ deviceId, startTime, onData, onError }) => {
  if (!deviceId || !startTime) {
    throw new Error('Device ID and start time are required for SSE subscription.');
  }

  const eventSource = new EventSource(buildDeviceDataStreamUrl(deviceId, startTime));

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onData?.(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to parse SSE payload', err);
    }
  };

  eventSource.onerror = (event) => {
    console.error('SSE connection error', event);
    onError?.(event);
  };

  return eventSource;
};

export { 
  buildDeviceDataStreamUrl,
  subscribeToDeviceData,
  buildDeviceStatStreamUrl,
  subscribeToDeviceStats
};