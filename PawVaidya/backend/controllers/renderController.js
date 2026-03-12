import axios from 'axios';

// Get Deployment Status for a specific service
const getServiceStatus = async (req, res) => {
    try {
        const { serviceType } = req.params; // 'backend', 'frontend', or 'admin'

        let serviceId;
        switch (serviceType) {
            case 'backend': serviceId = process.env.RENDER_BACKEND_SERVICE_ID; break;
            case 'frontend': serviceId = process.env.RENDER_FRONTEND_SERVICE_ID; break;
            case 'admin': serviceId = process.env.RENDER_ADMIN_SERVICE_ID; break;
            default: return res.status(400).json({ success: false, message: 'Invalid service type' });
        }

        if (!process.env.RENDER_API_KEY || !serviceId) {
            return res.status(500).json({ success: false, message: 'Render API configuration missing.' });
        }

        // Fetch the service details
        const serviceResponse = await axios.get(`https://api.render.com/v1/services/${serviceId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
                'Accept': 'application/json'
            }
        });

        // Fetch the recent deploys to get build status and history
        const deploysResponse = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys?limit=5`, {
            headers: {
                'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
                'Accept': 'application/json'
            }
        });

        const serviceInfo = serviceResponse.data;
        const recentDeploys = deploysResponse.data.map(d => ({
            id: d.deploy.id,
            status: d.deploy.status,
            createdAt: d.deploy.createdAt,
            updatedAt: d.deploy.updatedAt,
            finishedAt: d.deploy.finishedAt,
            commitMessage: d.deploy.commit?.message,
            commitId: d.deploy.commit?.id
        }));

        const latestDeploy = deploysResponse.data.length > 0 ? deploysResponse.data[0].deploy : null;

        res.json({
            success: true,
            status: {
                serviceName: serviceInfo.name,
                suspended: serviceInfo.suspended,
                repo: serviceInfo.repo,
                branch: serviceInfo.branch,
                region: serviceInfo.region,
                type: serviceInfo.type,
                slug: serviceInfo.slug,
                dashboardUrl: `https://dashboard.render.com/web/${serviceId}`, // Simplified link
                envVarsCount: serviceInfo.envVars?.length || 0,
                plan: serviceInfo.serviceDetails?.plan || 'Free/Individual',
                runtime: serviceInfo.serviceDetails?.runtime || 'Unknown',
                buildCommand: serviceInfo.serviceDetails?.buildCommand,
                startCommand: serviceInfo.serviceDetails?.startCommand,
                numDeploys: deploysResponse.data.length,
                recentDeploys: recentDeploys,
                latestDeployStatus: latestDeploy ? latestDeploy.status : 'unknown',
                latestDeployTime: latestDeploy ? latestDeploy.updatedAt : null,
                latestDeployId: latestDeploy ? latestDeploy.id : null,
                latestDeployFinishedAt: latestDeploy ? latestDeploy.finishedAt : null
            }
        });

    } catch (error) {
        console.error('Error fetching Render service status:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch service status' });
    }
};

// Get Deployment Logs for a specific service
const getServiceLogs = async (req, res) => {
    try {
        const { serviceType, deployId } = req.params;

        if (!process.env.RENDER_API_KEY || !deployId) {
            return res.status(400).json({ success: false, message: 'Missing API key or deploy ID.' });
        }

        let serviceId;
        switch (serviceType) {
            case 'backend': serviceId = process.env.RENDER_BACKEND_SERVICE_ID; break;
            case 'frontend': serviceId = process.env.RENDER_FRONTEND_SERVICE_ID; break;
            case 'admin': serviceId = process.env.RENDER_ADMIN_SERVICE_ID; break;
            default: return res.status(400).json({ success: false, message: `Invalid service type: ${serviceType}` });
        }

        if (!serviceId) {
            return res.status(400).json({ success: false, message: `Service ID not configured for: ${serviceType}` });
        }

        // We could fetch server logs or deploy logs. Render API requires deploy id for deploy logs.
        // It's usually easier to fetch the deploy logs for debugging deployments.
        // Or fetch server logs if available. Let's start with deploy logs if a deploy id is provided.
        // Endpoint: GET /v1/services/{serviceId}/deploys/{deployId} (might not contain full logs directly, but let's try)
        // Actually, getting raw logs might require a different approach or streaming, but Render API doesn't fully expose a simple raw log endpoint in v1 besides streaming, 
        // however we can see if `/v1/services/{serviceId}/deploys/{deployId}` has a log URL or status.
        // Wait, for custom logs, it takes a long time or returns streams. We will just return the deploy info for now, as direct log fetching from API v1 is not officially documented as a simple GET string.
        // Let's check the API spec. It's often `/v1/services/{serviceId}/deploys/{deployId}`

        const deployResponse = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys/${deployId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
                'Accept': 'application/json'
            }
        });

        res.json({
            success: true,
            deployInfo: deployResponse.data
        });

    } catch (error) {
        console.error('Error fetching Render service logs:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch service logs' });
    }
}

