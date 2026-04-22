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
import { TrendingUp, TrendingDown, Info, Zap, BarChart3, PieChart as PieChartIcon, Activity, XCircle, Clock } from 'lucide-react';

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
        <div className="p-6 md:p-10 lg:p-12 w-full min-h-screen bg-[#fdfaf7]">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100/50 rounded-full text-[10px] font-black uppercase tracking-tighter text-indigo-700 mb-4 border border-indigo-200/50">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Financial Intelligence Unit
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
                            Subscription <span className="text-indigo-600">Dynamics</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                            Real-time audit and lifecycle monitoring of PawPlan memberships.
                            <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-100 inline-block px-2 py-0.5 rounded">Vault: Encrypted Transaction Records</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Scan subscribers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-white border-none rounded-2xl shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 font-bold text-slate-700 w-full md:w-80 group-hover:shadow-indigo-100/50"
                            />
                        </div>
                        <button
                            onClick={() => handleGiftClick()}
                            className="group px-8 py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all duration-300 shadow-xl active:scale-95"
                        >
                            <GiftIcon className="group-hover:rotate-12 transition-transform" />
                            <span className="uppercase tracking-widest text-[11px]">Global Gift Drop</span>
                        </button>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        {
                            label: 'Net Yield',
                            value: formatCurrency((subscriptions || []).reduce((acc, curr) => acc + (curr.amount || 0) - (curr.refundAmount || 0), 0)),
                            icon: <CardIcon />,
                            color: 'indigo',
                            trend: '+12.5%'
                        },
                        {
                            label: 'Active Corps',
                            value: (subscriptions || []).filter(s => s.status === 'Active').length,
                            icon: <StarIcon />,
                            color: 'emerald',
                            trend: '+5.2%'
                        },
                        {
                            label: 'Admin Revokes',
                            value: (subscriptions || []).filter(s => s.status === 'Revoked').length,
                            icon: <ErrorIcon />,
                            color: 'rose',
                            trend: '-2.1%'
                        },
                        {
                            label: 'Platinum Elite',
                            value: (subscriptions || []).filter(s => s.plan === 'Platinum').length,
                            icon: <Zap size={20} />,
                            color: 'amber',
                            trend: '+8.9%'
                        }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-100 text-${stat.color}-600 flex items-center justify-center mb-6 relative z-10 group-hover:rotate-6 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${stat.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {stat.trend}
                                    </span >
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">vs Last Cycle</span>
                                </div>
                            </div>
                            {/* Decorative background circle */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                        </motion.div>
                    ))}
                </div>

                {/* Intelligence Analysis Dashboard */}
                <div className="mb-16">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                        <Activity className="text-indigo-500" size={16} /> Subscription Intelligence <span className="text-indigo-100">| Linear Projections</span>
                    </h2>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Plan Distribution Chart */}
                        <div className="xl:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                            <div className="flex justify-between items-center mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Dominance</p>
                                <PieChartIcon size={18} className="text-slate-200" />
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.planDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {chartData.planDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getPlanColor(entry.name)} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800, padding: '16px' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Trend Chart */}
                        <div className="xl:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30">
                            <div className="flex justify-between items-center mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Velocity</p>
                                <TrendingUp size={18} className="text-slate-200" />
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData.trendData}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800, padding: '16px' }}
                                        />
                                        <Area type="monotone" dataKey="count" name="New Ops" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Insights & Quick Action Panel */}
                        <div className="xl:col-span-3 space-y-4">
                            {analysisInsights.map((insight, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/20 group hover:border-indigo-200 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-xl bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                            {insight.icon}
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insight.title}</p>
                                    </div>
                                    <p className="text-slate-600 font-bold text-sm leading-relaxed">{insight.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filters & Control Hub */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-900 rounded-xl text-white">
                            <FilterIcon size={16} />
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Silver', 'Gold', 'Platinum'].map((plan) => (
                                <button
                                    key={plan}
                                    onClick={() => setFilterPlan(plan)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filterPlan === plan
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 shadow-inner'
                                        : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-200'
                                        }`}
                                >
                                    {plan}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['All', 'Active', 'Revoked', 'Expired'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filterStatus === status
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 shadow-inner'
                                    : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transaction Matrix Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative">
                    {loadingSubscriptions ? (
                        <div className="flex flex-col items-center justify-center p-32">
                            <CircularProgress sx={{ color: '#4f46e5' }} />
                            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Vault Data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar">
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-slate-50/90 backdrop-blur-sm shadow-sm">
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 first:rounded-tl-[1.5rem]">Member Archetype</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Subscription Tier</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Transaction ID</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lifecycle</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 last:rounded-tr-[1.5rem]">Directive</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence mode="popLayout">
                                        {filteredSubscriptions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-24 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <SearchIcon className="text-slate-100 mb-4" size={64} />
                                                        <p className="text-lg font-black text-slate-300 uppercase tracking-widest">No Matches Found</p>
                                                        <p className="text-slate-400 font-medium">Verify your query parameters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSubscriptions.map((sub, idx) => (
                                                <motion.tr
                                                    key={sub._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group hover:bg-indigo-50/30 transition-colors"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <img
                                                                    src={sub.userId?.image}
                                                                    alt=""
                                                                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-lg group-hover:rotate-6 transition-transform"
                                                                />
                                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${sub.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{sub.userId?.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{sub.userId?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: getPlanColor(sub.plan) }} />
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-tighter" style={{ color: getPlanColor(sub.plan) }}>{sub.plan}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">{formatCurrency(sub.amount)} <span className="opacity-50">/ UNIT</span></p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black font-mono text-slate-500 mb-1 group-hover:bg-white transition-colors uppercase tracking-widest">
                                                                {sub.paymentMethod}
                                                            </span>
                                                            <p className="text-[9px] font-bold text-slate-300 font-mono">
                                                                {sub.razorpayPaymentId || 'INTERNAL_WALLET'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <CalendarIcon fontSize="inherit" className="text-emerald-500" />
                                                                <p className="text-[10px] font-black text-slate-700">{formatDate(sub.startDate)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-50">
                                                                <Clock size={10} className="text-rose-500" />
                                                                <p className="text-[10px] font-black text-rose-500 line-through decoration-rose-200">{formatDate(sub.expiryDate)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                                                                sub.status === 'Revoked' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {sub.status}
                                                            </span>
                                                            {sub.status === 'Revoked' && (
                                                                <p className="text-[9px] font-bold text-rose-400 italic max-w-[120px] truncate" title={sub.cancellationReason}>
                                                                    {sub.cancellationReason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleGiftClick(sub.userId?._id, sub.userId?.name)}
                                                                className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                                                            >
                                                                <GiftIcon fontSize="small" />
                                                            </button>
                                                            <button
                                                                disabled={sub.status !== 'Active'}
                                                                onClick={() => handleRevokeClick(sub.userId?._id, sub.userId?.name)}
                                                                className={`p-2.5 rounded-xl transition-all active:scale-90 ${sub.status === 'Active'
                                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
                                                                    : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                                                                    }`}
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

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
            </div>
        </div>
    );
};

export default AllSubscriptions;
