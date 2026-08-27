const axios = require('axios');

// Simulate the request helper
const request = (method, url, data, options = {}) => {
  const { params, signal, headers, timeout } = options;
  const config = {
    method,
    url,
    headers: { ...(headers || {}) },
  };
  if (params) config.params = params;
  if (signal) config.signal = signal;
  if (timeout) config.timeout = timeout;
  if (data !== undefined) config.data = data;
  return axios(config);
};

(async () => {
  // Wrong usage: params in 3rd arg
  console.log('--- Wrong usage (3rd arg with params) ---');
  try {
    const r1 = await request('GET', 'http://localhost:8080/admin/cities/search', { params: { page: 0, size: 2 } });
    console.log('Status:', r1.status);
    console.log('URL called:', r1.request.res.responseUrl);
    console.log('Total:', r1.data.totalElements);
  } catch (e) {
    console.log('Error:', e.message);
    if (e.response) console.log('Status:', e.response.status, 'Body:', e.response.data);
  }

  // Right usage: null data + options
  console.log('--- Right usage (null data, options) ---');
  try {
    const r2 = await request('GET', 'http://localhost:8080/admin/cities/search', null, { params: { page: 0, size: 2 } });
    console.log('Status:', r2.status);
    console.log('URL called:', r2.request.res.responseUrl);
    console.log('Total:', r2.data.totalElements);
  } catch (e) {
    console.log('Error:', e.message);
    if (e.response) console.log('Status:', e.response.status, 'Body:', e.response.data);
  }
})();
