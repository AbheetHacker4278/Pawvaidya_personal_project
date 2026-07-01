import allowedIpModel from '../models/allowedIpModel.js';
import adminModel from '../models/adminModel.js';
import systemConfigModel from '../models/systemConfigModel.js';

// ─────────────────────────────────────────────
// 1. IP ALLOWLIST MANAGER
// ─────────────────────────────────────────────
export const getAllowedIps = async (req, res) => {
  try {
    const list = await allowedIpModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, list });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const addAllowedIp = async (req, res) => {
  try {
    const { ipAddress, description } = req.body;
    if (!ipAddress) return res.json({ success: false, message: 'IP Address is required' });

    // Validate simple IP shape
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
    if (ipAddress !== '::1' && ipAddress !== '127.0.0.1' && !ipPattern.test(ipAddress)) {
      return res.json({ success: false, message: 'Invalid IP address format' });
    }

    const exists = await allowedIpModel.findOne({ ipAddress });
    if (exists) return res.json({ success: false, message: 'IP already in allowlist' });

    const newIp = new allowedIpModel({
      ipAddress,
      description,
      addedBy: req.admin?.email || 'Admin'
    });
    await newIp.save();
    res.json({ success: true, message: `IP ${ipAddress} added to allowlist`, allowedIp: newIp });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const deleteAllowedIp = async (req, res) => {
  try {
    const { ipId } = req.params;
    await allowedIpModel.findByIdAndDelete(ipId);
    res.json({ success: true, message: 'IP removed from allowlist' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 2. 2FA ENFORCEMENT POLICY
// ─────────────────────────────────────────────
export const get2faPolicyAndCompliance = async (req, res) => {
  try {
    // 1. Fetch config settings
    let config = await systemConfigModel.findOne({});
    if (!config) {
      config = new systemConfigModel();
      await config.save();
    }

    // 2. Fetch admins to compute compliance metrics
    const admins = await adminModel.find({});
    const totalAdmins = admins.length;
    // Assume 2FA compliant if they have a phone number configured or faceDescriptor set
    const compliantAdmins = admins.filter(a => a.phone || (a.faceDescriptor && a.faceDescriptor.length > 0));

    const csEmployeeModel = await import('../models/csEmployeeModel.js').then(m => m.default).catch(() => null);
    let totalCs = 0;
    let compliantCs = 0;
    if (csEmployeeModel) {
      const csEmployees = await csEmployeeModel.find({ status: 'active' });
      totalCs = csEmployees.length;
      compliantCs = csEmployees.filter(c => c.phone || c.isVerified).length;
    }

    // Default policy
    const policy = {
      enforcedRoles: config.enforced2faRoles || ['master', 'admin'],
      complianceRateAdmins: totalAdmins > 0 ? Math.round((compliantAdmins.length / totalAdmins) * 100) : 100,
      complianceRateCs: totalCs > 0 ? Math.round((compliantCs.length / totalCs) * 100) : 100,
      totalAdmins,
      compliantAdminsCount: compliantAdmins.length,
      totalCs,
      compliantCsCount: compliantCs,
    };

    res.json({ success: true, policy });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const update2faPolicy = async (req, res) => {
  try {
    const { enforcedRoles } = req.body;
    let config = await systemConfigModel.findOne({});
    if (!config) {
      config = new systemConfigModel();
    }
    // We dynamically store this field in MongoDB using schema-less nature of Mongoose if not defined in Schema
    config.set('enforced2faRoles', enforcedRoles);
    await config.save();

    res.json({ success: true, message: '2FA Policy updated successfully', enforcedRoles });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// 3. ROLE PERMISSION SIMULATOR (simulate views/endpoints for standard permissions list)
// ─────────────────────────────────────────────
export const getSimulatedPermissionPages = async (req, res) => {
  try {
    const { permissions } = req.query; // Expect comma separated permissions
    const permList = permissions ? permissions.split(',') : [];

    const hasPerm = (perm) => permList.includes('all') || permList.includes(perm);

    // Sidebar items layout matching Sidebar.jsx
    const pages = [
      { path: '/admin-dashboard', label: 'Dashboard', category: 'Insights', required: 'any' },
      { path: '/financial-calculations', label: 'Financials', category: 'Insights', required: 'financials' },
      { path: '/admin-deployments', label: 'Deployments', category: 'Insights', required: 'deployments' },
      { path: '/redis-monitoring', label: 'Redis Monitor', category: 'Insights', required: 'redis_monitor' },
      { path: '/manage-admins', label: 'Manage Admins', category: 'Management', required: 'manage_admins' },
      { path: '/all-appointments', label: 'Appointments', category: 'Management', required: 'appointments' },
      { path: '/add-doctor', label: 'Add Doctor', category: 'Management', required: 'add_doctor' },
      { path: '/doctor-list', label: 'Doctor List', category: 'Management', required: 'doctors' },
      { path: '/doctor-rankings', label: 'Top Doctors', category: 'Management', required: 'doctors' },
      { path: '/total-users', label: 'Total Users', category: 'Management', required: 'users' },
      { path: '/customer-360', label: 'Customer 360', category: 'Management', required: 'customer360' },
      { path: '/payment-details', label: 'Payment Details', category: 'Management', required: 'payment_details' },
      { path: '/all-subscriptions', label: 'All Subscriptions', category: 'Management', required: 'subscriptions' },
      { path: '/emergency-dashboard', label: 'Emergency Panel', category: 'Management', required: 'emergency_panel' },
      { path: '/stray-campaigns', label: 'Stray Campaigns', category: 'Management', required: 'stray_campaigns' },
      { path: '/beta-access-manager', label: 'Beta Access', category: 'Management', required: 'beta_access' },
      { path: '/media-registry', label: 'Media Registry', category: 'Management', required: 'media_registry' },
      { path: '/blacklist-management', label: 'Blacklist', category: 'Management', required: 'blacklist' },
      { path: '/manage-coupons', label: 'Coupons', category: 'Management', required: 'coupons' },
      { path: '/polls', label: 'Polls', category: 'Management', required: 'polls' },
      { path: '/security-monitoring', label: 'Security Monitor', category: 'Management', required: 'security_monitor' },
      { path: '/admin-live-streams', label: 'Live Streams', category: 'Communication', required: 'live_streams' },
      { path: '/admin-messages', label: 'Messages', category: 'Communication', required: 'messages' },
      { path: '/broadcast-email', label: 'Broadcast Email', category: 'Communication', required: 'broadcast_email' },
      { path: '/all-reports', label: 'All Reports', category: 'Communication', required: 'reports' },
      { path: '/app-issue-reports', label: 'App Issues', category: 'Communication', required: 'app_issues' },
      { path: '/unban-requests', label: 'Unban Requests', category: 'Communication', required: 'unban' },
      { path: '/deletion-requests', label: 'Deletion Requests', category: 'Communication', required: 'deletion_requests' },
      { path: '/doctor-chat', label: 'Doctor Chat', category: 'Communication', required: 'chat' },
      { path: '/cs-employees', label: 'CS Agents', category: 'Support Service', required: 'cs_employees' },
      { path: '/cs-complaints', label: 'Agent Complaints', category: 'Support Service', required: 'cs_employees' },
      { path: '/cs-chat', label: 'Agent Chat', category: 'Support Service', required: 'cs_employees' },
      { path: '/cs-tickets', label: 'CS Tickets', category: 'Support Service', required: 'cs_tickets' },
      { path: '/misbehavior-reports', label: 'Complaints', category: 'Support Service', required: 'misbehavior_reports' },
      { path: '/cruelty-reports', label: 'Cruelty Reports', category: 'Support Service', required: 'cruelty_reports' },
      { path: '/cs-reports', label: 'CS Reports', category: 'Support Service', required: 'cs_reports' }
    ];

    const allowed = pages.map(p => {
      const isVisible = p.required === 'any' || hasPerm(p.required);
      return { ...p, isVisible };
    });

    res.json({ success: true, simulatedPages: allowed });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
