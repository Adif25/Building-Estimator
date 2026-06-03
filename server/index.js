'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const estimateRouter = require('./routes/estimate');
const animationRouter    = require('./routes/animation');
const renderPreviewRouter = require('./routes/renderPreview');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', estimateRouter);
app.use('/api/animation', animationRouter);
app.use('/api/render', renderPreviewRouter);

// Temporary debug endpoint — remove once token issue is resolved
app.get('/api/debug-env', (_req, res) => {
  res.json({
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN ? 'SET ✓' : 'MISSING ✗',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    allKeys: Object.keys(process.env).filter(k => k.includes('REPLICATE') || k.includes('TOKEN')),
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Construction Estimator running at http://localhost:${PORT}`);
  });
}

module.exports = app;
