import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENHANDS_BASE_URL = 'https://app.all-hands.dev';
const OPENHANDS_API_KEY = process.env.OPENHANDS_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { path, method = 'GET', body } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (OPENHANDS_API_KEY) {
      headers['X-Session-API-Key'] = OPENHANDS_API_KEY;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${OPENHANDS_BASE_URL}${path}`, fetchOptions);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('OpenHands proxy error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
