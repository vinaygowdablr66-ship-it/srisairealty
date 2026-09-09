// Vercel serverless entry point.
// All routes (API + static pages) are handled by the single Express app.
const { createApp } = require('../app');

const app = createApp();

module.exports = app;
