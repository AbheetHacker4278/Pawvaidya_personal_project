import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { 
    Wallet, 
    CreditCard, 
    TrendingUp, 
    TrendingDown, 
    Calendar, 
    User, 
    Stethoscope, 
    Tag, 
    Info, 
    ArrowUpRight,
    Search,
    Filter,
    Download,
    Percent,
    Gift,
    Star,
    Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const FinancialCalculations = () => {
    const { atoken, backendurl } = useContext(AdminContext);
    const [financeData, setFinanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('bookings');

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendurl}/api/admin/financial-calculations`, {
                headers: { atoken }
            });
            if (data.success) {
                setFinanceData(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to fetch financial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (atoken) {
            fetchFinanceData();
        }
    }, [atoken]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const summary = financeData?.summary || {};
    const filteredBreakdown = financeData?.breakdown?.filter(item => 
        item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="p-6 lg:p-10 bg-slate-50 min-h-screen space-y-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Financial Calculations</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        Real-time Treasury & Loss Analysis
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchFinanceData}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <TrendingUp size={20} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                        <Download size={16} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <SummaryCard 
                    title="Total Treasury" 
                    amount={summary.totalEarnings} 
                    icon={<Wallet className="text-emerald-500" />} 
                    color="emerald"
                    subtitle="Gross Bookings + Subscriptions"
                />
                <SummaryCard 
                    title="Booking Revenue" 
                    amount={summary.bookingEarnings} 
                    icon={<Stethoscope className="text-emerald-500" />} 
                    color="emerald"
                    subtitle="Earnings from Appointments"
                />
                <SummaryCard 
                    title="Subscription Rev" 
                    amount={summary.subscriptionEarnings} 
                    icon={<CreditCard className="text-blue-500" />} 
                    color="blue"
                    subtitle="Membership Revenue"
                />
                <SummaryCard 
                    title="Promotional Loss" 
                    amount={summary.adminCouponLoss} 
                    icon={<TrendingDown className="text-rose-500" />} 
                    color="rose"
                    subtitle="Loss via Active Coupons"
                />
                <SummaryCard 
                    title="Gifted Subs Loss" 
                    amount={summary.giftedSubscriptionLoss} 
                    icon={<Gift className="text-amber-500" />} 
                    color="amber"
                    subtitle="Value of Free Memberships"
                />
            </div>

            {/* Middle Section: Active Discounts Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Discounts Analysis */}
                <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Discounts</h2>
                        <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                            <Tag size={20} />
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Admin Created</p>
                                <p className="text-3xl font-black text-emerald-900">{financeData?.discounts?.activeAdminCount || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                <Shield size={24} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Doctor Created</p>
                                <p className="text-3xl font-black text-blue-900">{financeData?.discounts?.activeDoctorCount || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Stethoscope size={24} />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <div className="flex items-center gap-3 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                <Info size={18} />
                                <p className="text-[10px] font-black uppercase tracking-wide leading-relaxed">
                                    Current active campaigns are incurring a continuous loss of ₹{(summary.adminCouponLoss || 0).toLocaleString()} until expiry.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coupons List */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
                    <div className="p-8 border-b border-slate-50">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Admin Campaigns</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Coupon Code</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Benefit</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Expires</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(financeData?.discounts?.adminCoupons || []).map((coupon, i) => (
                                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-xs uppercase tracking-widest">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700 text-sm">
                                                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT`}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-slate-500 uppercase">
                                                {new Date(coupon.expiry).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }} />
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{coupon.used} REDEMPTIONS</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detailed Transaction Breakdown */}
            <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-2xl shadow-slate-200/40">
                <div className="p-10 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Granular breakdown of all earnings and deductions</p>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search ledger..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all outline-none w-full md:w-80 font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                        <button 
                            onClick={() => setActiveTab('bookings')}
                            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Booking Ledger
                        </button>
                        <button 
                            onClick={() => setActiveTab('subscriptions')}
                            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'subscriptions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Subscription Ledger
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'bookings' ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Customer</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Booking Value</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Discounts</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Final Earning</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Payment</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Date & Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredBreakdown.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm tracking-tight">{item.user}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">to Dr. {item.doctor}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-slate-700 tracking-tight">₹{item.originalFee.toLocaleString()}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            {item.discount || item.adminDiscount > 0 ? (
                                                <div className="space-y-1">
                                                    {item.discount && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-tighter border border-blue-100">
                                                            Doc: {item.discount.code}
                                                        </span>
                                                    )}
                                                    {item.adminDiscount > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[9px] font-black uppercase tracking-tighter border border-rose-100 ml-1">
                                                            Admin: -₹{item.adminDiscount}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No Offer</p>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-black text-emerald-600 tracking-tight flex items-center gap-1">
                                                ₹{item.finalFee.toLocaleString()}
                                                <ArrowUpRight size={14} className="opacity-40" />
                                            </p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${item.paymentMethod.toLowerCase() === 'cash' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                <p className="text-xs font-bold text-slate-600 capitalize">{item.paymentMethod}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-[10px] font-black text-slate-500 tracking-tight leading-relaxed">
                                                {new Date(item.timestamp).toLocaleDateString()}<br/>
                                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80">
                                <tr>
                                    <td className="px-10 py-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Summary</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-slate-800">
                                            ₹{(financeData?.breakdown || []).reduce((acc, item) => acc + (item.originalFee || 0), 0).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-rose-600">
                                            -₹{(financeData?.breakdown || []).reduce((acc, item) => acc + (item.adminDiscount || 0), 0).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-10 py-6" colSpan={3}>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Booking Earnings:</p>
                                            <p className="text-xl font-black text-emerald-600 tracking-tighter">
                                                ₹{(summary?.bookingEarnings || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Plan Type</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Sale Amount</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Refunds</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Net Revenue</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Status</th>
                                    <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(financeData?.subscriptionBreakdown || []).filter(sub => 
                                    sub.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    sub.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((sub, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                                                    <Star size={18} />
                                                </div>
                                                <p className="font-black text-slate-800 text-sm tracking-tight">{sub.plan} Membership</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 font-bold text-slate-700 text-sm">₹{(sub.amount || 0).toLocaleString()}</td>
                                        <td className="px-10 py-8 font-bold text-rose-500 text-sm">{sub.refundAmount > 0 ? `-₹${sub.refundAmount.toLocaleString()}` : '₹0'}</td>
                                        <td className="px-10 py-8 font-black text-blue-600 text-sm">₹{(sub.netAmount || 0).toLocaleString()}</td>
                                        <td className="px-10 py-8">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                sub.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                                                sub.status === 'Expired' ? 'bg-slate-100 text-slate-600' : 
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase">
                                            {new Date(sub.timestamp).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80">
                                <tr>
                                    <td className="px-10 py-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Summary</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-slate-800">
                                            ₹{(financeData?.subscriptionBreakdown || []).reduce((acc, sub) => acc + (sub.amount || 0), 0).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-sm font-black text-rose-600">
                                            -₹{(financeData?.subscriptionBreakdown || []).reduce((acc, sub) => acc + (sub.refundAmount || 0), 0).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-10 py-6" colSpan={3}>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Subscription Earnings:</p>
                                            <p className="text-xl font-black text-blue-600 tracking-tighter">
                                                ₹{(summary?.subscriptionEarnings || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ title, amount, icon, color, subtitle }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 group"
    >
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 bg-${color}-50 rounded-3xl group-hover:scale-110 transition-transform duration-500`}>
                {icon}
            </div>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Live View</span>
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
                ₹{amount?.toLocaleString() || '0'}
            </h3>
            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                <Info size={12} className="text-slate-300" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
    </motion.div>
);

export default FinancialCalculations;
