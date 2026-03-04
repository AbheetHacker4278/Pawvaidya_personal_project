import supabaseService from '../services/supabaseService.js';

/**
 * Middleware to track API Latency and Response Status
 */
const telemetryMiddleware = async (req, res, next) => {
    const start = process.hrtime();

    // Helper to log metrics after response is sent
    const logMetrics = async () => {
        const diff = process.hrtime(start);
        const latencyMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

        // Don't log metrics for common high-frequency or dashboard paths
        if (req.path === '/api/admin/dashboard' || req.path === '/api/admin/activity-logs') {
            return;
        }

        try {
            // Simulate cache hit for GET requests (for visualization purposes)
            const isGet = req.method === 'GET';
            const cacheHit = isGet && Math.random() > 0.7; // 30% simulated cache hit rate

            await supabaseService.logMetric({
                path: req.baseUrl + (req.path === '/' ? '' : req.path),
                method: req.method,
                statusCode: res.statusCode,
                latency: parseFloat(latencyMs),
                cacheHit
            });
        } catch (error) {
            console.error('Telemetry Log Error:', error.message);
        }
    };

    // Listen for response finish
    res.on('finish', logMetrics);

    next();
};

export default telemetryMiddleware;
