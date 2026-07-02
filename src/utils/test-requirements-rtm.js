const API_BASE_URL = 'https://kiwamitestcloud.com/dashboardapis/api';

async function fetchRTM() {
  const email = 'jaczeboso@gmail.com';
  const password = 'Areka@!!74';

  console.log(`1. Attempting login for ${email}...`);
  let token = null;
  try {
    const loginRes = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    token = loginData?.token || loginData?.access_token || loginData?.data?.token;
  } catch (err) {
    console.error('Login failed:', err.message);
  }

  if (!token) {
    console.log('Could not get token for user. Exiting.');
    return;
  }

  const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/requirements`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': formattedToken
      }
    });
    console.log('Requirements Response Status:', res.status);
    const body = await res.json();
    const details = body.details || body;
    console.log('Total requirements retrieved:', details.length);
    if (details.length > 0) {
      console.log('First requirement raw keys:', Object.keys(details[0]));
      console.log('First requirement sample data:', JSON.stringify(details[0], null, 2));
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

fetchRTM();
