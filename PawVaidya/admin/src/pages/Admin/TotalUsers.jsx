import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import BanUserDialog from '../../components/BanUserDialog';
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
    Badge
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
    }, []);

    useEffect(() => {
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

    // Handle opening edit dialog
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

    // Handle edit dialog close
    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setCurrentUser(null);
        setUserImage(null);
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserFormData({
            ...userFormData,
            [name]: value
        });
    };

    // Handle image upload
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setUserImage(e.target.files[0]);
        }
    };

    // Handle form submission
    const handleEditSubmit = () => {
        if (currentUser && currentUser._id) {
            editUser(currentUser._id, userFormData, userImage);
            handleEditDialogClose();
        }
    };

    // Handle delete click
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = () => {
        if (userToDelete && userToDelete._id) {
            deleteUser(userToDelete._id);
            setDeleteDialogOpen(false);
        }
    };

    // Handle delete dialog close
    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
    };

    // Handle view details
    const handleViewDetails = async (user) => {
        setSelectedUserDetails(null);
        setActivityLogs([]);
        setDetailsDialogOpen(true);
        setDetailsTab(0);
        setUserDetailsLoading(true);

        try {
            // Fetch user details with password
            const usersWithPasswords = await getUsersWithPasswords();
            const userDetails = usersWithPasswords.find(u => u._id === user._id);
            setSelectedUserDetails(userDetails || user);

            // Fetch activity logs
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

    // Handle send verification email
    const handleSendVerificationEmail = async (user) => {
        if (window.confirm(`Send email verification request to ${user.email}?`)) {
            setSendingEmail(user._id);
            try {
                const success = await sendVerificationEmail(user._id);
                if (success) {
                    // Refresh users list to get updated data
                    getallusers();
                }
            } finally {
                setSendingEmail(null);
            }
        }
    };

    // Handle ban user
    const handleBanUser = (user) => {
        setUserToBan(user);
        setBanDialogOpen(true);
    };

    // Handle ban dialog close
    const handleBanDialogClose = () => {
        setBanDialogOpen(false);
        setUserToBan(null);
    };

    // Handle ban/unban completion
    const handleBanComplete = async (result) => {
        if (result.success) {
            // Refresh users list to get updated ban status
            await getallusers();
        }
        handleBanDialogClose();
    };

    return dashdata && (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" fontWeight="bold" mb={1} color="green.800" sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' } }}>
                    Users Management
                </Typography>
                <Typography variant="body1" color="gray.600" mb={3}>
                    Manage all pet owners and their information
                </Typography>

                {/* Dropdown for State Filter */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'center' }, mb: 3 }}>
                    <FormControl sx={{ width: { xs: '100%', sm: '300px' } }}>
                        <InputLabel
                            id="state-select-label"
                            sx={{ color: 'green.700', fontWeight: 'bold' }}
                        >
                            Filter by State
                        </InputLabel>
                        <Select
                            labelId="state-select-label"
                            value={selectedState}
                            onChange={handleStateChange}
                            label="Filter by State"
                            sx={{
                                color: 'green.800',
                                backgroundColor: 'white',
                                borderRadius: 3,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'green.300' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'green.500' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'green.700' },
                            }}
                        >
                            <MenuItem value="">All States</MenuItem>
                            <MenuItem value="NEW DELHI">NEW DELHI</MenuItem>
                            <MenuItem value="GUJARAT">GUJARAT</MenuItem>
                            <MenuItem value="HARYANA">HARYANA</MenuItem>
                            <MenuItem value="MUMBAI">MUMBAI</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', px: 2, py: 1, borderRadius: 3, border: '1px solid', borderColor: 'green.300' }}>
                            <input
                                type="checkbox"
                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={handleSelectAll}
                                style={{ transform: 'scale(1.2)', marginRight: '8px' }}
                            />
                            <Typography variant="body2" fontWeight="bold" color="green.800">
                                Select All ({selectedUsers.length})
                            </Typography>
                        </Box>

                        {selectedUsers.length > 0 && (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<BlockIcon />}
                                onClick={handleBulkBlacklist}
                                sx={{ borderRadius: 3, fontWeight: 'bold' }}
                            >
                                Blacklist Selected
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            {filteredUsers.length > 0 ? (
                <Grid container spacing={{ xs: 2, sm: 3, md: 3 }}>
                    {filteredUsers.map((user, index) => (
                        <Grid item xs={12} sm={6} md={6} lg={6} key={index}>
                            <Card
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    p: 2.5,
                                    borderRadius: 3,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    border: '2px solid #10b981',
                                    '&:hover': {
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                        transform: 'translateY(-4px)',
                                        borderColor: '#059669'
                                    },
                                }}
                            >
                                {/* User Header */}
                                <Box display="flex" alignItems="flex-start" mb={2}>
                                    <Box sx={{ mr: 1, mt: 2.5 }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.email)}
                                            onChange={() => handleSelectUser(user.email)}
                                            style={{ transform: 'scale(1.3)' }}
                                        />
                                    </Box>
                                    <Avatar
                                        src={user.image || assets.people_icon}
                                        alt={user.name}
                                        sx={{
                                            width: 70,
                                            height: 70,
                                            mr: 1.5,
                                            border: '3px solid #10b981',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                            flexShrink: 0
                                        }}
                                    />
                                    <Box flex={1} minWidth={0}>
                                        <Typography variant="h6" fontWeight="bold" color="#065f46" sx={{ fontSize: '1rem', mb: 0.5 }}>
                                            {user.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                                            {user.gender}, {calculateAge(user.dob)} years
                                        </Typography>
                                        <Chip
                                            icon={user.isAccountverified ? <VerifiedIcon /> : <ErrorOutlineIcon />}
                                            label={user.isAccountverified ? 'Verified' : 'Unverified'}
                                            color={user.isAccountverified ? 'success' : 'error'}
                                            size="small"
                                            sx={{ fontSize: '0.7rem', height: 22 }}
                                        />
                                    </Box>
                                </Box>

                                {/* Contact Info */}
                                <Box mb={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                                        <EmailIcon sx={{ fontSize: 14, color: '#10b981', mr: 0.75, flexShrink: 0 }} />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                fontSize: '0.75rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {user.email}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.75 }}>
                                        <PhoneIcon sx={{ fontSize: 14, color: '#10b981', mr: 0.75, flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            {user.phone}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CalendarTodayIcon sx={{ fontSize: 14, color: '#10b981', mr: 0.75, flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                            Appointments: {dashdata?.userAppointments?.find(appointment => appointment.userId === user._id)?.totalAppointments || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Location Tags */}
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                                    <Chip
                                        label={user.address.LOCATION}
                                        size="small"
                                        sx={{
                                            bgcolor: '#d1fae5',
                                            color: '#065f46',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            height: 24
                                        }}
                                    />
                                    <Chip
                                        label={user.address.LINE}
                                        size="small"
                                        sx={{
                                            bgcolor: '#d1fae5',
                                            color: '#065f46',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            height: 24
                                        }}
                                    />
                                </Box>

                                {/* Full Address */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        border: '1px solid #10b981',
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: 2,
                                        backgroundColor: '#ecfdf5',
                                        mb: 2
                                    }}
                                >
                                    <LocationOnIcon sx={{ fontSize: 16, color: '#10b981', mr: 0.75, mt: 0.25, flexShrink: 0 }} />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            fontSize: '0.75rem',
                                            lineHeight: 1.4,
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {user.full_address}
                                    </Typography>
                                </Box>

                                {/* Pet Information */}
                                <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="#065f46" sx={{ fontSize: '0.8rem', mb: 1 }}>
                                        🐾 Pet Information
                                    </Typography>
                                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                                        {user.pet_type} • {user.breed}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        {user.category} • {user.pet_age} years • {user.pet_gender}
                                    </Typography>
                                </Box>

                                {/* Action Buttons */}
                                <Box sx={{ mt: 'auto' }}>
                                    <Button
                                        variant="contained"
                                        color="info"
                                        size="small"
                                        fullWidth
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => handleViewDetails(user)}
                                        sx={{ mb: 1, fontSize: '0.75rem', py: 0.75, borderRadius: 2 }}
                                    >
                                        View Details
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        size="small"
                                        fullWidth
                                        startIcon={<EmailIcon />}
                                        onClick={() => handleOpenEmailDialog(user)}
                                        sx={{ mb: 1, fontSize: '0.75rem', py: 0.75, borderRadius: 2, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                                    >
                                        Send Email
                                    </Button>
                                    {!user.isAccountverified && (
                                        <Button
                                            variant="contained"
                                            color="warning"
                                            size="small"
                                            fullWidth
                                            startIcon={sendingEmail === user._id ? <CircularProgress size={14} color="inherit" /> : <EmailIcon />}
                                            onClick={() => handleSendVerificationEmail(user)}
                                            disabled={sendingEmail === user._id}
                                            sx={{ mb: 1, fontSize: '0.7rem', py: 0.75, borderRadius: 2 }}
                                        >
                                            {sendingEmail === user._id ? 'Sending...' : 'Send Verification'}
                                        </Button>
                                    )}
                                    <Box display="flex" gap={1} mb={1}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => handleEditClick(user)}
                                            size="small"
                                            startIcon={<EditIcon />}
                                            sx={{ flex: 1, fontSize: '0.7rem', py: 0.75, borderRadius: 2 }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleDeleteClick(user)}
                                            size="small"
                                            startIcon={<DeleteIcon />}
                                            sx={{ flex: 1, fontSize: '0.7rem', py: 0.75, borderRadius: 2 }}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                    <Button
                                        variant={user.isBanned ? "contained" : "outlined"}
                                        color={user.isBanned ? "success" : "error"}
                                        size="small"
                                        fullWidth
                                        startIcon={user.isBanned ? <CheckCircleIcon /> : <BlockIcon />}
                                        onClick={() => handleBanUser(user)}
                                        sx={{ fontSize: '0.7rem', py: 0.75, borderRadius: 2 }}
                                    >
                                        {user.isBanned ? 'Unban User' : 'Ban User'}
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <div className="flex justify-center items-center mt-6">
                    <p className="text-5xl sm:text-7xl md:text-4xl text-center font-extrabold text-green-400">
                        🦥No User🦦 <br /> Found in <br /> {selectedState ? `${selectedState}` : ''}
                    </p>
                </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="md" fullWidth>
                <DialogTitle sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}>
                    Edit User Information
                </DialogTitle>
                <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                    <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="name"
                                label="Name"
                                value={userFormData.name}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="email"
                                label="Email"
                                value={userFormData.email}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="phone"
                                label="Phone"
                                value={userFormData.phone}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel>Gender</InputLabel>
                                <Select
                                    name="gender"
                                    value={userFormData.gender}
                                    onChange={handleInputChange}
                                    label="Gender"
                                >
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="full_address"
                                label="Full Address"
                                value={userFormData.full_address}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                multiline
                                rows={2}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                                Pet Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="pet_type"
                                label="Pet Type"
                                value={userFormData.pet_type}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="breed"
                                label="Breed"
                                value={userFormData.breed}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                name="category"
                                label="Category"
                                value={userFormData.category}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                name="pet_age"
                                label="Pet Age"
                                value={userFormData.pet_age}
                                onChange={handleInputChange}
                                fullWidth
                                margin="normal"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel>Pet Gender</InputLabel>
                                <Select
                                    name="pet_gender"
                                    value={userFormData.pet_gender}
                                    onChange={handleInputChange}
                                    label="Pet Gender"
                                >
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                                Profile Image
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                sx={{
                                    mt: 1,
                                    borderRadius: 2,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                                size="small"
                            >
                                Upload New Image
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </Button>
                            {userImage && (
                                <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    Selected: {userImage.name}
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
                    <Button
                        onClick={handleEditDialogClose}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditSubmit}
                        color="success"
                        variant="contained"
                        size="small"
                        sx={{ borderRadius: 2 }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
                <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', fontWeight: 'bold' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mt: 2 }}>
                        Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleDeleteDialogClose} color="primary" variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog
                open={detailsDialogOpen}
                onClose={handleDetailsDialogClose}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
                    User Details & Statistics
                </DialogTitle>
                <DialogContent dividers>
                    {userDetailsLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <CircularProgress />
                        </Box>
                    ) : selectedUserDetails ? (
                        <>
                            <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)} sx={{ mb: 3 }}>
                                <Tab label="Login Statistics" />
                                <Tab label="Activity Logs" />
                            </Tabs>

                            {detailsTab === 0 && (
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Password
                                                </Typography>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    wordBreak: 'break-all',
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.875rem',
                                                    bgcolor: 'grey.100',
                                                    p: 1.5,
                                                    borderRadius: 1,
                                                    color: 'text.primary',
                                                    fontWeight: 'medium'
                                                }}
                                            >
                                                {selectedUserDetails.password || 'N/A'}
                                            </Typography>
                                        </Paper>

                                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <LoginIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Last Login
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1">
                                                {formatDate(selectedUserDetails.lastLogin)}
                                            </Typography>
                                        </Paper>

                                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <LogoutIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Last Logout
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1">
                                                {formatDate(selectedUserDetails.lastLogout)}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Total Session Time
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" color="primary">
                                                {selectedUserDetails.totalSessionTimeFormatted ||
                                                    `${Math.floor((selectedUserDetails.totalSessionTime || 0) / 3600)}h ${Math.floor(((selectedUserDetails.totalSessionTime || 0) % 3600) / 60)}m ${(selectedUserDetails.totalSessionTime || 0) % 60}s`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {(selectedUserDetails.totalSessionTime || 0)} seconds total
                                            </Typography>
                                        </Paper>

                                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Current Session Start
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1">
                                                {formatDate(selectedUserDetails.currentSessionStart)}
                                            </Typography>
                                        </Paper>

                                        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <OnlinePredictionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Online Status
                                                </Typography>
                                            </Box>
                                            <Badge
                                                color={selectedUserDetails.isOnline ? 'success' : 'error'}
                                                variant="dot"
                                                sx={{ mr: 2 }}
                                            />
                                            <Typography variant="body1" display="inline">
                                                {selectedUserDetails.isOnline ? 'Online' : 'Offline'}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            )}

                            {detailsTab === 1 && (
                                <Box>
                                    {logsLoading ? (
                                        <Box display="flex" justifyContent="center" p={3}>
                                            <CircularProgress />
                                        </Box>
                                    ) : activityLogs.length > 0 ? (
                                        <TableContainer component={Paper}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><strong>Timestamp</strong></TableCell>
                                                        <TableCell><strong>Activity Type</strong></TableCell>
                                                        <TableCell><strong>Description</strong></TableCell>
                                                        <TableCell><strong>IP Address</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {activityLogs.map((log, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                {formatDate(log.timestamp)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={log.activityType}
                                                                    size="small"
                                                                    color={
                                                                        log.activityType === 'login' ? 'success' :
                                                                            log.activityType === 'logout' ? 'error' :
                                                                                'default'
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell>{log.activityDescription}</TableCell>
                                                            <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Box textAlign="center" p={3}>
                                            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                            <Typography variant="body1" color="text.secondary">
                                                No activity logs found
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </>
                    ) : (
                        <Typography>No details available</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleDetailsDialogClose} color="primary" variant="contained">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Individual Email Dialog */}
            <Dialog open={emailDialogOpen} onClose={handleCloseEmailDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', fontWeight: 'bold' }}>
                    Send Email to {emailTargetUser?.name}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mt: 1 }}>
                        <TextField
                            label="To"
                            value={emailTargetUser?.email || ''}
                            fullWidth
                            disabled
                            margin="normal"
                            size="small"
                        />
                        <TextField
                            label="Subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                            placeholder="Enter email subject"
                            required
                        />
                        <TextField
                            label="Message"
                            value={emailMessage}
                            onChange={(e) => setEmailMessage(e.target.value)}
                            fullWidth
                            margin="normal"
                            size="small"
                            multiline
                            rows={6}
                            placeholder="Type your message here..."
                            required
                        />
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Attachments (Optional)
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                startIcon={<EditIcon />}
                            >
                                Upload Files
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    onChange={handleEmailFileChange}
                                />
                            </Button>
                            {emailAttachments.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    {emailAttachments.map((file, index) => (
                                        <Typography key={index} variant="caption" display="block">
                                            • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                        </Typography>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseEmailDialog} color="error" variant="outlined" size="small">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSendEmailSubmit}
                        color="secondary"
                        variant="contained"
                        size="small"
                        disabled={sendingIndividualEmail}
                        startIcon={sendingIndividualEmail ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
                        sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                    >
                        {sendingIndividualEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Ban User Dialog */}
            <BanUserDialog
                open={banDialogOpen}
                onClose={handleBanDialogClose}
                user={userToBan}
                userType="user"
                onBan={async (id, type, duration, reason) => {
                    const result = await banUser(id, type, duration, reason);
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
