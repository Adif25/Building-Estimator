'use strict';

const express = require('express');
const https   = require('https');
const router  = express.Router();

const PROJECT_PROMPTS = {
  deck:        'a beautiful new pressure-treated wood deck with railings, photorealistic, natural wood grain, sunny day',
  fence:       'a brand new wooden privacy fence, photorealistic, natural wood, clean straight posts and boards',
  shedFraming: 'a new wooden storage shed, photorealistic, clean wood siding, shingled roof, sunny backyard',
};

function replicatePost(path, body) {
  return new Promise((resolve, reject) => {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return reject(new Error('REPLICATE_API_TOKEN not set'));
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.replicate.com',
      path,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString());
          if (res.statusCode >= 400) {
            return reject(new Error(`Replicate error ${res.statusCode}: ${parsed.detail || JSON.stringify(parsed)}`));
          }
          resolve(parsed);
        } catch (e) { reject(new Error('Bad JSON from Replicate')); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function replicateGet(path) {
  return new Promise((resolve, reject) => {
    const token = process.env.REPLICATE_API_TOKEN;
    const req = https.request({
      hostname: 'api.replicate.com',
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(new Error('Bad JSON from Replicate')); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

// POST /api/render/start  { image, mask, projectType }  → { id }
router.post('/start', async (req, res) => {
  const { image, mask, projectType } = req.body;
  if (!image || !mask || !projectType) {
    return res.status(400).json({ error: 'Missing image, mask, or projectType' });
  }

  const prompt = PROJECT_PROMPTS[projectType] || PROJECT_PROMPTS.deck;
  const negativePrompt = 'unrealistic, cartoon, painting, sketch, blurry, low quality, distorted';

  try {
    const prediction = await replicatePost('/v1/models/lucataco/sdxl-inpainting/predictions', {
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image,
        mask,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        strength: 0.99,
      },
    });
    res.json({ id: prediction.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/render/status/:id  → { status, imageUrl }
router.get('/status/:id', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const prediction = await replicateGet(`/v1/predictions/${req.params.id}`);
    const output = prediction.output;
    const imageUrl = Array.isArray(output) ? output[0] : output;
    res.json({
      status: prediction.status,
      imageUrl: imageUrl || null,
      error: prediction.error || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
