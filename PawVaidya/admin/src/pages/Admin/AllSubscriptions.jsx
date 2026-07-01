import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Avatar, IconButton, Chip, TextField,
    InputAdornment, Grid, Card, CardContent, Tooltip, CircularProgress,
    Button, useTheme, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControlLabel, Switch, Divider, Autocomplete, FormControl, InputLabel, Select, MenuItem
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
import { TrendingUp, TrendingDown, Info, Zap, BarChart3, PieChart as PieChartIcon, Activity, XCircle, Clock, Mail, AlertTriangle, ShieldAlert, Award, AlertCircle } from 'lucide-react';

const AllSubscriptions = () => {
    const { 
        getAllSubscriptions, subscriptions, loadingSubscriptions, revokeSubscription, 
        giftSubscription, getallusers, users, getallappointments, appointments, sendIndividualEmail,
        predictChurnAI, approveObsidianPass, rejectObsidianPass, analyzeObsidianUser
    } = useContext(AdminContext);
    const [aiPredictions, setAiPredictions] = useState({});
    const [loadingAI, setLoadingAI] = useState(false);
    const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlan, setFilterPlan] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Tabs state
    const [activeTab, setActiveTab] = useState('analytics');

    // Outreach Dialog State
    const [openOutreachDialog, setOpenOutreachDialog] = useState(false);
    const [outreachUser, setOutreachUser] = useState(null);
    const [outreachTemplate, setOutreachTemplate] = useState('discount');
    const [outreachSubject, setOutreachSubject] = useState('');
    const [outreachMessage, setOutreachMessage] = useState('');
    const [sendingOutreach, setSendingOutreach] = useState(false);

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

    // Obsidian Dialog States
    const [openApproveDialog, setOpenApproveDialog] = useState(false);
    const [openRejectDialog, setOpenRejectDialog] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processingObsidian, setProcessingObsidian] = useState(false);
    
    // Obsidian AI Audit States
    const [aiAuditReport, setAiAuditReport] = useState('');
    const [loadingAiAudit, setLoadingAiAudit] = useState(false);

    // Obsidian Admin Topup States
    const { createAdminCreditTopupOrder, verifyAdminCreditTopup, getAdminCreditStats } = useContext(AdminContext);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupAmount, setTopupAmount] = useState('10000000'); // Default 1 Crore
    const [actionLoading, setActionLoading] = useState(false);
    const [creditStats, setCreditStats] = useState(null);

    const fetchCreditStats = async () => {
        const data = await getAdminCreditStats();
        if (data && data.success) {
            setCreditStats(data.stats);
        }
    };

    useEffect(() => {
        if (activeTab === 'creditPool') {
            fetchCreditStats();
        }
    }, [activeTab]);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleTopup = async () => {
        const amount = Number(topupAmount);
        if (!amount || amount < 10000000) {
            toast.error("Minimum top-up amount is ₹1,00,00,000 (1 Crore)");
            return;
        }

        setActionLoading(true);
        try {
            const scriptLoaded = await loadRazorpay();
            if (!scriptLoaded) {
                toast.error("Razorpay SDK failed to load. Are you offline?");
                return;
            }

            const data = await createAdminCreditTopupOrder(amount);
            if (data.success) {
                const { order, razorpayKeyId } = data;
                
                const options = {
                    key: razorpayKeyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: "PawVaidya Admin",
                    description: "Top-up Obsidian Interest-Free Credit Line",
                    order_id: order.id,
                    handler: async (response) => {
                        try {
                            setActionLoading(true);
                            const verifyRes = await verifyAdminCreditTopup({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (verifyRes.success) {
                                toast.success(verifyRes.message || "Top-up successful!");
                                setShowTopupModal(false);
                                fetchCreditStats();
                            } else {
                                toast.error(verifyRes.message || "Verification failed");
                            }
                        } catch (error) {
                            toast.error(error.message || "Error verifying top-up payment");
                        } finally {
                            setActionLoading(false);
                        }
                    },
                    prefill: {
                        name: "Admin",
                        email: "admin@pawvaidya.com"
                    },
                    theme: {
                        color: "#D4AF37"
                    },
                    modal: {
                        ondismiss: () => {
                            setActionLoading(false);
                        }
                    }
                };

                const rpay = new window.Razorpay(options);
                rpay.open();
            } else {
                toast.error(data.message || "Failed to initiate top-up");
            }
        } catch (error) {
            toast.error(error.message || "Error initiating top-up payment");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveClick = async (sub) => {
        setSelectedSub(sub);
        setOpenApproveDialog(true);
        setAiAuditReport('');
        setLoadingAiAudit(true);
        try {
            const res = await analyzeObsidianUser(sub._id);
            if (res && res.success) {
                setAiAuditReport(res.analysis);
            } else {
                setAiAuditReport('Failed to load AI Eligibility Audit: ' + (res?.message || 'Unknown error'));
            }
        } catch (err) {
            setAiAuditReport('Error performing AI Eligibility Audit: ' + err.message);
        } finally {
            setLoadingAiAudit(false);
        }
    };

    const handleRejectClick = (sub) => {
        setSelectedSub(sub);
        setRejectReason('');
        setOpenRejectDialog(true);
    };

    const confirmApproveObsidian = async () => {
        setProcessingObsidian(true);
        const success = await approveObsidianPass(selectedSub._id);
        setProcessingObsidian(false);
        if (success) {
            setOpenApproveDialog(false);
        }
    };

    const confirmRejectObsidian = async () => {
        setProcessingObsidian(true);
        const success = await rejectObsidianPass(selectedSub._id, rejectReason);
        setProcessingObsidian(false);
        if (success) {
            setOpenRejectDialog(false);
        }
    };

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
        const planCounts = { Silver: 0, Gold: 0, Platinum: 0, Obsidian: 0 };
        const planRevenue = { Silver: 0, Gold: 0, Platinum: 0, Obsidian: 0 };
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
        getallusers();
        if (getallappointments) {
            getallappointments();
        }
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
            case 'Obsidian': return '#D4AF37';
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
            case 'Pending': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
            case 'Cancelled': return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
            default: return { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' };
        }
    };

    const calculateChurnRisk = (sub) => {
        if (!sub || sub.status !== 'Active') {
            return { score: 0, level: 'Low', reasons: ['Inactive'], bookingsCount: 0, diffDays: 0 };
        }

        if (aiPredictions && aiPredictions[sub._id]) {
            return {
                score: aiPredictions[sub._id].score,
                level: aiPredictions[sub._id].level,
                reasons: aiPredictions[sub._id].reasons,
                isAI: true
            };
        }

        const expiryDate = new Date(sub.expiryDate);
        const now = new Date();
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Get user appointments from global context
        const userApps = appointments 
            ? appointments.filter(app => {
                const appUserId = app.userId?._id || app.userId;
                const subUserId = sub.userId?._id || sub.userId;
                return appUserId && subUserId && appUserId === subUserId;
              })
            : [];
        
        // Count bookings in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBookings = userApps.filter(app => {
            const appDate = new Date(app.date || app.createdAt);
            return appDate >= thirtyDaysAgo;
        }).length;

        let score = 0;
        const reasons = [];

        // Factor 1: Auto-renew status
        if (sub.isAutoRenew === false) {
            score += 40;
            reasons.push("Auto-Renew Disabled");
        } else {
            score += 10;
        }

        // Factor 2: Days to expiry
        if (diffDays <= 7) {
            score += 35;
            reasons.push(`Expiring in ${diffDays} day${diffDays === 1 ? '' : 's'}`);
        } else if (diffDays <= 15) {
            score += 20;
            reasons.push(`Expiring in ${diffDays} days`);
        } else if (diffDays <= 30) {
            score += 10;
            reasons.push("Expires within 30 days");
        }

        // Factor 3: Usage activity (bookings count)
        if (recentBookings === 0) {
            score += 25;
            reasons.push("No consults booked in 30 days");
        } else if (recentBookings === 1) {
            score += 10;
            reasons.push("Only 1 consult booked in 30 days");
        }

        // Factor 4: Plan tier adjustment
        if (sub.plan === 'Platinum') {
            score -= 10;
        } else if (sub.plan === 'Silver') {
            score += 5;
        }

        // Clamp range [0, 100]
        score = Math.max(0, Math.min(100, score));

        let level = 'Low';
        if (score >= 65) level = 'High';
        else if (score >= 35) level = 'Medium';

        return { score, level, reasons, bookingsCount: recentBookings, diffDays };
    };

    const handleOutreachClick = (sub) => {
        const name = sub.userId?.name || 'Valued Subscriber';
        const email = sub.userId?.email || '';
        const risk = calculateChurnRisk(sub);
        
        const isDiscountEligible = risk.score >= 35;
        const isWellnessEligible = risk.score >= 65;
        const customPred = aiPredictions ? aiPredictions[sub._id] : null;

        // Compute subscription context for the dialog
        const expiryDate = new Date(sub.expiryDate);
        const now = new Date();
        const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        const userApps = appointments
            ? appointments.filter(app => {
                const appUserId = app.userId?._id || app.userId;
                const subUserId = sub.userId?._id || sub.userId;
                return appUserId && subUserId && appUserId.toString() === subUserId.toString();
              })
            : [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentBookings = userApps.filter(a => new Date(a.date || a.createdAt) >= thirtyDaysAgo).length;

        setOutreachUser({
            name,
            email,
            plan: sub.plan,
            riskScore: risk.score,
            riskLevel: risk.level,
            subscriptionId: sub._id,
            isAutoRenew: sub.isAutoRenew,
            diffDays,
            recentBookings,
            amount: sub.amount,
            isAI: risk.isAI || false,
            aiCustomized: !!customPred
        });

        // AI-aware template selection:
        // High risk (>=65) → Wellness (free consultation) auto-selected
        // Medium risk (>=35) → Discount (15% off) auto-selected
        if (isWellnessEligible) {
            const defaultWellnessSubject = `❤️ Claim Your Complimentary Pet Wellness Checkup, ${name}!`;
            const defaultWellnessMsg = `Dear ${name},\n\nYour pet's wellness is our top priority. As a valued ${sub.plan} member of PawVaidya, we want to help you make the most of your benefits.\n\nBefore your current subscription cycle ends, we invite you to book a completely free general wellness consultation with one of our top-rated online veterinarians. Use the coupon code FREEWELLNESS at checkout to claim your free consultation.\n\nLet's make sure your pet is in perfect health!\n\nWarm regards,\nThe PawVaidya Veterinary Panel`;
            setOutreachTemplate('wellness');
            setOutreachSubject(customPred?.customWellnessSubject || defaultWellnessSubject);
            setOutreachMessage(customPred?.customWellnessMessage || defaultWellnessMsg);
        } else if (isDiscountEligible) {
            const defaultSubject = `🐾 Exclusive PawVaidya Loyalty Reward for ${name}!`;
            const defaultMsg = `Dear ${name},\n\nWe noticed you haven't booked an appointment recently and your ${sub.plan} subscription is scheduled to expire soon. We want to thank you for choosing PawVaidya for your pet's healthcare needs!\n\nAs a token of appreciation, use the coupon code HEALTHYPET15 to claim a 15% discount on your next veterinary consultation or marketplace order.\n\nBest wishes to you and your pet,\nThe PawVaidya Care Team`;
            setOutreachTemplate('discount');
            setOutreachSubject(customPred?.customDiscountSubject || defaultSubject);
            setOutreachMessage(customPred?.customDiscountMessage || defaultMsg);
        } else {
            setOutreachTemplate('custom');
            setOutreachSubject('');
            setOutreachMessage('');
        }
        setOpenOutreachDialog(true);
    };

    const handleTemplateChange = (templateType, userName, plan) => {
        const isDiscountEligible = outreachUser?.riskScore >= 35;
        const isWellnessEligible = outreachUser?.riskScore >= 65;

        if (templateType === 'discount' && !isDiscountEligible) {
            return;
        }
        if (templateType === 'wellness' && !isWellnessEligible) {
            return;
        }

        setOutreachTemplate(templateType);
        
        const customPred = aiPredictions && outreachUser?.subscriptionId ? aiPredictions[outreachUser.subscriptionId] : null;

        if (templateType === 'discount') {
            const defaultSubject = `🐾 Exclusive PawVaidya Loyalty Reward for ${userName}!`;
            const defaultMsg = `Dear ${userName},\n\nWe noticed you haven't booked an appointment recently and your ${plan} subscription is scheduled to expire soon. We want to thank you for choosing PawVaidya for your pet's healthcare needs!\n\nAs a token of appreciation, use the coupon code HEALTHYPET15 to claim a 15% discount on your next veterinary consultation or marketplace order.\n\nBest wishes to you and your pet,\nThe PawVaidya Care Team`;
            
            setOutreachSubject(customPred?.customDiscountSubject || defaultSubject);
            setOutreachMessage(customPred?.customDiscountMessage || defaultMsg);
        } else if (templateType === 'wellness') {
            const defaultSubject = `❤️ Claim Your Complimentary Pet Wellness Checkup, ${userName}!`;
            const defaultMsg = `Dear ${userName},\n\nYour pet's wellness is our top priority. As a valued ${plan} member of PawVaidya, we want to help you make the most of your benefits.\n\nBefore your current subscription cycle ends, we invite you to book a completely free general wellness consultation with one of our top-rated online veterinarians. Use the coupon code FREEWELLNESS at checkout to claim your free consultation.\n\nLet's make sure your pet is in perfect health!\n\nWarm regards,\nThe PawVaidya Veterinary Panel`;
            
            setOutreachSubject(customPred?.customWellnessSubject || defaultSubject);
            setOutreachMessage(customPred?.customWellnessMessage || defaultMsg);
        } else {
            setOutreachSubject('');
            setOutreachMessage('');
        }
    };

    const sendOutreachEmailHandler = async () => {
        if (!outreachUser?.email || !outreachSubject || !outreachMessage) {
            return;
        }

        setSendingOutreach(true);
        const formData = new FormData();
        formData.append("email", outreachUser.email);
        formData.append("subject", outreachSubject);
        formData.append("message", outreachMessage);

        const success = await sendIndividualEmail(formData);
        setSendingOutreach(false);
        if (success) {
            setOpenOutreachDialog(false);
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

    // Calculate Active & Churn variables for retention dashboard
    const activeSubs = subscriptions ? subscriptions.filter(s => s.status === 'Active') : [];
    const atRiskSubs = activeSubs.filter(s => calculateChurnRisk(s).level !== 'Low');
    const highRiskCount = activeSubs.filter(s => calculateChurnRisk(s).level === 'High').length;
    const mediumRiskCount = activeSubs.filter(s => calculateChurnRisk(s).level === 'Medium').length;
    const avgRiskScore = activeSubs.length ? Math.round(activeSubs.reduce((acc, curr) => acc + calculateChurnRisk(curr).score, 0) / activeSubs.length) : 0;
    const optOutRate = activeSubs.length ? Math.round((activeSubs.filter(s => s.isAutoRenew === false).length / activeSubs.length) * 100) : 0;
    const vulnerableMRR = atRiskSubs.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const fetchAIPredictions = async () => {
        if (activeSubs.length === 0) return;
        setLoadingAI(true);
        try {
            const predictions = await predictChurnAI(activeSubs, appointments);
            if (predictions && Array.isArray(predictions)) {
                const predMap = {};
                let highCount = 0, medCount = 0;
                predictions.forEach(p => {
                    predMap[p.id] = {
                        score: p.score,
                        level: p.level,
                        reasons: p.reasons,
                        customDiscountSubject: p.customDiscountSubject,
                        customDiscountMessage: p.customDiscountMessage,
                        customWellnessSubject: p.customWellnessSubject,
                        customWellnessMessage: p.customWellnessMessage
                    };
                    if (p.level === 'High') highCount++;
                    else if (p.level === 'Medium') medCount++;
                });
                setAiPredictions(predMap);
                // Show success summary
                if (highCount > 0 || medCount > 0) {
                    const msg = `🤖 Kimi K2.6 complete: ${highCount} High-risk (Wellness recommended) · ${medCount} Medium-risk (Discount recommended). AI-tailored outreach is ready.`;
                    import('react-toastify').then(({ toast: toastLib }) => toastLib.success(msg, { autoClose: 6000 }));
                }
            }
        } catch (err) {
            console.error("AI Churn fetch error:", err);
        } finally {
            setLoadingAI(false);
        }
    };

    useEffect(() => {
        if (activeSubs.length > 0 && appointments && Object.keys(aiPredictions).length === 0 && !loadingAI) {
            fetchAIPredictions();
        }
    }, [activeSubs, appointments]);

    const riskData = [
        { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
        { name: 'Medium Risk', value: mediumRiskCount, color: '#f59e0b' },
        { name: 'Low Risk', value: Math.max(0, activeSubs.length - highRiskCount - mediumRiskCount), color: '#10b981' }
    ].filter(item => item.value > 0);

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
                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setGiftToAll(false);
                                setGiftPlan('Silver');
                                setGiftDuration(1);
                                setGiftUnit('months');
                                setGiftReason("");
                                setOpenGiftDialog(true);
                            }}
                            className="group px-8 py-4 bg-white text-slate-900 font-black rounded-2xl flex items-center gap-3 border-2 border-slate-900 hover:bg-slate-50 transition-all duration-300 shadow-xl active:scale-95"
                        >
                            <PersonIcon className="group-hover:scale-110 transition-transform" />
                            <span className="uppercase tracking-widest text-[11px]">Gift to Individual</span>
                        </button>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
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
                        },
                        {
                            label: 'Obsidian Pending',
                            value: (subscriptions || []).filter(s => s.plan === 'Obsidian' && s.status === 'Pending').length,
                            icon: <Clock size={20} className="text-violet-600 animate-pulse" />,
                            color: 'violet',
                            trend: 'New Tier'
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
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        stat.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-600' :
                                        stat.trend.startsWith('-') ? 'bg-rose-100 text-rose-600' :
                                        'bg-violet-100 text-violet-600'
                                    }`}>
                                        {stat.trend}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">vs Last Cycle</span>
                                </div>
                            </div>
                            {/* Decorative background circle */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                        </motion.div>
                    ))}
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`pb-4 px-6 font-black text-xs md:text-sm uppercase tracking-widest border-b-2 transition-all duration-200 whitespace-nowrap ${
                            activeTab === 'analytics'
                                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        📊 Core Performance
                    </button>
                    <button
                        onClick={() => setActiveTab('retention')}
                        className={`pb-4 px-6 font-black text-xs md:text-sm uppercase tracking-widest border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'retention'
                                ? 'border-violet-600 text-violet-600 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        🔮 Retention & Churn Analytics
                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-black animate-pulse">
                            PREDICTIVE
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('creditPool')}
                        className={`pb-4 px-6 font-black text-xs md:text-sm uppercase tracking-widest border-b-2 transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'creditPool'
                                ? 'border-amber-600 text-amber-600 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        💳 Obsidian Credit Pool
                        <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black">
                            VIP
                        </span>
                    </button>
                </div>

                {activeTab === 'analytics' && (
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
                )}
                
                {activeTab === 'retention' && (
                    <div className="mb-16">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                <Activity className="text-violet-500" size={16} /> Churn Risk Assessment 
                                <span className="text-violet-200">|</span> 
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                    Object.keys(aiPredictions).length > 0 
                                        ? 'bg-violet-100 text-violet-700 border border-violet-200 animate-pulse' 
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                    {Object.keys(aiPredictions).length > 0 ? "🤖 Kimi K2.6 AI Enabled" : "📊 Heuristic Fallback"}
                                </span>
                            </h2>

                            <button
                                disabled={loadingAI || activeSubs.length === 0}
                                onClick={fetchAIPredictions}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border shadow-sm transition-all duration-300 ${
                                    loadingAI
                                        ? 'bg-violet-50 text-violet-400 border-violet-100 cursor-not-allowed'
                                        : 'bg-white hover:bg-violet-50 text-violet-700 border-violet-100 hover:border-violet-200 active:scale-95'
                                }`}
                            >
                                {loadingAI ? (
                                    <>
                                        <CircularProgress size={12} color="inherit" />
                                        Running Kimi K2.6...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={12} className="text-violet-600 animate-bounce" />
                                        Trigger AI Prediction
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                            {/* Summary Metrics */}
                            <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Churn Risk</p>
                                    <h4 className="text-2xl font-black text-slate-900">{avgRiskScore}%</h4>
                                    <div className="mt-2 flex items-center gap-1">
                                        <AlertTriangle size={12} className={avgRiskScore > 40 ? 'text-amber-500' : 'text-emerald-500'} />
                                        <span className="text-[10px] font-bold text-slate-400">{Object.keys(aiPredictions).length > 0 ? "Kimi K2.6 AI Score" : "Heuristic Risk Index"}</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">At-Risk Subscribers</p>
                                    <h4 className="text-2xl font-black text-rose-600">{atRiskSubs.length} <span className="text-xs text-slate-400 font-normal">/ {activeSubs.length} active</span></h4>
                                    <div className="mt-2 flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-rose-500 font-extrabold">{highRiskCount} Critical</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-[10px] font-bold text-amber-500 font-extrabold">{mediumRiskCount} Elevated</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auto-Renew Opt-Outs</p>
                                    <h4 className="text-2xl font-black text-slate-900">{optOutRate}%</h4>
                                    <div className="mt-2 flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400">Higher probability to drop out</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vulnerable Monthly Yield</p>
                                    <h4 className="text-2xl font-black text-[#5A4035]">{formatCurrency(vulnerableMRR)}</h4>
                                    <div className="mt-2 flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-400">Potential monthly revenue at risk</span>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Distribution Chart */}
                            <div className="xl:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Risk Profile Distribution</p>
                                {riskData.length > 0 ? (
                                    <div className="h-60 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={riskData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={75}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {riskData.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 800 }} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-60 text-slate-300">
                                        <Smile size={48} />
                                        <p className="mt-2 text-xs font-bold uppercase">All quiet. No risk detected.</p>
                                    </div>
                                )}
                            </div>

                            {/* At-Risk Members Detail Listing */}
                            <div className="xl:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Subscribers Requiring Immediate Re-Engagement</p>
                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {atRiskSubs.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <CheckIcon className="text-emerald-500 mb-2 mx-auto" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No At-Risk Users Found</p>
                                            <p className="text-xs">All active users are highly active and scheduled to renew automatically.</p>
                                        </div>
                                    ) : (
                                        atRiskSubs
                                            .map(sub => ({ sub, risk: calculateChurnRisk(sub) }))
                                            .sort((a, b) => b.risk.score - a.risk.score)
                                            .map(({ sub, risk }) => (
                                                <div key={sub._id} className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-[1.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-100/80 hover:border-violet-200/80 hover:from-white hover:to-violet-50/10 shadow-sm hover:shadow-md hover:shadow-violet-100/20 transition-all duration-300">
                                                    <div className="flex items-center gap-3.5">
                                                        {sub.userId?.image ? (
                                                            <img src={sub.userId?.image} alt="" className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm" />
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700 border border-violet-200/50 flex items-center justify-center font-black text-xs shadow-sm tracking-wider">
                                                                {sub.userId?.name ? sub.userId.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-slate-900 tracking-tight">{sub.userId?.name}</span>
                                                                <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[8px] font-black uppercase rounded-[4px] tracking-widest">{sub.plan}</span>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold truncate max-w-[180px]" title={sub.userId?.email}>{sub.userId?.email}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Risk Reasons */}
                                                    <div className="flex flex-col gap-1.5 max-w-sm w-full md:w-auto my-1 md:my-0">
                                                        {risk.reasons.map((r, i) => (
                                                            <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50/60 text-rose-700 text-[9px] font-black uppercase tracking-wider rounded-xl border border-rose-100/80 leading-relaxed shadow-sm w-fit">
                                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0 animate-ping"></span>
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Risk Level Badge */}
                                                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100/70">
                                                        <div className="text-left md:text-right">
                                                            <div className="flex items-center gap-1.5 md:justify-end">
                                                                <span className={`w-2 h-2 rounded-full ${risk.level === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${risk.level === 'High' ? 'text-rose-600' : 'text-amber-500'}`}>
                                                                    {risk.level} Risk
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center md:justify-end gap-1">
                                                                Score: <span className="font-extrabold text-slate-700">{risk.score}%</span>
                                                                {risk.isAI && <span title="AI Evaluated">🤖</span>}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Re-engage Trigger */}
                                                        <button
                                                            onClick={() => handleOutreachClick(sub)}
                                                            className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-violet-200 hover:shadow-violet-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                                                        >
                                                            <Mail size={12} />
                                                            Re-engage
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'creditPool' && (
                    <div className="mb-16">
                        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-amber-900/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                            
                            <div className="space-y-3 relative z-10">
                                <span className="bg-black/20 text-amber-100 border border-amber-400/30 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                                    Admin Vault Control
                                </span>
                                <h1 className="text-3xl font-black tracking-tighter">Interest-Free Credit Line</h1>
                                <p className="text-amber-100 text-sm max-w-xl font-bold">
                                    Manage the global Obsidian credit pool. Authorized admins can replenish the pool via Razorpay. Minimum top-up is ₹1 Crore.
                                </p>
                            </div>

                            <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col items-center sm:items-start gap-4 relative z-10 w-full md:w-auto shadow-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-amber-300 shrink-0 border border-white/20">
                                        <WalletIcon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-200 font-black uppercase tracking-widest mb-1">Global Pool Balance</p>
                                        <h2 className="text-3xl font-black tracking-tighter">₹{creditStats?.globalPool?.balance?.toLocaleString() || '0'}</h2>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowTopupModal(true)}
                                    className="w-full px-5 py-3 bg-white text-amber-700 hover:bg-amber-50 rounded-xl text-[11px] font-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 shrink-0 uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Zap size={14} className="text-amber-500" />
                                    Replenish Pool
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pool Limit</p>
                                <h4 className="text-2xl font-black text-slate-900">₹{creditStats?.globalPool?.limit?.toLocaleString() || '0'}</h4>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Utilized Credit</p>
                                <h4 className="text-2xl font-black text-rose-600">₹{creditStats?.globalPool?.spent?.toLocaleString() || '0'}</h4>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Delinquent Users</p>
                                <h4 className="text-2xl font-black text-amber-600">{creditStats?.delinquentCount || '0'} <span className="text-xs font-normal text-slate-500">/ {creditStats?.usersCount || '0'} total</span></h4>
                            </div>
                        </div>

                        {/* Delinquent Users Table */}
                        {creditStats?.delinquentUsers?.length > 0 && (
                            <div className="mt-8 bg-white p-6 rounded-[2rem] border border-rose-100 shadow-xl">
                                <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} /> Accounts Exceeding Repayment Window
                                </h3>
                                <div className="space-y-3">
                                    {creditStats.delinquentUsers.map(user => (
                                        <div key={user._id} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email} | {user.phone}</p>
                                            </div>
                                            <div className="flex gap-6">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unpaid Amount</p>
                                                    <p className="font-black text-rose-600">₹{user.creditLine?.spent?.toLocaleString() || 0}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deadline Passed</p>
                                                    <p className="font-bold text-slate-700">{new Date(user.creditLine?.repaymentDeadline).toLocaleDateString()}</p>
                                                </div>
                                                <button 
                                                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors"
                                                    onClick={() => revokeSubscription(user._id, "Failed to repay Interest-Free Credit Line.")}
                                                >
                                                    Revoke Pass
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Topup Modal */}
                        <Dialog 
                            open={showTopupModal} 
                            onClose={() => !actionLoading && setShowTopupModal(false)}
                            PaperProps={{
                                style: { borderRadius: '24px', padding: '16px', maxWidth: '400px', width: '100%' }
                            }}
                        >
                            <DialogTitle className="font-black text-xl text-center pb-2 pt-4">
                                Replenish Credit Pool
                            </DialogTitle>
                            <DialogContent>
                                <p className="text-xs font-bold text-slate-500 text-center mb-6">
                                    Add funds to the global Obsidian Interest-Free Credit Line pool via Razorpay.
                                </p>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    type="number"
                                    label="Topup Amount (₹)"
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '16px',
                                            fontWeight: 800,
                                        }
                                    }}
                                />
                                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                    <div className="flex gap-3">
                                        <Info className="w-5 h-5 text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-amber-800 leading-relaxed">
                                            Minimum allowed transaction is ₹1,00,00,000 (1 Crore). This ensures sufficient liquidity for the Obsidian VIP segment.
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                            <DialogActions className="px-6 pb-6 pt-2 flex flex-col gap-3">
                                <Button 
                                    fullWidth
                                    onClick={handleTopup} 
                                    disabled={actionLoading}
                                    variant="contained"
                                    sx={{ 
                                        borderRadius: '16px', 
                                        padding: '12px',
                                        bgcolor: '#d97706',
                                        '&:hover': { bgcolor: '#b45309' },
                                        fontWeight: 900,
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'PROCEED TO RAZORPAY'}
                                </Button>
                                <Button 
                                    fullWidth
                                    onClick={() => setShowTopupModal(false)} 
                                    disabled={actionLoading}
                                    sx={{ 
                                        borderRadius: '16px', 
                                        color: '#64748b',
                                        fontWeight: 800
                                    }}
                                >
                                    Cancel
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </div>
                )}

                {/* Filters & Control Hub */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-900 rounded-xl text-white">
                            <FilterIcon size={16} />
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Silver', 'Gold', 'Platinum', 'Obsidian'].map((plan) => (
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
                                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                                                                sub.status === 'Active' ? 'bg-emerald-100 text-emerald-600' :
                                                                sub.status === 'Revoked' ? 'bg-rose-100 text-rose-600' : 
                                                                sub.status === 'Pending' ? 'bg-amber-100 text-amber-600 border border-amber-200 animate-pulse' :
                                                                sub.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {sub.status}
                                                            </span>
                                                            {sub.status === 'Active' && (() => {
                                                                const risk = calculateChurnRisk(sub);
                                                                if (risk.score >= 35) {
                                                                    return (
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight flex items-center gap-0.5 ${
                                                                            risk.level === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                                        }`}>
                                                                                {risk.isAI ? "🤖" : "⚠️"} {risk.score}% Risk
                                                                        </span>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                            {sub.status === 'Revoked' && (
                                                                <p className="text-[9px] font-bold text-rose-400 italic max-w-[120px] truncate" title={sub.cancellationReason}>
                                                                    {sub.cancellationReason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {sub.status === 'Pending' && sub.plan === 'Obsidian' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApproveClick(sub)}
                                                                        className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                                                                        title="Approve Obsidian Pass"
                                                                    >
                                                                        <CheckIcon fontSize="small" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRejectClick(sub)}
                                                                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                                                                        title="Reject Obsidian Pass"
                                                                    >
                                                                        <XCircle size={18} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleGiftClick(sub.userId?._id, sub.userId?.name)}
                                                                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                                                                        title="Gift Subscription"
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
                                                                        title="Revoke Subscription"
                                                                    >
                                                                        <XCircle size={18} />
                                                                    </button>
                                                                </>
                                                            )}
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
                                : selectedUser 
                                    ? `You are gifting a complimentary subscription to ${selectedUser.name}.`
                                    : "Select a user to grant a complimentary premium subscription."}
                        </Typography>

                        {!giftToAll && !selectedUser && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" fontWeight={900} color="#94a3b8" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>Search User</Typography>
                                <Autocomplete
                                    options={users || []}
                                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                                    onChange={(event, newValue) => {
                                        setSelectedUser(newValue ? { id: newValue._id, name: newValue.name } : null);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Type name or email..."
                                            variant="outlined"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar src={option.image} sx={{ width: 32, height: 32, borderRadius: 1.5 }} />
                                                <Box>
                                                    <Typography variant="body2" fontWeight={800}>{option.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                                                </Box>
                                            </Box>
                                        </li>
                                    )}
                                />
                            </Box>
                        )}

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

                {/* Outreach Dialog */}
                <Dialog
                    open={openOutreachDialog}
                    onClose={() => !sendingOutreach && setOpenOutreachDialog(false)}
                    PaperProps={{
                        sx: { borderRadius: 5, width: '100%', maxWidth: 560, p: 1 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 900, color: '#1e293b', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Mail className="text-violet-600" size={20} />
                            Retention Outreach Campaign
                        </div>
                        {outreachUser?.aiCustomized && (
                            <span style={{
                                fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                color: 'white', padding: '3px 10px', borderRadius: 999,
                                display: 'flex', alignItems: 'center', gap: 4
                            }}>
                                🤖 AI Personalized
                            </span>
                        )}
                    </DialogTitle>
                    <DialogContent>
                        {/* Subscription Status Context Card */}
                        <Box sx={{
                            mb: 2.5, p: 2, borderRadius: 3,
                            background: outreachUser?.riskLevel === 'High'
                                ? 'linear-gradient(135deg, #fef2f2, #fff1f2)'
                                : outreachUser?.riskLevel === 'Medium'
                                    ? 'linear-gradient(135deg, #fffbeb, #fef9c3)'
                                    : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                            border: outreachUser?.riskLevel === 'High' ? '1px solid #fecaca'
                                : outreachUser?.riskLevel === 'Medium' ? '1px solid #fde68a'
                                : '1px solid #bbf7d0'
                        }}>
                            <Typography variant="caption" fontWeight={900} color="#94a3b8"
                                sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', mb: 1.5 }}>
                                📊 Subscription Intelligence
                                {outreachUser?.isAI && (
                                    <span style={{ marginLeft: 8, fontSize: '8px', background: '#7c3aed', color: 'white', padding: '1px 6px', borderRadius: 999 }}>Kimi K2.6</span>
                                )}
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={900} color="#1e293b">{outreachUser?.plan}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>Plan Tier</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={900}
                                        color={outreachUser?.diffDays <= 7 ? '#ef4444' : outreachUser?.diffDays <= 15 ? '#f59e0b' : '#1e293b'}>
                                        {outreachUser?.diffDays > 0 ? `${outreachUser?.diffDays}d` : 'Expired'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>Days Left</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" fontWeight={900}
                                        color={outreachUser?.recentBookings === 0 ? '#ef4444' : '#1e293b'}>
                                        {outreachUser?.recentBookings ?? '—'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>Bookings/30d</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                                        background: outreachUser?.riskLevel === 'High' ? '#ef4444' : outreachUser?.riskLevel === 'Medium' ? '#f59e0b' : '#10b981',
                                        animation: outreachUser?.riskLevel === 'High' ? 'pulse 1s infinite' : 'none'
                                    }} />
                                    <Typography variant="caption" fontWeight={900}
                                        color={outreachUser?.riskLevel === 'High' ? '#dc2626' : outreachUser?.riskLevel === 'Medium' ? '#d97706' : '#16a34a'}>
                                        {outreachUser?.riskScore}% Churn Risk · {outreachUser?.riskLevel}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" fontWeight={700} color={outreachUser?.isAutoRenew ? '#16a34a' : '#dc2626'}>
                                    Auto-Renew: {outreachUser?.isAutoRenew ? '✅ On' : '❌ Off'}
                                </Typography>
                            </Box>
                            {/* AI recommendation notice */}
                            <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)', border: '1px dashed #e2e8f0' }}>
                                <Typography variant="caption" fontWeight={800} color="#64748b" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {outreachUser?.riskLevel === 'High'
                                        ? '🎁 AI Recommendation: Complimentary Wellness Checkup (FREEWELLNESS) — High churn risk detected'
                                        : outreachUser?.riskLevel === 'Medium'
                                            ? '🏷️ AI Recommendation: 15% Loyalty Discount (HEALTHYPET15) — Medium risk, re-engagement likely'
                                            : '✉️ Custom outreach — Low risk subscriber, no coupon recommended'}
                                </Typography>
                            </Box>
                        </Box>

                        <FormControl fullWidth sx={{ mb: 2.5 }}>
                            <InputLabel id="template-label" sx={{ fontWeight: 700 }}>Outreach Template</InputLabel>
                            <Select
                                labelId="template-label"
                                value={outreachTemplate}
                                label="Outreach Template"
                                onChange={(e) => handleTemplateChange(e.target.value, outreachUser?.name, outreachUser?.plan)}
                                sx={{ borderRadius: 3 }}
                            >
                                <MenuItem
                                    value="discount"
                                    disabled={outreachUser?.riskScore < 35}
                                    sx={{ fontWeight: 600 }}
                                >
                                    🏷️ 15% Loyalty Discount (HEALTHYPET15){outreachUser?.riskScore < 35 ? ' — Ineligible (Low Risk)' : outreachUser?.riskLevel === 'Medium' ? ' ✨ Recommended' : ''}
                                </MenuItem>
                                <MenuItem
                                    value="wellness"
                                    disabled={outreachUser?.riskScore < 65}
                                    sx={{ fontWeight: 600 }}
                                >
                                    🎁 Free Wellness Checkup (FREEWELLNESS){outreachUser?.riskScore < 65 ? ' — Requires High Risk' : ' ✨ Recommended'}
                                </MenuItem>
                                <MenuItem value="custom" sx={{ fontWeight: 600 }}>✉️ Custom Email (Blank Slate)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Email Subject"
                            value={outreachSubject}
                            onChange={(e) => setOutreachSubject(e.target.value)}
                            sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            label={outreachUser?.aiCustomized ? '🤖 AI-Generated Message (Editable)' : 'Message Body'}
                            value={outreachMessage}
                            onChange={(e) => setOutreachMessage(e.target.value)}
                            sx={{
                                mb: 1,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    ...(outreachUser?.aiCustomized && {
                                        background: 'linear-gradient(135deg, #faf5ff, #eff6ff)'
                                    })
                                }
                            }}
                        />
                        {outreachUser?.aiCustomized && (
                            <Typography variant="caption" color="#7c3aed" fontWeight={700}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                🤖 This message was personalized by Kimi K2.6 based on {outreachUser?.name}'s {outreachUser?.plan} plan and usage patterns.
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1.5 }}>
                        <Button
                            onClick={() => setOpenOutreachDialog(false)}
                            disabled={sendingOutreach}
                            sx={{ fontWeight: 800, color: '#64748b', borderRadius: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={sendOutreachEmailHandler}
                            variant="contained"
                            disabled={!outreachSubject || !outreachMessage || sendingOutreach}
                            startIcon={sendingOutreach ? <CircularProgress size={20} color="inherit" /> : <Mail size={16} />}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 2,
                                px: 3,
                                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                '&:hover': { background: 'linear-gradient(135deg, #6d28d9, #4338ca)' },
                                boxShadow: '0 4px 12px rgba(124, 92, 237, 0.3)'
                            }}
                        >
                            {sendingOutreach ? 'Sending...' : outreachUser?.aiCustomized ? '🤖 Send AI Outreach' : 'Send Outreach'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Approve Obsidian Dialog */}
                <Dialog
                    open={openApproveDialog}
                    onClose={() => !processingObsidian && setOpenApproveDialog(false)}
                    PaperProps={{
                        sx: { borderRadius: 4, width: '100%', maxWidth: 450, p: 1 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 900, color: '#1e293b', pb: 1 }}>
                        Approve Obsidian Signature Pass
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                            Are you sure you want to approve the Obsidian Signature Pass request for <strong>{selectedSub?.userId?.name}</strong>?
                            <br /><br />
                            This will accept the request and open a <strong>24-hour payment window</strong> for the amount of <strong>{formatCurrency(selectedSub?.amount)}</strong>. An email notification will be sent to the user with the payment checkout link.
                        </Typography>

                        {loadingAiAudit ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3, gap: 1 }}>
                                <CircularProgress size={24} color="secondary" />
                                <Typography variant="caption" color="text.secondary">Running Real-time AI Profile & Behavior Audit...</Typography>
                            </Box>
                        ) : aiAuditReport ? (
                            <Box sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: 3,
                                backgroundColor: '#18181b',
                                color: '#f4f4f5',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                border: '1px solid #3f3f46',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                <Typography variant="subtitle2" sx={{ color: '#D4AF37', fontWeight: 900, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    🤖 AI Audit Report & Recommendation
                                </Typography>
                                {aiAuditReport}
                            </Box>
                        ) : null}
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1.5 }}>
                        <Button
                            onClick={() => setOpenApproveDialog(false)}
                            disabled={processingObsidian}
                            sx={{ fontWeight: 800, color: '#64748b', borderRadius: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmApproveObsidian}
                            variant="contained"
                            color="success"
                            disabled={processingObsidian}
                            startIcon={processingObsidian ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 2,
                                px: 3,
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                            }}
                        >
                            {processingObsidian ? "Approving..." : "Approve Pass"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Reject Obsidian Dialog */}
                <Dialog
                    open={openRejectDialog}
                    onClose={() => !processingObsidian && setOpenRejectDialog(false)}
                    PaperProps={{
                        sx: { borderRadius: 4, width: '100%', maxWidth: 450, p: 1 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 900, color: '#1e293b', pb: 1 }}>
                        Reject Obsidian Signature Pass
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
                            Are you sure you want to reject the Obsidian Signature Pass request for <strong>{selectedSub?.userId?.name}</strong>?
                        </Typography>

                        <TextField
                            autoFocus
                            fullWidth
                            label="Reason for Rejection"
                            placeholder="e.g., Insufficient funds, Request mismatch..."
                            variant="outlined"
                            multiline
                            rows={3}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            required
                            error={!rejectReason && processingObsidian}
                            helperText={!rejectReason && processingObsidian ? "Reason is mandatory" : ""}
                            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 2, gap: 1.5 }}>
                        <Button
                            onClick={() => setOpenRejectDialog(false)}
                            disabled={processingObsidian}
                            sx={{ fontWeight: 800, color: '#64748b', borderRadius: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmRejectObsidian}
                            variant="contained"
                            color="error"
                            disabled={!rejectReason || processingObsidian}
                            startIcon={processingObsidian ? <CircularProgress size={20} color="inherit" /> : <XCircle size={16} />}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 2,
                                px: 3,
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            {processingObsidian ? "Rejecting..." : "Reject Pass"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
};

export default AllSubscriptions;
