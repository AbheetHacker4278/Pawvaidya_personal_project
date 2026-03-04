import supabase from '../config/supabase.js';

/**
 * Service to handle data offloading to Supabase
 */
const supabaseService = {
    // TRACKER FOR CONNECTION ERRORS TO AVOID LOG FLOOD
    _connectionErrorLogged: false,
    _tableMissingLogged: false,

    /**
     * Log system metrics (latency, status, etc.)
     */
    async logMetric({ path, method, statusCode, latency, cacheHit }) {
        try {
            const { error } = await supabase
                .from('system_metrics')
                .insert([{
                    path,
                    method,
                    status_code: statusCode,
                    latency,
                    cache_hit: cacheHit
                }]);
            if (error) throw error;
            // Reset if successful
            this._connectionErrorLogged = false;
        } catch (error) {
            const errMsg = error.message || String(error);
            const isFetchError = errMsg.toLowerCase().includes('fetch');
            const isMissingTable = errMsg.includes('system_metrics') && (errMsg.includes('schema cache') || error.code === 'PGRST116');

            if (isFetchError) {
                if (!this._connectionErrorLogged) {
                    console.error('Supabase: Connection failed (is it configured correctly?). Subsequent connection errors will be suppressed.');
                    this._connectionErrorLogged = true;
                }
            } else if (isMissingTable) {
                if (!this._tableMissingLogged) {
                    console.warn('Supabase: Missing table "system_metrics". Please run the SQL in SUPABASE_SETUP.md to enable metrics.');
                    this._tableMissingLogged = true;
                }
            } else {
                console.error('Supabase Metric Log Error:', errMsg);
            }
        }
    },

    /**
     * Log activity (admin/doctor/user actions)
     */
    async logActivity({ userId, userType, activityType, description, ipAddress, userAgent, metadata }) {
        try {
            const { error } = await supabase
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    user_type: userType,
                    activity_type: activityType,
                    description,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    metadata: metadata || {}
                }]);
            if (error) throw error;
            this._connectionErrorLogged = false;
        } catch (error) {
            const errMsg = error.message || String(error);
            const isFetchError = errMsg.toLowerCase().includes('fetch');
            const isMissingTable = errMsg.includes('activity_logs') && (errMsg.includes('schema cache') || error.code === 'PGRST116');

            if (isFetchError) {
                if (!this._connectionErrorLogged) {
                    console.error('Supabase: Connection failed. Subsequent errors suppressed.');
                    this._connectionErrorLogged = true;
                }
            } else if (isMissingTable) {
                if (!this._tableMissingLogged) {
                    console.warn('Supabase: Missing table "activity_logs". Please run the SQL in SUPABASE_SETUP.md to enable logging.');
                    this._tableMissingLogged = true;
                }
            } else {
                console.error('Supabase Activity Log Error:', errMsg);
            }
        }
    },

    /**
     * Fetch recent metrics (for dashboard)
     */
    async getRecentMetrics(limit = 100) {
        try {
            const { data, error } = await supabase
                .from('system_metrics')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                const errMsg = error.message || String(error);
                if (errMsg.includes('schema cache') || error.code === 'PGRST116') {
                    if (!this._tableMissingLogged) {
                        console.warn('Supabase: Missing table "system_metrics". Please run the SQL in SUPABASE_SETUP.md.');
                        this._tableMissingLogged = true;
                    }
                    return [];
                }
                throw error;
            }
            return data;
        } catch (error) {
            const errMsg = error.message || String(error);
            if (errMsg.toLowerCase().includes('fetch')) {
                if (!this._connectionErrorLogged) {
                    console.error('Supabase: Connection failed. Subsequent errors suppressed.');
                    this._connectionErrorLogged = true;
                }
                return [];
            }
            throw error;
        }
    },

    /**
     * Fetch recent activity logs
     */
    async getActivityLogs(limit = 100) {
        try {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                const errMsg = error.message || String(error);
                if (errMsg.includes('schema cache') || error.code === 'PGRST116') {
                    if (!this._tableMissingLogged) {
                        console.warn('Supabase: Missing table "activity_logs". Please run the SQL in SUPABASE_SETUP.md.');
                        this._tableMissingLogged = true;
                    }
                    return [];
                }
                throw error;
            }
            return data;
        } catch (error) {
            const errMsg = error.message || String(error);
            if (errMsg.toLowerCase().includes('fetch')) {
                if (!this._connectionErrorLogged) {
                    console.error('Supabase: Connection failed. Subsequent errors suppressed.');
                    this._connectionErrorLogged = true;
                }
                return [];
            }
            throw error;
        }
    },

    /**
     * Update an activity log entry
     */
    async updateActivityLog(id, updateData) {
        const { data, error } = await supabase
            .from('activity_logs')
            .update(updateData)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    /**
     * Delete an activity log entry
     */
    async deleteActivityLog(id) {
        const { error } = await supabase
            .from('activity_logs')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    /**
     * Bulk delete activity log entries
     */
    async bulkDeleteActivityLogs(ids) {
        const { error } = await supabase
            .from('activity_logs')
            .delete()
            .in('id', ids);
        if (error) throw error;
        return true;
    }
};

export default supabaseService;
