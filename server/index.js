'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const estimateRouter = require('./routes/estimate');
const animationRouter = require('./routes/animation');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', estimateRouter);
app.use('/api/animation', animationRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Construction Estimator running at http://localhost:${PORT}`);
  });
}

module.exports = app;