// Get Network Metrics for a specific service
const getServiceMetrics = async (req, res) => {
    try {
        const { serviceType } = req.params;
        const { range } = req.query; // '12h', '24h', '2d', '7d'

        let serviceId;
        switch (serviceType) {
            case 'backend': serviceId = process.env.RENDER_BACKEND_SERVICE_ID; break;
            case 'frontend': serviceId = process.env.RENDER_FRONTEND_SERVICE_ID; break;
            case 'admin': serviceId = process.env.RENDER_ADMIN_SERVICE_ID; break;
            default: return res.status(400).json({ success: false, message: 'Invalid service type' });
        }

        if (!process.env.RENDER_API_KEY || !serviceId) {
            return res.status(500).json({ success: false, message: 'Render API configuration missing.' });
        }

        // Calculate time range
        const now = new Date();
        const endTime = now.toISOString();
        let startDate = new Date(now);
        let resolutionSeconds = 3600; // Default 1 hour

        switch (range) {
            case '12h': startDate.setHours(now.getHours() - 12); resolutionSeconds = 1800; break;
            case '2d': startDate.setDate(now.getDate() - 2); resolutionSeconds = 3600 * 2; break;
            case '7d': startDate.setDate(now.getDate() - 7); resolutionSeconds = 3600 * 6; break;
            case '24h':
            default: startDate.setDate(now.getDate() - 1); resolutionSeconds = 3600; break;
        }

        const startTime = startDate.toISOString();

        const headers = {
            'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
            'Accept': 'application/json'
        };

        // 1. Fetch HTTP request count metrics
        const requestsData = await axios.get(`https://api.render.com/v1/metrics/http-requests`, {
            params: { resource: serviceId, startTime, endTime, resolutionSeconds },
            headers
        }).then(res => res.data?.[0]?.values || []).catch(err => {
            console.error(`Metric Error (Requests) for ${serviceType}:`, err.response?.data || err.message);
            return [];
        });

        // 2. Fetch Bandwidth metrics (total usage points)
        const bandwidthData = await axios.get(`https://api.render.com/v1/metrics/bandwidth`, {
            params: { resource: serviceId, startTime, endTime },
            headers
        }).then(res => res.data?.[0]?.values || []).catch(err => {
            console.error(`Metric Error (Bandwidth) for ${serviceType}:`, err.response?.data || err.message);
            return [];
        });

        // 3. Fetch Bandwidth Sources
        const sourcesData = await axios.get(`https://api.render.com/v1/metrics/bandwidth-sources`, {
            params: { resource: serviceId, startTime, endTime },
            headers
        }).then(res => {
            const rawData = res.data || [];
            return rawData.map(s => ({
                source: s.labels?.source || 'unknown',
                total: (s.values || []).reduce((acc, v) => acc + (parseFloat(v.value) || 0), 0)
            }));
        }).catch(err => {
            console.warn(`Metric Warning (Sources) for ${serviceType}:`, err.response?.data || err.message);
            return [];
        });

        res.json({
            success: true,
            metrics: {
                requests: requestsData,
                bandwidth: bandwidthData,
                sources: sourcesData,
                timeRange: { startTime, endTime, label: range || '24h' }
            }
        });

    } catch (error) {
        console.error('Critical Render Controller Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error in Metrics Controller',
            error: error.message
        });
    }
}

export { getServiceStatus, getServiceLogs, getServiceMetrics };
