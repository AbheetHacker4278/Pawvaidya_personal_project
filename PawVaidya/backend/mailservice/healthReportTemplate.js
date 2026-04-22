const HEALTH_REPORT_TEMPLATE = (data) => {
    const { redis, system, services, timestamp } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F9FAFB; margin: 0; padding: 40px; color: #1F2937; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05); border: 1px solid #E5E7EB; }
            .header { background: linear-gradient(135deg, #00A971 0%, #059669 100%); padding: 40px; color: white; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
            .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; font-weight: 500; }
            .section { padding: 32px; border-bottom: 1px solid #F3F4F6; }
            .section-title { font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: #F9FAFB; padding: 16px; border-radius: 16px; border: 1px solid #F3F4F6; }
            .card-label { font-size: 11px; color: #6B7280; font-weight: 600; margin-bottom: 4px; }
            .card-value { font-size: 18px; font-weight: 700; color: #111827; }
            .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
            .status-up { background-color: #ECFDF5; color: #065F46; }
            .status-down { background-color: #FEF2F2; color: #991B1B; }
            .footer { padding: 24px; text-align: center; font-size: 12px; color: #9CA3AF; background: #F9FAFB; }
            .metric-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .metric-row:last-child { margin-bottom: 0; }
            .metric-name { font-size: 13px; color: #4B5563; font-weight: 500; }
            .metric-val { font-size: 13px; color: #111827; font-weight: 700; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>PawVaidya Intelligence</h1>
                <p>Automated Systems Health Analysis • ${timestamp}</p>
            </div>

            <!-- Redis Section -->
            <div class="section">
                <div class="section-title">🚀 Redis Cluster Performance</div>
                <div class="grid">
                    <div class="card">
                        <div class="card-label">Hit Rate</div>
                        <div class="card-value">${redis.hitRate}%</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Miss Rate</div>
                        <div class="card-value">${redis.missRate}%</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <div class="metric-row">
                        <span class="metric-name">EMAT (Latency Proxy)</span>
                        <span class="metric-val text-emerald-600">${redis.emat} ms</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-name">Throughput</span>
                        <span class="metric-val">${redis.opsPerSec} ops/sec</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-name">Uptime</span>
                        <span class="metric-val">${redis.uptimeDays} days</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-name">Memory Usage</span>
                        <span class="metric-val">${redis.memory}</span>
                    </div>
                </div>
            </div>

            <!-- System Info -->
            <div class="section">
                <div class="section-title">💻 Render Instance Analytics</div>
                <div class="metric-row">
                    <span class="metric-name">CPU Load</span>
                    <span class="metric-val">${system.cpuLoad}%</span>
                </div>
                <div class="metric-row">
                    <span class="metric-name">Memory Usage</span>
                    <span class="metric-val">${system.memUsage}% (${system.memUsed} / ${system.memTotal})</span>
                </div>
                <div class="metric-row">
                    <span class="metric-name">Server Uptime</span>
                    <span class="metric-val">${system.uptime}</span>
                </div>
            </div>

            <!-- Services Health -->
            <div class="section">
                <div class="section-title">🛡️ Critical Infrastructure</div>
                <div class="metric-row">
                    <span class="metric-name">MongoDB Database</span>
                    <span class="status-badge ${services.mongodb === 'Operational' ? 'status-up' : 'status-down'}">${services.mongodb}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-name">Cloudinary Media</span>
                    <span class="status-badge ${services.cloudinary === 'Operational' ? 'status-up' : 'status-down'}">${services.cloudinary}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-name">Supabase Auth</span>
                    <span class="status-badge ${services.supabase === 'Operational' ? 'status-up' : 'status-down'}">${services.supabase}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-name">Redis Cache</span>
                    <span class="status-badge ${services.redis === 'Operational' ? 'status-up' : 'status-down'}">${services.redis}</span>
                </div>
            </div>

            <div class="footer">
                This is an automated report generated by Antigravity AI.<br>
                © 2026 PawVaidya Engineering • All Systems Go
            </div>
        </div>
    </body>
    </html>
    `;
};

export default HEALTH_REPORT_TEMPLATE;
