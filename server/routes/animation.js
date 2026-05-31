'use strict';

const express = require('express');
const https = require('https');
const router = express.Router();

function replicate(method, path, body) {
  return new Promise((resolve, reject) => {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return reject(new Error('REPLICATE_API_TOKEN is not set on this server.'));

    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.replicate.com',
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Invalid JSON from Replicate')); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// POST /api/animation/start  { prompt }  → { id }
router.post('/start', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const prediction = await replicate('POST', '/v1/models/minimax/video-01-live/predictions', {
      input: { prompt, prompt_optimizer: true },
    });
    res.json({ id: prediction.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/animation/status/:id  → { status, videoUrl }
router.get('/status/:id', async (req, res) => {
  try {
    const prediction = await replicate('GET', `/v1/predictions/${req.params.id}`);
    res.json({
      status: prediction.status,             // starting | processing | succeeded | failed
      videoUrl: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output,
      error: prediction.error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
