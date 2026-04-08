import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Avatar, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, Chip, TextField,
    InputAdornment, Grid, Card, CardContent, Tooltip, CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    Payment as PaymentIcon,
    AccountBalanceWallet as WalletIcon,
    MoneyOff as RefundIcon,
    Receipt as ReceiptIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const PaymentDetails = () => {
    const { getPaymentUsers, getUserPaymentDetails } = useContext(AdminContext);

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getPaymentUsers();
        if (data.success) {
            setUsers(data.users);
            applyFilters(data.users, searchQuery, startDate, endDate);
        }
        setLoading(false);
    };

    const applyFilters = (allUsers, query, start, end) => {
        let filtered = [...allUsers];

        if (query) {
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(query.toLowerCase()) ||
                u.email.toLowerCase().includes(query.toLowerCase()) ||
                u.phone.includes(query)
            );
        }

        if (start || end) {
            filtered = filtered.filter(u => {
                const lastPay = new Date(u.lastPaymentDate);
                const isAfterStart = start ? lastPay >= new Date(start) : true;
                const isBeforeEnd = end ? lastPay <= new Date(end) : true;
                return isAfterStart && isBeforeEnd;
            });
        }

        setFilteredUsers(filtered);
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        applyFilters(users, query, startDate, endDate);
    };

    const handleDateChange = (type, value) => {
        if (type === 'start') {
            setStartDate(value);
            applyFilters(users, searchQuery, value, endDate);
        } else {
            setEndDate(value);
            applyFilters(users, searchQuery, startDate, value);
        }
    };

    const handleViewDetails = async (userId) => {
        setDetailsLoading(true);
        setDetailsDialogOpen(true);
        const data = await getUserPaymentDetails(userId);
        if (data.success) {
            setSelectedUser(data);
        } else {
            setDetailsDialogOpen(false);
        }
        setDetailsLoading(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const getFilteredRecords = () => {
        if (!selectedUser) return [];
        return selectedUser.paymentRecords.filter(record => {
            const payDate = new Date(record.date);
            const isAfterStart = startDate ? payDate >= new Date(startDate) : true;
            const isBeforeEnd = endDate ? payDate <= new Date(endDate) : true;
            return isAfterStart && isBeforeEnd;
        });
    };

    const getChartData = () => {
        const records = getFilteredRecords();
        let onlinePaid = 0;
        let cashPaid = 0;
        let walletPaid = 0;

        records.forEach(record => {
            if (!record.cancelled) {
                walletPaid += record.walletDeduction;
                if (record.paymentMethod === 'Cash') {
                    cashPaid += record.netOnlinePaid;
                } else {
                    onlinePaid += record.netOnlinePaid;
                }
            }
        });

        return [
            { name: 'Online / Card', Amount: onlinePaid, color: '#14b8a6' },
            { name: 'Wallet', Amount: walletPaid, color: '#f59e0b' },
            { name: 'Cash', Amount: cashPaid, color: '#3b82f6' }
        ];
    };

    return (
        <Box sx={{ p: 3, pb: 10 }}>
            {/* Header section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 4, gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
                        Payment Analytics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Track revenue and payment distribution across users.</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        type="date"
                        label="From"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                    <TextField
                        type="date"
                        label="To"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => handleDateChange('end', e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                    <TextField
                        placeholder="Search user..."
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearch}
                        sx={{ width: { xs: '100%', sm: 250 }, bgcolor: 'white', borderRadius: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </Box>

            {/* Main Table */}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Contact</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }} align="center">Total Paid (Online)</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }} align="center">Wallet Used</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }} align="center">Transactions</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }} align="center">Last Payment</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        <Typography variant="body1">No payment records found for the selected criteria.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.userId} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar src={user.image} alt={user.name} />
                                                <Box>
                                                    <Typography variant="subtitle2">{user.name}</Typography>
                                                    {user.pawWallet > 0 && (
                                                        <Chip
                                                            label={`Wallet: ${formatCurrency(user.pawWallet)}`}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                            sx={{ height: 20, mt: 0.5, fontSize: '0.65rem' }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{user.email}</Typography>
                                            <Typography variant="caption" color="text.secondary">{user.phone}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="subtitle2" color="primary.main">
                                                {formatCurrency(user.netOnlinePaid)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" color="warning.main">
                                                {formatCurrency(user.totalWalletUsed)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={user.totalTransactions} size="small" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                {new Date(user.lastPaymentDate).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="View Detailed History">
                                                <IconButton color="primary" onClick={() => handleViewDetails(user.userId)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </TableContainer>

            {/* Details Dialog */}
            <Dialog
                open={detailsDialogOpen}
                onClose={() => setDetailsDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">User Payment History</Typography>
                        {selectedUser?.user && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Avatar src={selectedUser.user.image} sx={{ width: 32, height: 32 }} />
                                <Typography variant="subtitle2">{selectedUser.user.name}</Typography>
                            </Box>
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ bgcolor: '#f3f4f6' }}>
                    {detailsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : selectedUser ? (
                        <Box>
                            {/* Summary Cards */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                        <CardContent>
                                            <Box display='flex' alignItems='center' gap={1} mb={1}>
                                                <PaymentIcon color="primary" />
                                                <Typography variant="subtitle2" color="text.secondary">Net Online Paid</Typography>
                                            </Box>
                                            <Typography variant="h5" color="primary.main">
                                                {formatCurrency(selectedUser.stats.totalOnlinePaid)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                        <CardContent>
                                            <Box display='flex' alignItems='center' gap={1} mb={1}>
                                                <WalletIcon color="warning" />
                                                <Typography variant="subtitle2" color="text.secondary">Wallet Used</Typography>
                                            </Box>
                                            <Typography variant="h5" color="warning.main">
                                                {formatCurrency(selectedUser.stats.totalWalletUsed)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                        <CardContent>
                                            <Box display='flex' alignItems='center' gap={1} mb={1}>
                                                <ReceiptIcon color="success" />
                                                <Typography variant="subtitle2" color="text.secondary">Total Value</Typography>
                                            </Box>
                                            <Typography variant="h5">
                                                {formatCurrency(selectedUser.stats.totalAmount)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card elevation={0} sx={{ border: '1px solid #e5e7eb' }}>
                                        <CardContent>
                                            <Box display='flex' alignItems='center' gap={1} mb={1}>
                                                <RefundIcon color="error" />
                                                <Typography variant="subtitle2" color="text.secondary">Transactions</Typography>
                                            </Box>
                                            <Box display='flex' alignItems='center' gap={1}>
                                                <Typography variant="h5">{selectedUser.stats.totalTransactions}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ({selectedUser.stats.cancelledCount} cancelled)
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Distribution Chart */}
                            <Typography variant="subtitle1" fontWeight={600} mb={2}>Payment Distribution</Typography>
                            <Card elevation={0} sx={{ border: '1px solid #e5e7eb', mb: 3, pt: 2, pb: 1, px: 2 }}>
                                <Box sx={{ height: 260, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <defs>
                                                {/* Pattern for Online / Card (Diagonal Stripes) */}
                                                <pattern id="patternOnline" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                    <rect width="8" height="8" fill="#14b8a6" fillOpacity={0.15} />
                                                    <line x1="0" y1="0" x2="0" y2="8" stroke="#0d9488" strokeWidth="2" />
                                                </pattern>
                                                {/* Pattern for Wallet (Dots) */}
                                                <pattern id="patternWallet" patternUnits="userSpaceOnUse" width="10" height="10">
                                                    <rect width="10" height="10" fill="#f59e0b" fillOpacity={0.15} />
                                                    <circle cx="2" cy="2" r="2" fill="#d97706" />
                                                    <circle cx="7" cy="7" r="2" fill="#d97706" />
                                                </pattern>
                                                {/* Pattern for Cash (Crosshatch) */}
                                                <pattern id="patternCash" patternUnits="userSpaceOnUse" width="10" height="10">
                                                    <rect width="10" height="10" fill="#3b82f6" fillOpacity={0.15} />
                                                    <path d="M 0 5 L 10 5 M 5 0 L 5 10" stroke="#2563eb" strokeWidth="1" opacity={0.5} />
                                                </pattern>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontWeight: 500 }} />
                                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} tick={{ fill: '#4b5563' }} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f3f4f6' }}
                                                formatter={(value) => [formatCurrency(value), 'Amount Paid']}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="Amount" radius={[4, 4, 0, 0]} maxBarSize={70}>
                                                {getChartData().map((entry, index) => {
                                                    const type = entry.name === 'Online / Card' ? 'Online' : entry.name === 'Wallet' ? 'Wallet' : 'Cash';
                                                    const strokeColors = { Online: '#0d9488', Wallet: '#d97706', Cash: '#2563eb' };
                                                    return (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={`url(#pattern${type})`}
                                                            stroke={strokeColors[type]}
                                                            strokeWidth={1.5}
                                                        />
                                                    );
                                                })}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card>

                            {/* Detailed List */}
                            <Typography variant="subtitle1" fontWeight={600} mb={2}>Transaction Details</Typography>
                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Doctor / Transaction Info</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Total Fee</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Wallet Used</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Online Paid</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {getFilteredRecords().map((record, idx) => (
                                                <TableRow
                                                    component={motion.tr}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: record.cancelled ? 0.6 : 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    key={record.appointmentId}
                                                    sx={{ '&:hover': { bgcolor: '#f9fafb' } }}
                                                >
                                                    <TableCell>
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{record.doctorName}</Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">{record.doctorSpeciality}</Typography>
                                                        {record.razorpayPaymentId && (
                                                            <Box sx={{ mt: 0.5 }}>
                                                                <Tooltip title={`Payment ID: ${record.razorpayPaymentId}`}>
                                                                    <Typography variant="caption" sx={{
                                                                        fontFamily: 'monospace',
                                                                        bgcolor: '#f1f5f9',
                                                                        px: 0.5,
                                                                        borderRadius: 0.5,
                                                                        color: '#475569',
                                                                        fontSize: '10px'
                                                                    }}>
                                                                        TXN: {record.razorpayPaymentId.slice(0, 10)}...
                                                                    </Typography>
                                                                </Tooltip>
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(record.originalFee)}</TableCell>
                                                    <TableCell sx={{ color: record.walletDeduction > 0 ? "warning.main" : "inherit" }}>
                                                        {formatCurrency(record.walletDeduction)}
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: record.netOnlinePaid > 0 ? 600 : 400, color: record.netOnlinePaid > 0 ? 'primary.main' : 'inherit' }}>
                                                        {formatCurrency(record.netOnlinePaid)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={record.paymentMethod}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderColor: record.paymentMethod === 'Razorpay' ? '#cbd5e1' : 'transparent',
                                                                bgcolor: record.paymentMethod === 'Razorpay' ? '#f8fafc' : '#f1f5f9',
                                                                fontSize: '11px',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {record.cancelled ? (
                                                            <Chip icon={<CancelIcon />} label="Cancelled" size="small" color="error" />
                                                        ) : record.isCompleted ? (
                                                            <Chip icon={<CheckCircleIcon />} label="Completed" size="small" color="success" />
                                                        ) : (
                                                            <Chip label="Upcoming" size="small" color="primary" />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ) : (
                        <Typography color="error">Failed to load user details.</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f9fafb' }}>
                    <Button onClick={() => setDetailsDialogOpen(false)} variant="outlined">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentDetails;
