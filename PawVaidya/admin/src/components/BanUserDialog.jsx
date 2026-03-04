import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Alert,
    Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const BanUserDialog = ({ open, onClose, user, userType, onBan, onUnban }) => {
    const [banDuration, setBanDuration] = useState('24h');
    const [banReason, setBanReason] = useState('');
    const [customDuration, setCustomDuration] = useState('');
    const [customUnit, setCustomUnit] = useState('h');
    const [isBanning, setIsBanning] = useState(false);
    const [isUnbanning, setIsUnbanning] = useState(false);

    const durationOptions = [
        { value: '1h', label: '1 Hour' },
        { value: '6h', label: '6 Hours' },
        { value: '24h', label: '24 Hours' },
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: 'permanent', label: 'Permanent' },
        { value: 'custom', label: 'Custom Duration' }
    ];

    const unitOptions = [
        { value: 'h', label: 'Hours' },
        { value: 'd', label: 'Days' },
        { value: 'w', label: 'Weeks' },
        { value: 'm', label: 'Months' }
    ];

    const handleBan = async () => {
        if (!banReason.trim()) {
            alert('Please provide a ban reason');
            return;
        }

        let finalDuration = banDuration;
        if (banDuration === 'custom') {
            if (!customDuration || !customUnit) {
                alert('Please provide both custom duration and unit');
                return;
            }
            finalDuration = `${customDuration}${customUnit}`;
        }

        setIsBanning(true);
        try {
            await onBan(user._id, userType, finalDuration, banReason);
            onClose();
            // Reset form
            setBanDuration('24h');
            setBanReason('');
            setCustomDuration('');
            setCustomUnit('h');
        } catch (error) {
            console.error('Ban failed:', error);
            alert('Failed to ban user: ' + error.message);
        } finally {
            setIsBanning(false);
        }
    };

    const handleUnban = async () => {
        setIsUnbanning(true);
        try {
            await onUnban(user._id, userType, 'Unbanned by admin');
            onClose();
        } catch (error) {
            console.error('Unban failed:', error);
            alert('Failed to unban user: ' + error.message);
        } finally {
            setIsUnbanning(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                bgcolor: user.isBanned ? 'success.main' : 'error.main', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1 
            }}>
                {user.isBanned ? 'Unban User' : 'Ban User'}
                {user.isBanned ? <AccessTimeIcon /> : <BlockIcon />}
            </DialogTitle>
            
            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {userType === 'user' ? 'User' : 'Doctor'}: {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Email: {user.email}
                    </Typography>
                    
                    {user.isBanned && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                <strong>Current Status:</strong> Banned
                            </Typography>
                            <Typography variant="body2">
                                <strong>Reason:</strong> {user.banReason}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Banned At:</strong> {new Date(user.bannedAt).toLocaleString()}
                            </Typography>
                            {user.unbanAt && (
                                <Typography variant="body2">
                                    <strong>Auto-unban:</strong> {new Date(user.unbanAt).toLocaleString()}
                                </Typography>
                            )}
                        </Alert>
                    )}
                </Box>

                {!user.isBanned ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                This action will ban the {userType} from accessing the platform. They will not be able to log in until the ban expires or is manually lifted.
                            </Typography>
                        </Alert>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Ban Duration</InputLabel>
                            <Select
                                value={banDuration}
                                onChange={(e) => setBanDuration(e.target.value)}
                                label="Ban Duration"
                            >
                                {durationOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {banDuration === 'custom' && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <TextField
                                    type="number"
                                    label="Duration"
                                    value={customDuration}
                                    onChange={(e) => setCustomDuration(e.target.value)}
                                    inputProps={{ min: 1, max: 999 }}
                                    sx={{ flex: 1 }}
                                />
                                <FormControl sx={{ flex: 1 }}>
                                    <InputLabel>Unit</InputLabel>
                                    <Select
                                        value={customUnit}
                                        onChange={(e) => setCustomUnit(e.target.value)}
                                        label="Unit"
                                    >
                                        {unitOptions.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Ban Reason"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            placeholder="Please provide a detailed reason for this ban..."
                            required
                            sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip label="Spam" onClick={() => setBanReason('Spam or inappropriate content')} clickable />
                            <Chip label="Harassment" onClick={() => setBanReason('Harassment or abusive behavior')} clickable />
                            <Chip label="Fake Profile" onClick={() => setBanReason('Fake or misleading profile')} clickable />
                            <Chip label="Payment Issues" onClick={() => setBanReason('Payment fraud or chargebacks')} clickable />
                            <Chip label="Policy Violation" onClick={() => setBanReason('Violation of platform policies')} clickable />
                        </Box>
                    </>
                ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            This {userType} is currently banned. Unbanning will restore their access to the platform immediately.
                        </Typography>
                    </Alert>
                )}
            </DialogContent>
            
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit" variant="outlined">
                    Cancel
                </Button>
                {user.isBanned ? (
                    <Button
                        onClick={handleUnban}
                        color="success"
                        variant="contained"
                        disabled={isUnbanning}
                        startIcon={<AccessTimeIcon />}
                    >
                        {isUnbanning ? 'Unbanning...' : 'Unban User'}
                    </Button>
                ) : (
                    <Button
                        onClick={handleBan}
                        color="error"
                        variant="contained"
                        disabled={isBanning || !banReason.trim()}
                        startIcon={<BlockIcon />}
                    >
                        {isBanning ? 'Banning...' : 'Ban User'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default BanUserDialog;