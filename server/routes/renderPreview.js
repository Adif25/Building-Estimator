'use strict';

const express = require('express');
const https   = require('https');
const router  = express.Router();

// Style descriptors keyed by [projectType][style]
const STYLE_PROMPTS = {
  deck: {
    suburban: 'a classic pressure-treated wood deck with white painted railings and wooden steps, attached to the house, photorealistic backyard renovation, natural daylight',
    modern:   'a sleek modern composite Trex deck with matte black steel cable railings and frameless glass panels, clean geometric lines attached to house, contemporary backyard, photorealistic',
    luxury:   'a premium Ipe hardwood deck with built-in LED step lighting, glass railings, outdoor dining set, attached cedar pergola with string lights, luxurious backyard renovation, photorealistic',
    farmhouse:'a rustic cedar deck with barn-style X-pattern railings and wide wooden steps, farmhouse country backyard aesthetic, natural wood stain, photorealistic renovation',
  },
  fence: {
    suburban: 'a classic cedar wood privacy fence with cap rails, standard suburban backyard, clean new construction, photorealistic',
    modern:   'a modern horizontal-slat fence in dark gray composite boards, contemporary clean design, photorealistic backyard',
    luxury:   'an elegant wrought iron fence with brick pillars and ornate caps, upscale estate property, photorealistic renovation',
    farmhouse:'a rustic whitewashed wood picket fence with a simple gate, farmhouse cottage backyard, photorealistic',
  },
  shedFraming: {
    suburban: 'a classic vinyl-sided storage shed with shutters and double doors, suburban backyard, new construction, photorealistic',
    modern:   'a modern shed studio with flat roof, floor-to-ceiling windows, dark steel and cedar cladding, contemporary design, photorealistic',
    luxury:   'a premium cedar garden studio with cupola, large windows, French doors and window boxes, luxury property, photorealistic renovation',
    farmhouse:'a rustic barn-style shed with gambrel roof, weathered grey cedar board-and-batten siding, farmhouse aesthetic, photorealistic',
  },
};

function buildPrompt(projectType, style, dimensions) {
  const styleMap = STYLE_PROMPTS[projectType] || STYLE_PROMPTS.deck;
  const base = styleMap[style] || styleMap.suburban;
  const dimParts = [];
  if (dimensions?.length) dimParts.push(`${dimensions.length} feet long`);
  if (dimensions?.width)  dimParts.push(`${dimensions.width} feet wide`);
  if (dimensions?.height) dimParts.push(`${dimensions.height} feet tall`);
  const dimStr = dimParts.length ? `, approximately ${dimParts.join(' by ')}` : '';
  return `${base}${dimStr}, high quality architectural rendering, realistic lighting`;
}

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

// POST /api/render/start  { image, mask, projectType, style?, dimensions? }  → { id }
router.post('/start', async (req, res) => {
  const { image, mask, projectType, style, dimensions } = req.body;
  if (!image || !mask || !projectType) {
    return res.status(400).json({ error: 'Missing image, mask, or projectType' });
  }

  const prompt = buildPrompt(projectType, style || 'suburban', dimensions);

  try {
    const prediction = await replicatePost('/v1/models/black-forest-labs/flux-fill-dev/predictions', {
      input: {
        prompt,
        image,
        mask,
        steps: 28,
        guidance: 28,
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
