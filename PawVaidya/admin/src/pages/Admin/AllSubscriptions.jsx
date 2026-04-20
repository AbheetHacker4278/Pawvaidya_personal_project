import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Avatar, IconButton, Chip, TextField,
    InputAdornment, Grid, Card, CardContent, Tooltip, CircularProgress,
    Button, useTheme, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControlLabel, Switch, Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    CalendarMonth as CalendarIcon,
    CreditCard as CardIcon,
    AccountBalanceWallet as WalletIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    History as HistoryIcon,
    Star as StarIcon,
    CardGiftcard as GiftIcon,
    Group as GroupIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    AreaChart, Area, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, Info, Zap, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const AllSubscriptions = () => {
    const { getAllSubscriptions, subscriptions, loadingSubscriptions, revokeSubscription, giftSubscription, getallusers, users } = useContext(AdminContext);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlan, setFilterPlan] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Revocation Dialog State
    const [openRevokeDialog, setOpenRevokeDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [revokeReason, setRevokeReason] = useState("");
    const [shouldRefund, setShouldRefund] = useState(false);
    const [revoking, setRevoking] = useState(false);

    // Gifting Dialog State
    const [openGiftDialog, setOpenGiftDialog] = useState(false);
    const [giftPlan, setGiftPlan] = useState('Silver');
    const [giftDuration, setGiftDuration] = useState(1);
    const [giftUnit, setGiftUnit] = useState('months');
    const [giftToAll, setGiftToAll] = useState(false);
    const [giftReason, setGiftReason] = useState("");
    const [gifting, setGifting] = useState(false);
    const [analysisInsights, setAnalysisInsights] = useState([]);

    // Analytics processing
    const [chartData, setChartData] = useState({
        planDistribution: [],
        revenueByPlan: [],
        statusBreakdown: [],
        trendData: []
    });

    const processAnalytics = (subs) => {
        if (!subs || subs.length === 0) return;

        // 1. Plan Distribution
        const planCounts = { Silver: 0, Gold: 0, Platinum: 0 };
        const planRevenue = { Silver: 0, Gold: 0, Platinum: 0 };
        const statusCounts = {};

        subs.forEach(sub => {
            planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
            planRevenue[sub.plan] = (planRevenue[sub.plan] || 0) + (sub.amount || 0);
            statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
        });

        // 2. Trend Data (Last 6 months)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            last6Months.push({
                month: months[d.getMonth()],
                monthNum: d.getMonth(),
                year: d.getFullYear(),
                count: 0,
                revenue: 0
            });
        }

        subs.forEach(sub => {
            const subDate = new Date(sub.startDate);
            const subMonth = subDate.getMonth();
            const subYear = subDate.getFullYear();

            const monthData = last6Months.find(m => m.monthNum === subMonth && m.year === subYear);
            if (monthData) {
                monthData.count++;
                monthData.revenue += (sub.amount || 0);
            }
        });

        setChartData({
            planDistribution: Object.keys(planCounts).map(k => ({ name: k, value: planCounts[k] })),
            revenueByPlan: Object.keys(planRevenue).map(k => ({ name: k, revenue: planRevenue[k] })),
            statusBreakdown: Object.keys(statusCounts).map(k => ({ name: k, value: statusCounts[k] })),
            trendData: last6Months
        });

        // Generate Insights
        const insights = [];
        const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0][0];
        insights.push({
            title: "Dominant Strategy",
            text: `${topPlan} is your most popular plan, accounting for ${Math.round((planCounts[topPlan] / subs.length) * 100)}% of memberships.`,
            icon: <Zap size={18} />
        });

        const activeRate = Math.round((statusCounts['Active'] || 0) / subs.length * 100);
        insights.push({
            title: "Retention Health",
            text: `Current retention rate is ${activeRate}% with ${(statusCounts['Revoked'] || 0)} administrative revocations logged.`,
            icon: <Activity size={18} />
        });

        const totalRevenue = Object.values(planRevenue).reduce((a, b) => a + b, 0);
        const platRevenue = planRevenue['Platinum'] || 0;
        insights.push({
            title: "Premium Impact",
            text: `Platinum tier generates ${Math.round((platRevenue / totalRevenue) * 100)}% of your total subscription revenue.`,
            icon: <BarChart3 size={18} />
        });

        setAnalysisInsights(insights);
    };


    useEffect(() => {
        if (subscriptions) {
            processAnalytics(subscriptions);
        }
    }, [subscriptions]);

    useEffect(() => {
        getAllSubscriptions();
    }, []);

    useEffect(() => {
        let filtered = subscriptions ? [...subscriptions] : [];

        if (searchQuery) {
            filtered = filtered.filter(sub =>
                sub.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.razorpaySubscriptionId?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterPlan !== 'All') {
            filtered = filtered.filter(sub => sub.plan === filterPlan);
        }

        if (filterStatus !== 'All') {
            filtered = filtered.filter(sub => sub.status === filterStatus);
        }

        setFilteredSubscriptions(filtered);
    }, [subscriptions, searchQuery, filterPlan, filterStatus]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPlanColor = (plan) => {
        switch (plan) {
            case 'Platinum': return '#a855f7';
            case 'Gold': return '#fbbf24';
            case 'Silver': return '#94a3b8';
            default: return '#3b82f6';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return { bg: '#dcfce7', text: '#166534', border: '#bcf0da' };
            case 'Revoked': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
            case 'Expired': return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
            default: return { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' };
        }
    };

    const handleRevokeClick = (userId, userName) => {
        setSelectedUser({ id: userId, name: userName });
        setRevokeReason("");
        setShouldRefund(false);
        setOpenRevokeDialog(true);
    };

    const handleGiftClick = (userId = null, userName = null) => {
        if (userId) {
            setSelectedUser({ id: userId, name: userName });
            setGiftToAll(false);
        } else {
            setSelectedUser(null);
            setGiftToAll(true);
        }
        setGiftPlan('Silver');
        setGiftDuration(1);
        setGiftUnit('months');
        setGiftReason("");
        setOpenGiftDialog(true);
    };

    const confirmRevoke = async () => {
        if (!revokeReason || revokeReason.trim() === "") {
            return;
        }

        setRevoking(true);
        const success = await revokeSubscription(selectedUser.id, revokeReason, shouldRefund);
        setRevoking(false);

        if (success) {
            setOpenRevokeDialog(false);
        }
    };

    const confirmGift = async () => {
        if (!giftReason || giftReason.trim() === "") {
            return;
        }

        setGifting(true);
        const success = await giftSubscription({
            userId: selectedUser?.id,
            allUsers: giftToAll,
            plan: giftPlan,
            duration: giftDuration,
            durationUnit: giftUnit,
            reason: giftReason
        });
        setGifting(false);

        if (success) {
            setOpenGiftDialog(false);
        }
    };

    return (
        <Box sx={{ p: 4, pb: 10, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header section with Stats */}
            <Box sx={{ mb: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', mb: 1 }}>
                            Subscription <span className="text-blue-600">Intelligence</span>
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Complete audit and monitoring of PawPlan memberships.
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            placeholder="Search subscribers..."
                            variant="outlined"
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ width: 300, bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            sx={{ borderRadius: 3, border: '1px solid #e2e8f0', color: '#64748b', bgcolor: 'white' }}
                        >
                            Filters
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<GiftIcon />}
                            onClick={() => handleGiftClick()}
                            sx={{ borderRadius: 3, fontWeight: 800, textTransform: 'none', px: 3, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                        >
                            Gift All Users
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {[
                        {
                            label: 'Net Revenue',
                            value: formatCurrency((subscriptions || []).reduce((acc, curr) => acc + (curr.amount || 0) - (curr.refundAmount || 0), 0)),
                            icon: CardIcon,
                            color: '#3b82f6',
                            trend: '+12.5%'
                        },
                        {
                            label: 'Active Members',
                            value: (subscriptions || []).filter(s => s.status === 'Active').length,
                            icon: StarIcon,
                            color: '#10b981',
                            trend: '+5.2%'
                        },
                        {
                            label: 'Revoked Members',
                            value: (subscriptions || []).filter(s => s.status === 'Revoked').length,
                            icon: ErrorIcon,
                            color: '#ef4444',
                            trend: '-2.1%'
                        },
                        {
                            label: 'Platinum Tier',
                            value: (subscriptions || []).filter(s => s.plan === 'Platinum').length,
                            icon: CheckIcon,
                            color: '#a855f7',
                            trend: '+8.9%'
                        }
                    ].map((stat, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card elevation={0} sx={{
                                    borderRadius: 5,
                                    border: '1px solid #e2e8f0',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    bgcolor: 'white',
                                    transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}15`, color: stat.color }}>
                                                <stat.icon />
                                            </Box>
                                            <Chip
                                                label={stat.trend}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    bgcolor: stat.trend.startsWith('+') ? '#f0fdf4' : '#fef2f2',
                                                    color: stat.trend.startsWith('+') ? '#16a34a' : '#dc2626',
                                                    border: '1px solid',
                                                    borderColor: stat.trend.startsWith('+') ? '#dcfce7' : '#fee2e2'
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="#64748b" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#1e293b" sx={{ mt: 0.5 }}>{stat.value}</Typography>
                                    </CardContent>
                                    <Box sx={{ position: 'absolute', bottom: -15, right: -15, opacity: 0.03, transform: 'rotate(-15deg)' }}>
                                        <stat.icon sx={{ fontSize: 120 }} />
                                    </Box>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Subscription Intelligence Dashboard */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#334155', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BarChart3 className="text-blue-500" /> Intelligence <span className="text-slate-400">Analysis</span>
                </Typography>

                <Grid container spacing={3}>
                    {/* Plan Distribution Chart */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#64748b">POPULARITY INDEX</Typography>
                                <PieChartIcon size={18} className="text-slate-300" />
                            </Box>
                            <Box sx={{ height: 280, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.planDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {chartData.planDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getPlanColor(entry.name)} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Revenue Trend Chart */}
                    <Grid item xs={12} md={5}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#64748b">GROWTH VELOCITY</Typography>
                                <TrendingUp size={18} className="text-slate-300" />
                            </Box>
                            <Box sx={{ height: 280, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.trendData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="count" name="Subscribers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Revenue Breakdown Chart */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#64748b">REVENUE CONTRIBUTION</Typography>
                                <TrendingUp size={18} className="text-slate-300" />
                            </Box>
                            <Box sx={{ height: 280, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.revenueByPlan}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <RechartsTooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                                            {chartData.revenueByPlan.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getPlanColor(entry.name)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Status Breakdown Chart */}
                    <Grid item xs={12} md={3}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e2e8f0', height: '100%', bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#64748b">MEMBERSHIP LIFESTYLE</Typography>
                                <Info size={18} className="text-slate-300" />
                            </Box>
                            <Box sx={{ height: 280, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.statusBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {chartData.statusBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444', '#94a3b8'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* AI Insights Panel */}
                    <Grid item xs={12} md={3}>
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {analysisInsights.map((insight, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Paper elevation={0} sx={{
                                        p: 2.5,
                                        borderRadius: 4,
                                        border: '1px solid #e2e8f0',
                                        bgcolor: 'white',
                                        transition: 'all 0.3s',
                                        '&:hover': { transform: 'translateX(-5px)', borderColor: '#3b82f644', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                            <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: '#eff6ff', color: '#3b82f6' }}>
                                                {insight.icon}
                                            </Box>
                                            <Typography variant="caption" fontWeight={900} sx={{ color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {insight.title}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, fontWeight: 500 }}>
                                            {insight.text}
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            ))}

                            <Paper elevation={0} sx={{
                                p: 2,
                                borderRadius: 4,
                                bgcolor: '#1e293b',
                                color: 'white',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                                    <Info size={100} color="white" />
                                </Box>
                                <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 700, mb: 1 }}>ECOSYSTEM HEALTH</Typography>
                                <Typography variant="h6" fontWeight={800}>Monitoring Live</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.6 }}>Next audit in 24 hours</Typography>
                            </Paper>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Quick Filters */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Plan:</Typography>
                    {['All', 'Silver', 'Gold', 'Platinum'].map((plan) => (
                        <Chip
                            key={plan}
                            label={plan}
                            onClick={() => setFilterPlan(plan)}
                            sx={{
                                px: 1,
                                fontWeight: 800,
                                borderRadius: 2,
                                bgcolor: filterPlan === plan ? (plan === 'All' ? '#1e293b' : getPlanColor(plan)) : 'white',
                                color: filterPlan === plan ? 'white' : '#64748b',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}
                        />
                    ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Status:</Typography>
                    {['All', 'Active', 'Revoked', 'Expired'].map((status) => (
                        <Chip
                            key={status}
                            label={status}
                            onClick={() => setFilterStatus(status)}
                            sx={{
                                px: 1,
                                fontWeight: 800,
                                borderRadius: 2,
                                bgcolor: filterStatus === status ? '#1e293b' : 'white',
                                color: filterStatus === status ? 'white' : '#64748b',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}
                        />
                    ))}
                </Box>
            </Box>

            {/* Content Table */}
            <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: 5,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                maxHeight: 'calc(100vh - 400px)',
                bgcolor: 'white'
            }}>
                {loadingSubscriptions ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 12 }}>
                        <CircularProgress sx={{ color: '#3b82f6' }} />
                    </Box>
                ) : (
                    <Table stickyHeader>
                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: '#475569', py: 2.5 }}>MEMBER</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>PLAN DETAILS</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="center">TRANSACTION</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="center">TIMELINE</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="center">STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#475569' }} align="center">ACTION</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredSubscriptions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <Box sx={{ opacity: 0.5 }}>
                                                <ErrorIcon sx={{ fontSize: 64, mb: 1, color: '#94a3b8' }} />
                                                <Typography variant="h6" fontWeight={700}>No subscriptions found</Typography>
                                                <Typography variant="body2">Try adjusting your filters or search query</Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSubscriptions.map((sub, idx) => (
                                        <TableRow
                                            component={motion.tr}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={sub._id}
                                            hover
                                            sx={{ '&:hover': { bgcolor: '#f8fafc' } }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar
                                                        src={sub.userId?.image}
                                                        sx={{ width: 44, height: 44, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={800} color="#1e293b">{sub.userId?.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{sub.userId?.email}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{
                                                        width: 4,
                                                        height: 24,
                                                        borderRadius: 2,
                                                        bgcolor: getPlanColor(sub.plan)
                                                    }} />
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={900} sx={{ color: getPlanColor(sub.plan) }}>
                                                            {sub.plan}
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                                                            {formatCurrency(sub.amount)} / Month
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    icon={sub.paymentMethod === 'Wallet' ? <WalletIcon size="small" /> : <CardIcon size="small" />}
                                                    label={sub.paymentMethod}
                                                    size="small"
                                                    sx={{ fontWeight: 800, mb: 0.5, borderRadius: 1.5 }}
                                                />
                                                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                                                    {sub.razorpayPaymentId || 'Wallet TXN'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                                        <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                        <Typography variant="caption" fontWeight={700}>{formatDate(sub.startDate)}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>to</Typography>
                                                    <Typography variant="caption" fontWeight={900} color="#ef4444">{formatDate(sub.expiryDate)}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                    <Tooltip title={sub.cancellationReason || (sub.status === 'Revoked' ? "Revoked by Administrator" : "")} arrow placement="top">
                                                        <Chip
                                                            label={sub.status}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: getStatusColor(sub.status).bg,
                                                                color: getStatusColor(sub.status).text,
                                                                borderColor: getStatusColor(sub.status).border,
                                                                fontWeight: 900,
                                                                borderRadius: 2,
                                                                border: '1px solid',
                                                                '& .MuiChip-label': { px: 2 }
                                                            }}
                                                        />
                                                    </Tooltip>
                                                    {sub.status === 'Revoked' && (
                                                        <Typography variant="caption" sx={{ color: '#ef4444', fontStyle: 'italic', maxWidth: 120, lineHeight: 1.2, textAlign: 'center' }}>
                                                            {sub.cancellationReason || "Revoked by Administrator"}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={() => handleGiftClick(sub.userId?._id, sub.userId?.name)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 900,
                                                            textTransform: 'none',
                                                            fontSize: '0.75rem',
                                                            color: '#8b5cf6',
                                                            borderColor: '#8b5cf6',
                                                            '&:hover': { borderColor: '#7c3aed', bgcolor: '#f5f3ff' }
                                                        }}
                                                    >
                                                        Gift
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        disabled={sub.status !== 'Active'}
                                                        onClick={() => handleRevokeClick(sub.userId?._id, sub.userId?.name)}
                                                        sx={{
                                                            borderRadius: 2,
                                                            fontWeight: 900,
                                                            textTransform: 'none',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        Revoke
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {/* Revocation Dialog */}
            <Dialog
                open={openRevokeDialog}
                onClose={() => !revoking && setOpenRevokeDialog(false)}
                PaperProps={{
                    sx: { borderRadius: 4, width: '100%', maxWidth: 450, p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: '#1e293b', pb: 1 }}>
                    Revoke Membership
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                        Are you sure you want to revoke the subscription for <strong>{selectedUser?.name}</strong>? This action will reset their status immediately.
                    </Typography>

                    <TextField
                        autoFocus
                        fullWidth
                        label="Reason for Revocation"
                        placeholder="e.g., Refund requested, Payment failure..."
                        variant="outlined"
                        multiline
                        rows={3}
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        required
                        error={!revokeReason && revoking}
                        helperText={!revokeReason && revoking ? "Reason is mandatory" : ""}
                        sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />

                    <Box sx={{
                        p: 2,
                        borderRadius: 3,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">Refund Amount</Typography>
                            <Typography variant="caption" color="text.secondary">Return the funds to user's wallet</Typography>
                        </Box>
                        <Switch
                            checked={shouldRefund}
                            onChange={(e) => setShouldRefund(e.target.checked)}
                            color="primary"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1.5 }}>
                    <Button
                        onClick={() => setOpenRevokeDialog(false)}
                        disabled={revoking}
                        sx={{ fontWeight: 800, color: '#64748b', borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmRevoke}
                        variant="contained"
                        color="error"
                        disabled={!revokeReason || revoking}
                        startIcon={revoking ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 3,
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        {revoking ? "Revoking..." : "Confirm Revocation"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Gifting Dialog */}
            <Dialog
                open={openGiftDialog}
                onClose={() => !gifting && setOpenGiftDialog(false)}
                PaperProps={{
                    sx: { borderRadius: 4, width: '100%', maxWidth: 500, p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, color: '#1e293b', pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GiftIcon color="secondary" /> {giftToAll ? "Gift to Everyone" : "Gift Subscription"}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                        {giftToAll
                            ? "This will grant a complimentary premium subscription to ALL registered users on the platform."
                            : `You are gifting a complimentary subscription to ${selectedUser?.name}.`}
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                            <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>Select Plan</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {['Silver', 'Gold', 'Platinum'].map((plan) => (
                                    <Box
                                        key={plan}
                                        onClick={() => setGiftPlan(plan)}
                                        sx={{
                                            flex: 1,
                                            p: 1.5,
                                            borderRadius: 3,
                                            border: '2px solid',
                                            borderColor: giftPlan === plan ? getPlanColor(plan) : '#e2e8f0',
                                            bgcolor: giftPlan === plan ? `${getPlanColor(plan)}10` : 'white',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.2s',
                                            '&:hover': { borderColor: getPlanColor(plan) }
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight={900} color={giftPlan === plan ? getPlanColor(plan) : '#64748b'}>{plan}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase' }}>Set Duration</Typography>
                                <Box sx={{ display: 'flex', gap: 0.5, bgcolor: '#f1f5f9', p: 0.5, borderRadius: 2 }}>
                                    {['minutes', 'hours', 'days', 'months'].map((u) => (
                                        <Box
                                            key={u}
                                            onClick={() => setGiftUnit(u)}
                                            sx={{
                                                px: 1.5,
                                                py: 0.5,
                                                borderRadius: 1.5,
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                bgcolor: giftUnit === u ? 'white' : 'transparent',
                                                color: giftUnit === u ? '#1e293b' : '#64748b',
                                                boxShadow: giftUnit === u ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {u}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {[1, 3, 6, 12, 24].map((dur) => (
                                    <Chip
                                        key={dur}
                                        label={`${dur} ${dur === 1 ? giftUnit.slice(0, -1) : giftUnit}`}
                                        onClick={() => setGiftDuration(dur)}
                                        sx={{
                                            fontWeight: 800,
                                            borderRadius: 2,
                                            bgcolor: giftDuration === dur ? '#1e293b' : '#f1f5f9',
                                            color: giftDuration === dur ? 'white' : '#64748b',
                                            '&:hover': { bgcolor: giftDuration === dur ? '#1e293b' : '#e2e8f0' }
                                        }}
                                    />
                                ))}
                                <TextField
                                    size="small"
                                    type="number"
                                    placeholder="Qty"
                                    value={giftDuration}
                                    onChange={(e) => setGiftDuration(e.target.value)}
                                    sx={{
                                        width: 80,
                                        ml: 'auto',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            height: 32,
                                            fontSize: '0.875rem'
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <TextField
                        fullWidth
                        label="Gifting Reason / Note"
                        placeholder="e.g., Anniversary gift, beta tester reward..."
                        variant="outlined"
                        multiline
                        rows={2}
                        value={giftReason}
                        onChange={(e) => setGiftReason(e.target.value)}
                        required
                        error={!giftReason && gifting}
                        helperText={!giftReason && gifting ? "Reason is required for records" : ""}
                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1.5 }}>
                    <Button
                        onClick={() => setOpenGiftDialog(false)}
                        disabled={gifting}
                        sx={{ fontWeight: 800, color: '#64748b', borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmGift}
                        variant="contained"
                        color="secondary"
                        disabled={!giftReason || gifting}
                        startIcon={gifting ? <CircularProgress size={20} color="inherit" /> : <GiftIcon />}
                        sx={{
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 3,
                            bgcolor: '#8b5cf6',
                            '&:hover': { bgcolor: '#7c3aed' },
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                        }}
                    >
                        {gifting ? "Sending Gifts..." : giftToAll ? "Gift Everyone" : "Send Gift"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AllSubscriptions;
