import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import BanUserDialog from '../../components/BanUserDialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Card,
    Typography,
    Grid,
    Avatar,
    Box,
    Divider,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    IconButton,
    Tabs,
    Tab,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Badge,
    Tooltip
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import HistoryIcon from '@mui/icons-material/History';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PetsIcon from '@mui/icons-material/Pets';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import FaceIcon from '@mui/icons-material/Face';

import { assets } from '../../assets/assets_admin/assets';

const TotalUsers = () => {
    const { users, getallusers, dashdata, getdashdata, deleteUser, editUser, getUsersWithPasswords, getActivityLogs, getRealtimeActivityLogs, sendVerificationEmail, sendIndividualEmail, banUser, unbanUser, blacklistEmails } = useContext(AdminContext);
    const [selectedState, setSelectedState] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    // State for edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gender: '',
        full_address: '',
        pet_type: '',
        breed: '',
        category: '',
        pet_age: '',
        pet_gender: ''
    });
    const [userImage, setUserImage] = useState(null);

    // State for delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // State for view details dialog
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedUserDetails, setSelectedUserDetails] = useState(null);
    const [userDetailsLoading, setUserDetailsLoading] = useState(false);
    const [activityLogs, setActivityLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [detailsTab, setDetailsTab] = useState(0);
    const [highlightedPetId, setHighlightedPetId] = useState(null);

    // State for sending verification email
    const [sendingEmail, setSendingEmail] = useState(null);

    // State for ban dialog
    const [banDialogOpen, setBanDialogOpen] = useState(false);
    const [userToBan, setUserToBan] = useState(null);
    const [defaultBanIp, setDefaultBanIp] = useState(false);

    // State for email dialog
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailTargetUser, setEmailTargetUser] = useState(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailAttachments, setEmailAttachments] = useState([]);
    const [sendingIndividualEmail, setSendingIndividualEmail] = useState(false);

    const handleOpenEmailDialog = (user) => {
        setEmailTargetUser(user);
        setEmailSubject('');
        setEmailMessage('');
        setEmailAttachments([]);
        setEmailDialogOpen(true);
    };

    const handleCloseEmailDialog = () => {
        setEmailDialogOpen(false);
        setEmailTargetUser(null);
    };

    const handleEmailFileChange = (e) => {
        setEmailAttachments(Array.from(e.target.files));
    };

    const handleSendEmailSubmit = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) {
            alert('Please fill in subject and message');
            return;
        }

        setSendingIndividualEmail(true);
        const formData = new FormData();
        formData.append('email', emailTargetUser.email);
        formData.append('subject', emailSubject);
        formData.append('message', emailMessage);

        emailAttachments.forEach(file => {
            formData.append('attachments', file);
        });

        const success = await sendIndividualEmail(formData);
        setSendingIndividualEmail(false);

        if (success) {
            handleCloseEmailDialog();
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return null;
        let birthDate;

        // Handle DD_MM_YYYY format
        if (typeof dob === 'string' && dob.includes('_')) {
            const parts = dob.split('_');
            if (parts.length === 3) {
                // new Date(year, monthIndex, day)
                birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
        } else {
            birthDate = new Date(dob);
        }

        if (isNaN(birthDate.getTime())) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatCurrency = (amount) => {
        const val = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    useEffect(() => {
        getallusers();
        getdashdata();
    }, []);

    const handleStateChange = (event) => {
        setSelectedState(event.target.value);
        setSelectedUsers([]); // Clear selection when filter changes
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedUsers(filteredUsers.map(user => user.email));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (email) => {
        setSelectedUsers(prev =>
            prev.includes(email)
                ? prev.filter(e => e !== email)
                : [...prev, email]
        );
    };

    const handleBulkBlacklist = async () => {
        if (selectedUsers.length === 0) return;

        if (window.confirm(`Are you sure you want to blacklist ${selectedUsers.length} email(s)? This will prevent them from registering again.`)) {
            const success = await blacklistEmails(selectedUsers, 'user', 'Bulk blacklisted by admin');
            if (success) {
                setSelectedUsers([]);
                getallusers();
            }
        }
    };

    const filteredUsers = selectedState
        ? users.filter((user) => user.address?.LOCATION?.toUpperCase() === selectedState)
        : users;

    const handleEditClick = (user) => {
        setCurrentUser(user);
        setUserFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            gender: user.gender || '',
            full_address: user.full_address || '',
            pet_type: user.pet_type || '',
            breed: user.breed || '',
            category: user.category || '',
            pet_age: user.pet_age || '',
            pet_gender: user.pet_gender || ''
        });
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setCurrentUser(null);
        setUserImage(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserFormData({
            ...userFormData,
            [name]: value
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUserImage(e.target.files[0]);
        }
    };

    const handleEditSubmit = () => {
        if (currentUser && currentUser._id) {
            editUser(currentUser._id, userFormData, userImage);
            handleEditDialogClose();
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete && userToDelete._id) {
            deleteUser(userToDelete._id);
            setDeleteDialogOpen(false);
        }
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    const handleViewDetails = async (user) => {
        setSelectedUserDetails(null);
        setActivityLogs([]);
        setDetailsDialogOpen(true);
        setDetailsTab(0);
        setUserDetailsLoading(true);

        try {
            const usersWithPasswords = await getUsersWithPasswords();
            const userDetails = usersWithPasswords.find(u => u._id === user._id);
            setSelectedUserDetails(userDetails || user);

            setLogsLoading(true);
            const logsData = await getActivityLogs(user._id, 'user', 50, 0);
            setActivityLogs(logsData.logs || []);
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setUserDetailsLoading(false);
            setLogsLoading(false);
        }
    };

    const handleDetailsDialogClose = () => {
        setDetailsDialogOpen(false);
        setSelectedUserDetails(null);
        setActivityLogs([]);
        setDetailsTab(0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleString();
    };


    const handleSendVerificationEmail = async (user) => {
        if (window.confirm(`Send email verification request to ${user.email}?`)) {
            setSendingEmail(user._id);
            try {
                const success = await sendVerificationEmail(user._id);
                if (success) {
                    getallusers();
                }
            } finally {
                setSendingEmail(null);
            }
        }
    };

    const handleBanUser = (user, banIp = false) => {
        setUserToBan(user);
        setDefaultBanIp(banIp);
        setBanDialogOpen(true);
    };

    const handleBanDialogClose = () => {
        setBanDialogOpen(false);
        setUserToBan(null);
        setDefaultBanIp(false);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
    };

    if (!dashdata) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2, flexDirection: 'column' }}>
                <CircularProgress sx={{ color: '#10b981', size: 50 }} />
                <Typography variant="body2" color="#64748b" fontWeight="600">Initializing User Management Hub...</Typography>
            </Box>
        );
    }

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh', bgcolor: '#f8fafc' }}
        >
            {/* Header Section */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h3" fontWeight="900" mb={1} color="#1e293b" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }, tracking: '-0.025em' }}>
                    User Management <span style={{ opacity: 0.6 }}>👥</span>
                </Typography>
                <Typography variant="body1" color="#64748b" mb={4} fontWeight="500">
                    Oversee pet owners, verify accounts, and manage network security.
                </Typography>

                {/* Controls Bar */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', lg: 'row' },
                        gap: 3,
                        alignItems: { lg: 'center' },
                        mb: 4,
                        bgcolor: 'white',
                        p: 3,
                        borderRadius: 4,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        border: '1px solid #f1f5f9'
                    }}
                >
                    <FormControl sx={{ width: { xs: '100%', lg: '300px' } }}>
                        <InputLabel id="state-select-label" sx={{ fontWeight: 600 }}>Filter by State</InputLabel>
                        <Select
                            labelId="state-select-label"
                            value={selectedState}
                            onChange={handleStateChange}
                            label="Filter by State"
                            sx={{
                                borderRadius: 3,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10b981' },
                            }}
                        >
                            <MenuItem value="">All States</MenuItem>
                            <MenuItem value="NEW DELHI">NEW DELHI</MenuItem>
                            <MenuItem value="GUJARAT">GUJARAT</MenuItem>
                            <MenuItem value="HARYANA">HARYANA</MenuItem>
                            <MenuItem value="MUMBAI">MUMBAI</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: '#f1f5f9',
                                px: 2,
                                py: 1.5,
                                borderRadius: 3,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: '#e2e8f0' }
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={handleSelectAll}
                                style={{ transform: 'scale(1.2)', marginRight: '12px', cursor: 'pointer' }}
                            />
                            <Typography variant="body2" fontWeight="700" color="#475569">
                                Select All ({selectedUsers.length})
                            </Typography>
                        </Box>

                        {selectedUsers.length > 0 && (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<BlockIcon />}
                                    onClick={handleBulkBlacklist}
                                    sx={{ borderRadius: 3, fontWeight: 'bold', py: 1.5, px: 3, boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}
                                >
                                    Blacklist Selected
                                </Button>
                            </motion.div>
                        )}

                        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                            <Card elevation={0} sx={{ bgcolor: '#ecfdf5', px: 2, py: 1, borderRadius: 2, border: '1px solid #d1fae5' }}>
                                <Typography variant="caption" color="#047857" fontWeight="700" sx={{ textTransform: 'uppercase' }}>Active Users</Typography>
                                <Typography variant="h6" color="#065f46" fontWeight="900">{filteredUsers.length}</Typography>
                            </Card>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {filteredUsers.length > 0 ? (
                <Grid
                    container
                    spacing={3}
                    component={motion.div}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {filteredUsers.map((user, index) => (
                        <Grid item xs={12} sm={6} lg={4} xl={3} key={user._id || index} component={motion.div} variants={itemVariants}>
                            <Card
                                sx={{
                                    height: '100%',
                                    p: 0,
                                    borderRadius: 7,
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.6)',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                        transform: 'translateY(-8px)',
                                        background: '#ffffff',
                                        '& .action-overlay': { opacity: 1, transform: 'translateY(0)' }
                                    },
                                }}
                            >
                                {/* Top Gradient Bar */}
                                <Box sx={{ h: 6, width: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }} />

                                <Box sx={{ p: 3, position: 'relative' }}>
                                    {/* Selection Checkbox - Custom Style */}
                                    <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
                                        <Box
                                            onClick={() => handleSelectUser(user.email)}
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                borderRadius: '6px',
                                                border: '2px solid',
                                                borderColor: selectedUsers.includes(user.email) ? '#10b981' : '#e2e8f0',
                                                bgcolor: selectedUsers.includes(user.email) ? '#10b981' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {selectedUsers.includes(user.email) && <CheckCircleIcon sx={{ fontSize: 14, color: 'white' }} />}
                                        </Box>
                                    </Box>

                                    {/* Status Badges - Top Right */}
                                    <Box sx={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 1, zIndex: 10 }}>
                                        {user.isOnline && (
                                            <Tooltip title="Currently Online">
                                                <Box sx={{
                                                    width: 10,
                                                    height: 10,
                                                    bgcolor: '#10b981',
                                                    borderRadius: '50%',
                                                    border: '2px solid white',
                                                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                                                    animation: 'pulse 2s infinite'
                                                }} />
                                            </Tooltip>
                                        )}
                                        {user.isBanned && (
                                            <Chip
                                                label="BANNED"
                                                size="small"
                                                sx={{
                                                    height: 16,
                                                    fontSize: '0.5rem',
                                                    fontWeight: 900,
                                                    bgcolor: '#fee2e2',
                                                    color: '#ef4444',
                                                    borderRadius: 1
                                                }}
                                            />
                                        )}
                                    </Box>

                                    {/* User Profile Header */}
                                    <Box display="flex" flexDirection="column" alignItems="center" mb={3} textAlign="center">
                                        <Box sx={{ position: 'relative', mb: 2 }}>
                                            <Avatar
                                                src={user.image || assets.people_icon}
                                                alt={user.name}
                                                sx={{
                                                    width: 96,
                                                    height: 96,
                                                    border: '4px solid white',
                                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                                                }}
                                            />
                                            {user.isAccountverified && (
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 4,
                                                        right: 4,
                                                        bgcolor: '#10b981',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: 24,
                                                        height: 24,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '2px solid white',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <VerifiedIcon sx={{ fontSize: 14 }} />
                                                </Box>
                                            )}
                                        </Box>

                                        <Typography variant="h6" fontWeight="900" color="#1e293b" sx={{ fontSize: '1.25rem', mb: 0.5, lineHeight: 1.2 }}>
                                            {user.name}
                                        </Typography>

                                        <Box display="flex" justifyContent="center" gap={1} mb={2}>
                                            <Chip
                                                label={user.isAccountverified ? 'Verified' : 'Unverified'}
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    bgcolor: user.isAccountverified ? '#dcfce7' : '#fff7ed',
                                                    color: user.isAccountverified ? '#15803d' : '#9a3412',
                                                    borderRadius: 1.5
                                                }}
                                            />
                                            {user.subscription && user.subscription.plan !== 'None' && (
                                                <Chip
                                                    label={user.subscription.plan}
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        background: user.subscription.plan === 'Platinum'
                                                            ? 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
                                                            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                                        color: user.subscription.plan === 'Platinum' ? '#7e22ce' : '#b45309',
                                                        borderRadius: 1.5,
                                                        border: '1px solid rgba(0,0,0,0.05)'
                                                    }}
                                                />
                                            )}
                                            {user.isFaceRegistered && (
                                                <Chip
                                                    icon={<FaceIcon style={{ fontSize: '0.8rem' }} />}
                                                    label="Face ID"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        bgcolor: '#e0e7ff',
                                                        color: '#4338ca',
                                                        borderRadius: 1.5,
                                                        '& .MuiChip-icon': { color: 'inherit' }
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        <Typography variant="body2" color="#64748b" fontWeight="600" sx={{ mb: 0.5 }}>
                                            {user.email}
                                        </Typography>
                                        <Typography variant="caption" color="#94a3b8" sx={{ fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                            {(user.gender && user.gender !== 'Not Selected') ? user.gender : 'Gender N/A'} • {user.dob ? `${calculateAge(user.dob)} YRS` : 'AGE UNKNOWN'}
                                        </Typography>
                                    </Box>

                                    {/* Stats Grid - Premium Glass Layout */}
                                    <Grid container spacing={1.5} sx={{ mb: 3 }}>
                                        {[
                                            { label: 'EVENTS', val: dashdata?.userAppointments?.find(ap => ap.userId === user._id)?.totalAppointments || 0, icon: <CalendarTodayIcon />, color: '#6366f1', bg: '#f5f7ff' },
                                            { label: 'WALLET', val: formatCurrency(user.pawWallet), icon: <AccountBalanceWalletIcon />, color: '#f59e0b', bg: '#fffbf0' },
                                            { label: 'CALLS', val: user.subscription?.plan === 'Platinum' || user.subscription?.plan === 'Gold' ? `${Math.max(0, (user.subscription.plan === 'Platinum' ? 25 : 10) - (user.videoCallsUsed || 0))}` : "—", icon: <VideoCallIcon />, color: '#0ea5e9', bg: '#f0f9ff' },
                                            { label: 'PETS', val: user.pets?.length || 0, icon: <PetsIcon />, color: '#ef4444', bg: '#fff5f5' }
                                        ].map((stat, i) => (
                                            <Grid item xs={6} key={i}>
                                                <Box sx={{
                                                    p: 2,
                                                    bgcolor: stat.bg,
                                                    borderRadius: 4,
                                                    border: '1px solid rgba(0,0,0,0.02)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'start',
                                                    transition: 'all 0.3s',
                                                    '&:hover': { transform: 'scale(1.05)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }
                                                }}>
                                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                        {React.cloneElement(stat.icon, { sx: { fontSize: 16, color: stat.color } })}
                                                        <Typography variant="caption" color={stat.color} fontWeight="900" sx={{ fontSize: '0.6rem', letterSpacing: 1 }}>{stat.label}</Typography>
                                                    </Box>
                                                    <Typography variant="h6" color="#1e293b" fontWeight="900" sx={{ lineHeight: 1 }}>
                                                        {stat.val}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Location Banner */}
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: 'rgba(243, 232, 255, 0.4)',
                                        borderRadius: 4,
                                        border: '1px solid #f3e8ff',
                                        mb: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 2, color: '#a855f7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                            <LocationOnIcon sx={{ fontSize: 18 }} />
                                        </Box>
                                        <Box minWidth={0}>
                                            <Typography variant="caption" color="#9333ea" fontWeight="900" sx={{ display: 'block', fontSize: '0.6rem', letterSpacing: 1 }}>LOCATION</Typography>
                                            <Typography variant="body2" color="#1e293b" fontWeight="700" noWrap>
                                                {user.address?.LOCATION || 'No State'} • {user.full_address || 'No Address'}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Footer Actions */}
                                    <Box display="flex" gap={1.5}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<EmailIcon />}
                                            onClick={() => handleOpenEmailDialog(user)}
                                            sx={{
                                                bgcolor: '#1e293b',
                                                color: 'white',
                                                borderRadius: 4,
                                                py: 1.5,
                                                fontSize: '0.8rem',
                                                fontWeight: 900,
                                                textTransform: 'none',
                                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                '&:hover': { bgcolor: '#0f172a', transform: 'translateY(-2px)' }
                                            }}
                                        >
                                            Message
                                        </Button>
                                        <Box display="flex" gap={1}>
                                            <IconButton
                                                onClick={() => handleBanUser(user, false)}
                                                sx={{
                                                    bgcolor: user.isBanned ? '#ecfdf5' : '#fff1f2',
                                                    color: user.isBanned ? '#10b981' : '#f43f5e',
                                                    border: '1px solid',
                                                    borderColor: user.isBanned ? '#dcfce7' : '#fee2e2',
                                                    borderRadius: 3,
                                                    p: 1.5
                                                }}
                                            >
                                                {user.isBanned ? <CheckCircleIcon /> : <BlockIcon />}
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleDeleteClick(user)}
                                                sx={{
                                                    bgcolor: '#f8fafc',
                                                    color: '#64748b',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 3,
                                                    p: 1.5,
                                                    '&:hover': { color: '#ef4444', bgcolor: '#fef2f2', borderColor: '#fee2e2' }
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Action Overlay - Visible on Hover */}
                                <Box
                                    className="action-overlay"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: 2,
                                        opacity: 0,
                                        transform: 'translateY(-100%)',
                                        transition: 'all 0.3s ease-in-out',
                                        zIndex: 20,
                                        borderBottom: '1px solid #f1f5f9',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                >
                                    <Button
                                        size="small"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => handleViewDetails(user)}
                                        sx={{ color: '#6366f1', fontWeight: 800, textTransform: 'none' }}
                                    >
                                        Inspect
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => handleEditClick(user)}
                                        sx={{ color: '#10b981', fontWeight: 800, textTransform: 'none' }}
                                    >
                                        Edit
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    sx={{ textAlign: 'center', py: 12, bgcolor: 'white', borderRadius: 8, border: '2px dashed #e2e8f0' }}
                >
                    <Typography variant="h2" sx={{ mb: 2 }}>🦦</Typography>
                    <Typography variant="h4" fontWeight="900" color="#1e293b" mb={1}>No Users Found</Typography>
                    <Typography variant="body1" color="#64748b">Adjust your filters to see more results from the network.</Typography>
                </Box>
            )
            }

            {/* Edit User Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={handleEditDialogClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 6, p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', color: '#10b981', borderRadius: 3 }}>
                        <EditIcon />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="900">Edit Profile</Typography>
                        <Typography variant="caption" color="text.secondary">Updating {currentUser?.name}'s information</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Full Name" name="name" value={userFormData.name} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Email Address" name="email" value={userFormData.email} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField fullWidth label="Contact Number" name="phone" value={userFormData.phone} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select label="Gender" name="gender" value={userFormData.gender} onChange={handleInputChange} sx={{ borderRadius: 3 }}>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Detailed Address" name="full_address" value={userFormData.full_address} onChange={handleInputChange} multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>

                        <Grid item xs={12}><Divider>🐾 Pet Profile</Divider></Grid>

                        <Grid item xs={6} md={3}>
                            <TextField fullWidth label="Pet Type" name="pet_type" value={userFormData.pet_type} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField fullWidth label="Breed" name="breed" value={userFormData.breed} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <TextField fullWidth label="Age" name="pet_age" value={userFormData.pet_age} onChange={handleInputChange} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                        </Grid>
                        <Grid item xs={6} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Pet Gender</InputLabel>
                                <Select label="Pet Gender" name="pet_gender" value={userFormData.pet_gender} onChange={handleInputChange} sx={{ borderRadius: 3 }}>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                                <input type="file" id="img-upload" hidden onChange={handleImageChange} />
                                <label htmlFor="img-upload">
                                    <Button component="span" variant="outlined" sx={{ borderRadius: 3 }}>Change Profile Photo</Button>
                                </label>
                                {userImage && <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 700 }}>{userImage.name}</Typography>}
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={handleEditDialogClose} color="inherit" sx={{ fontWeight: 700 }}>Discard</Button>
                    <Button onClick={handleEditSubmit} variant="contained" color="success" sx={{ borderRadius: 3, px: 4, fontWeight: 800 }}>Update Profile</Button>
                </DialogActions>
            </Dialog>

            {/* Details Dialog */}
            <Dialog
                open={detailsDialogOpen}
                onClose={handleDetailsDialogClose}
                maxWidth="lg"
                fullWidth
                PaperProps={{ sx: { borderRadius: 6 } }}
            >
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ bgcolor: '#4f46e5', p: 4, color: 'white', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar src={selectedUserDetails?.image} sx={{ width: 64, height: 64, border: '3px solid rgba(255,255,255,0.3)' }} />
                        <Box>
                            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: '-0.025em' }}>{selectedUserDetails?.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Advanced User Insights & Monitoring</Typography>
                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
                                <Typography variant="body2" sx={{ color: '#fbbf24', fontWeight: 700 }}>
                                    Wallet: {formatCurrency(selectedUserDetails?.pawWallet)}
                                </Typography>
                            </Box>
                        </Box>
                        <Tabs
                            value={detailsTab}
                            onChange={(e, v) => setDetailsTab(v)}
                            sx={{ ml: 'auto', '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 700 }, '& .Mui-selected': { color: 'white !important' }, '& .MuiTabs-indicator': { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}
                        >
                            <Tab label="Security Stats" />
                            <Tab label="Activity History" />
                            <Tab label="Pet Family" />
                        </Tabs>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 4, bgcolor: '#fdfdfd' }}>
                    {userDetailsLoading ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
                    ) : selectedUserDetails ? (
                        <AnimatePresence mode="wait">
                            {detailsTab === 0 ? (
                                <Box component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="sec">
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={4}>
                                            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Box sx={{ p: 1, bgcolor: '#fee2e2', color: '#ef4444', borderRadius: 2 }}><LockIcon fontSize="small" /></Box>
                                                    <Typography variant="subtitle2" fontWeight="800">Authentication</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="700">PASSWORD HASH</Typography>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1, mt: 1, borderRadius: 1.5, fontSize: '0.75rem', wordBreak: 'break-all', border: '1px solid #f1f5f9' }}>
                                                    {selectedUserDetails.password || 'Secure/Internal'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Box sx={{ p: 1, bgcolor: '#e0f2fe', color: '#0ea5e9', borderRadius: 2 }}><LoginIcon fontSize="small" /></Box>
                                                    <Typography variant="subtitle2" fontWeight="800">Session Logic</Typography>
                                                </Box>
                                                <Box sx={{ mb: 1.5 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight="700">LAST LOGIN</Typography>
                                                    <Typography variant="body2" fontWeight="700">{formatDate(selectedUserDetails.lastLogin)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight="700">ONLINE STATUS</Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        <Chip
                                                            label={selectedUserDetails.isOnline ? 'Online' : 'Offline'}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: selectedUserDetails.isOnline ? '#22c55e' : '#cbd5e1',
                                                                color: 'white',
                                                                fontWeight: 900,
                                                                height: 24
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#faf5ff', border: '1px solid #f3e8ff' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Box sx={{ p: 1, bgcolor: '#f3e8ff', color: '#a855f7', borderRadius: 2 }}><AccessTimeIcon fontSize="small" /></Box>
                                                    <Typography variant="subtitle2" fontWeight="800">Engagement</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="700">TOTAL TIME SPENT</Typography>
                                                <Typography variant="h4" fontWeight="900" color="#7e22ce" sx={{ my: 1 }}>
                                                    {selectedUserDetails.totalSessionTimeFormatted || '0h 0m'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">Aggregated across all verified sessions</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) : detailsTab === 2 ? (
                                <Box component={motion.div} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key="pets">
                                    {selectedUserDetails?.pets && selectedUserDetails.pets.length > 0 ? (
                                        <Grid container spacing={3}>
                                            {selectedUserDetails.pets.map((pet, index) => (
                                                <Grid item xs={12} sm={6} md={4} key={pet._id || index}>
                                                    <Card sx={{
                                                        borderRadius: 4,
                                                        overflow: 'hidden',
                                                        border: highlightedPetId === pet._id ? '3px solid #f59e0b' : '1px solid #e2e8f0',
                                                        boxShadow: highlightedPetId === pet._id ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none',
                                                        transform: highlightedPetId === pet._id ? 'scale(1.02)' : 'scale(1)',
                                                        transition: 'all 0.3s ease',
                                                        '&:hover': { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }
                                                    }}>
                                                        <Box sx={{ position: 'relative', height: 160 }}>
                                                            <Box
                                                                component="img"
                                                                src={pet.image || assets.pet_icon}
                                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                            <Box sx={{
                                                                position: 'absolute',
                                                                bottom: 0,
                                                                left: 0,
                                                                right: 0,
                                                                p: 2,
                                                                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                                                color: 'white'
                                                            }}>
                                                                <Typography variant="h6" fontWeight="800">{pet.name}</Typography>
                                                                <Typography variant="caption">{pet.type} • {pet.breed}</Typography>
                                                            </Box>
                                                            <Chip
                                                                label={pet.category || 'Standard'}
                                                                size="small"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    top: 12,
                                                                    right: 12,
                                                                    bgcolor: pet.category === 'Premium' ? '#f59e0b' : 'rgba(255,255,255,0.9)',
                                                                    color: pet.category === 'Premium' ? 'white' : '#1e293b',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.65rem'
                                                                }}
                                                            />
                                                        </Box>
                                                        <Box sx={{ p: 2 }}>
                                                            <Grid container spacing={1}>
                                                                <Grid item xs={6}>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>GENDER</Typography>
                                                                    <Typography variant="body2" fontWeight="700">{pet.gender}</Typography>
                                                                </Grid>
                                                                <Grid item xs={6}>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>AGE</Typography>
                                                                    <Typography variant="body2" fontWeight="700">{pet.age} Years</Typography>
                                                                </Grid>
                                                            </Grid>
                                                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                                                                <Button
                                                                    fullWidth
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<CreditCardIcon />}
                                                                    sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.7rem' }}
                                                                    onClick={() => window.open(pet.image, '_blank')}
                                                                >
                                                                    View Identity Link
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : (
                                        <Box sx={{ py: 10, textAlign: 'center' }}>
                                            <PetsIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
                                            <Typography variant="h6" color="#94a3b8">This user hasn't created any pet profiles yet.</Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="history">
                                    {logsLoading ? (
                                        <CircularProgress />
                                    ) : activityLogs.length > 0 ? (
                                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 450, borderRadius: 4, border: '1px solid #f1f5f9' }}>
                                            <Table stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Timestamp</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Activity</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Details</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Biometric</TableCell>
                                                        <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc' }}>Endpoint IP</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {activityLogs.map((log, index) => (
                                                        <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                                                            <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(log.timestamp)}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={log.activityType}
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 800,
                                                                        fontSize: '0.7rem',
                                                                        bgcolor: log.activityType === 'login' ? '#dcfce7' : log.activityType === 'logout' ? '#fee2e2' : '#f1f5f9',
                                                                        color: log.activityType === 'login' ? '#15803d' : log.activityType === 'logout' ? '#b91c1c' : '#475569'
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{log.activityDescription}</TableCell>
                                                            <TableCell>
                                                                {log.faceImage ? (
                                                                    <Avatar
                                                                        src={log.faceImage}
                                                                        variant="rounded"
                                                                        sx={{ width: 36, height: 36, cursor: 'pointer', border: '1px solid #e2e8f0' }}
                                                                        onClick={() => window.open(log.faceImage, '_blank')}
                                                                    />
                                                                ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                                                            </TableCell>
                                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ipAddress || 'Internal'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Box sx={{ py: 6, textAlign: 'center' }}>
                                            <HistoryIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
                                            <Typography variant="h6" color="#94a3b8">Zero activity logs recorded for this user.</Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </AnimatePresence>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 1 }}>
                    <Button onClick={handleDetailsDialogClose} variant="contained" disableElevation sx={{ borderRadius: 3, px: 6, fontWeight: 800 }}>Done</Button>
                </DialogActions>
            </Dialog>

            {/* Email Dialog */}
            <Dialog
                open={emailDialogOpen}
                onClose={handleCloseEmailDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 6 } }}
            >
                <DialogTitle sx={{ bgcolor: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmailIcon />
                    <Typography variant="h6" fontWeight="800">Compose Message</Typography>
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <TextField fullWidth disabled label="Recipient" value={emailTargetUser?.email || ''} margin="normal" sx={{ mt: 2 }} />
                    <TextField fullWidth label="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} margin="normal" placeholder="e.g. Account Update" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                    <TextField fullWidth label="Message Body" value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} margin="normal" multiline rows={6} placeholder="Type your message..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />

                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f3ff', borderRadius: 3, border: '1px solid #ddd6fe' }}>
                        <Button component="label" variant="text" size="small" startIcon={<EditIcon />} sx={{ color: '#7c3aed', fontWeight: 800 }}>Include Attachments</Button>
                        <input type="file" hidden multiple onChange={handleEmailFileChange} />
                        <Box sx={{ mt: 1 }}>
                            {emailAttachments.map((f, i) => (
                                <Typography key={i} variant="caption" display="block" color="#6d28d9" fontWeight="600">• {f.name}</Typography>
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseEmailDialog} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSendEmailSubmit}
                        variant="contained"
                        disabled={sendingIndividualEmail}
                        sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, borderRadius: 3, px: 4, fontWeight: 800 }}
                    >
                        {sendingIndividualEmail ? 'Transmitting...' : 'Dispatch Email'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteDialogClose}
                PaperProps={{ sx: { borderRadius: 5, p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: 3 }}>
                        <WarningIcon />
                    </Box>
                    <Typography variant="h6" fontWeight="900">Confirm Deletion</Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontWeight: 500, color: '#475569' }}>
                        Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This action is permanent and will remove all associated pet profiles and appointment history.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={handleDeleteDialogClose} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        sx={{
                            bgcolor: '#ef4444',
                            '&:hover': { bgcolor: '#dc2626' },
                            borderRadius: 3,
                            px: 4,
                            fontWeight: 800,
                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                        }}
                    >
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Ban Modal */}
            <BanUserDialog
                open={banDialogOpen}
                onClose={handleBanDialogClose}
                user={userToBan}
                userType="user"
                defaultBanIp={defaultBanIp}
                onBan={async (id, type, duration, reason, banIp, ipAddress) => {
                    const result = await banUser(id, type, duration, reason, banIp, ipAddress);
                    await getallusers();
                    return result;
                }}
                onUnban={async (id, type, reason) => {
                    const result = await unbanUser(id, type, reason);
                    await getallusers();
                    return result;
                }}
            />
        </Box >
    );
};

export default TotalUsers;
