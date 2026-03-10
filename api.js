// Vercel entry point - runs the Express app
import('./packages/api/src/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
