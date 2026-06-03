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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Construction Estimator running at http://localhost:${PORT}`);
  });
}

module.exports = app;
