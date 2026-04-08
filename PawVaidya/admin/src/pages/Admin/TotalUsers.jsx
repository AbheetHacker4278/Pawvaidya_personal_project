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
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
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

    return dashdata && (
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
                        <Grid item xs={12} md={6} lg={4} key={user._id || index} component={motion.div} variants={itemVariants}>
                            <Card
                                sx={{
                                    height: '100%',
                                    p: 3,
                                    borderRadius: 5,
                                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                        transform: 'translateY(-6px)',
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        '& .action-overlay': { opacity: 1 }
                                    },
                                }}
                            >
                                {/* Status Badges Top Right */}
                                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 0.5 }}>
                                    {user.isOnline && (
                                        <Tooltip title="Currently Online">
                                            <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 0 2px rgba(16,185,129,0.2)' }} />
                                        </Tooltip>
                                    )}
                                </Box>

                                {/* User Profile Header */}
                                <Box display="flex" alignItems="center" mb={3} gap={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.email)}
                                            onChange={() => handleSelectUser(user.email)}
                                            style={{ cursor: 'pointer', scale: 1.2 }}
                                        />
                                    </Box>
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar
                                            src={user.image || assets.people_icon}
                                            alt={user.name}
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                border: '4px solid white',
                                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                flexShrink: 0
                                            }}
                                        />
                                        {user.isFaceRegistered && (
                                            <Tooltip title="View Registered Face">
                                                <Avatar
                                                    src={user.faceImage}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        position: 'absolute',
                                                        bottom: -2,
                                                        right: -2,
                                                        border: '2px solid white',
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                        cursor: 'pointer',
                                                        zIndex: 2,
                                                        '&:hover': { scale: 1.15 }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(user.faceImage, '_blank');
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Box flex={1} minWidth={0}>
                                        <Typography variant="h6" fontWeight="800" color="#1e293b" noWrap sx={{ fontSize: '1.1rem', mb: 0.5 }}>
                                            {user.name}
                                        </Typography>
                                        <Box display="flex" items="center" gap={1} mb={1}>
                                            <Chip
                                                label={user.isAccountverified ? 'Verified' : 'Unverified'}
                                                size="small"
                                                variant="contained"
                                                sx={{
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    bgcolor: user.isAccountverified ? '#dcfce7' : '#fff7ed',
                                                    color: user.isAccountverified ? '#15803d' : '#9a3412',
                                                    '& .MuiChip-label': { px: 1 }
                                                }}
                                            />
                                            {user.isBanned && (
                                                <Chip
                                                    label="Banned"
                                                    size="small"
                                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#fee2e2', color: '#b91c1c' }}
                                                />
                                            )}
                                        </Box>
                                        <Typography variant="body2" color="#64748b" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                            {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)} • {calculateAge(user.dob)} yrs
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

                                {/* Info Grid */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <Box>
                                            <Typography variant="caption" color="#94a3b8" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</Typography>
                                            <Typography variant="body2" color="#334155" fontWeight="600" sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.phone}</Typography>
                                            <Typography variant="caption" color="#64748b" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box>
                                            <Typography variant="caption" color="#94a3b8" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pet Details</Typography>
                                            <Typography variant="body2" color="#334155" fontWeight="600" sx={{ mt: 0.5 }}>{user.pet_type || 'N/A'}</Typography>
                                            <Typography variant="caption" color="#64748b" sx={{ display: 'block' }}>{user.breed || 'Unknown Breed'}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {/* Location Banner */}
                                <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <LocationOnIcon sx={{ color: '#10b981', fontSize: 18 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="#64748b" fontWeight="600">{user.address.LOCATION}, {user.address.LINE}</Typography>
                                        <Typography variant="body2" color="#475569" fontWeight="500" sx={{ fontSize: '0.7rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {user.full_address}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Bottom Stat + Actions */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                                    <Box>
                                        <Typography variant="caption" color="#94a3b8" fontWeight="700">APPOINTMENTS</Typography>
                                        <Typography variant="h6" color="#1e293b" fontWeight="800">
                                            {dashdata?.userAppointments?.find(ap => ap.userId === user._id)?.totalAppointments || 0}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title="View Analytics & Logs">
                                            <IconButton
                                                onClick={() => handleViewDetails(user)}
                                                sx={{ bgcolor: '#eff6ff', color: '#2563eb', '&:hover': { bgcolor: '#2563eb', color: 'white' } }}
                                                size="small"
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Quick Edit">
                                            <IconButton
                                                onClick={() => handleEditClick(user)}
                                                sx={{ bgcolor: '#f0fdf4', color: '#059669', '&:hover': { bgcolor: '#059669', color: 'white' } }}
                                                size="small"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Communicate">
                                            <IconButton
                                                onClick={() => handleOpenEmailDialog(user)}
                                                sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', '&:hover': { bgcolor: '#7c3aed', color: 'white' } }}
                                                size="small"
                                            >
                                                <EmailIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>

                                {/* Security Action Drawer (Overlay style) */}
                                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        color={user.isBanned ? "success" : "error"}
                                        size="small"
                                        fullWidth
                                        startIcon={user.isBanned ? <CheckCircleIcon /> : <BlockIcon />}
                                        onClick={() => handleBanUser(user, false)}
                                        sx={{
                                            borderRadius: 2.5,
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.025em',
                                            borderWidth: 2,
                                            '&:hover': { borderWidth: 2 }
                                        }}
                                    >
                                        {user.isBanned ? 'Unlock' : 'Blacklist'}
                                    </Button>
                                    <IconButton
                                        onClick={() => handleDeleteClick(user)}
                                        sx={{ color: '#ef4444', bgcolor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 2.5 }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
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
            )}

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
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Advanced User Insights & Monitoring</Typography>
                        </Box>
                        <Tabs
                            value={detailsTab}
                            onChange={(e, v) => setDetailsTab(v)}
                            sx={{ ml: 'auto', '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 700 }, '& .Mui-selected': { color: 'white !important' }, '& .MuiTabs-indicator': { bgcolor: 'white', height: 3, borderRadius: '3px 3px 0 0' } }}
                        >
                            <Tab label="Security Stats" />
                            <Tab label="Activity History" />
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
        </Box>
    );
};

export default TotalUsers;
