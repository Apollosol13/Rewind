import express from 'express';

const router = express.Router();

// Placeholder for monitoring metrics (we'll implement this in Phase 4)
router.get('/metrics', (req, res) => {
  res.status(501).json({
    message: 'Monitoring metrics endpoint - Coming in Phase 4!',
    info: 'This will expose p95 latency, auth failures, and other metrics',
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Monitoring routes working!',
    alert_p95_threshold: process.env.ALERT_P95_MS || 2500,
    alert_auth_fail_rate: process.env.ALERT_AUTH_FAIL_RATE || 0.1,
  });
});

export default router;
