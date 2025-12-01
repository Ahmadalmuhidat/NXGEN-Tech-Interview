const getBaseUrl = () => process.env.REACT_APP_BASE_URL.replace(/\/$/, ''); // Remove trailing slash

const buildUrl = (path, queryParams = {}) => {
  const params = new URLSearchParams(queryParams); // Create query string
  return `${getBaseUrl()}${path}?${params.toString()}`; // Construct full URL
};

const createEventSource = (url, onData, onError) => {
  const eventSource = new EventSource(url);
  // Handle incoming messages
  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onData?.(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to parse SSE payload', err);
    }
  };
  // Handle errors
  eventSource.onerror = (event) => {
    console.error('SSE connection error', event);
    onError?.(event);
  };
  return eventSource;
};

exports.subscribeToDeviceStats = ({ onData, onError }) => {
  createEventSource(buildUrl('/devices/stats'), onData, onError); // Subscribe to device stats SSE
}

exports.subscribeToDeviceData = ({ deviceId, startTime, onData, onError }) => {
  if (!deviceId || !startTime) throw new Error('Device ID and start time required.');
  return createEventSource(buildUrl(`/devices/${deviceId}/data`, { start_time: startTime }), onData, onError); // Subscribe to device data SSE
};