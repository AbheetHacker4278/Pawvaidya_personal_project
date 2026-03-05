import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    Chip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import PersonIcon from '@mui/icons-material/Person';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import RefreshIcon from '@mui/icons-material/Refresh';

const BlacklistManagement = () => {
    const { getBlacklist, removeFromBlacklist } = useContext(AdminContext);
    const [blacklist, setBlacklist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [emailToRemove, setEmailToRemove] = useState(null);

    const fetchBlacklist = async () => {
        setLoading(true);
        const data = await getBlacklist();
        setBlacklist(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchBlacklist();
    }, []);

    const handleRemoveClick = (email) => {
        setEmailToRemove(email);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (emailToRemove) {
            const success = await removeFromBlacklist(emailToRemove);
            if (success) {
                setBlacklist(blacklist.filter(item => item.email !== emailToRemove));
            }
            setDeleteConfirmOpen(false);
            setEmailToRemove(null);
        }
    };

    const filteredBlacklist = blacklist.filter(item =>
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h3" fontWeight="bold" color="error.dark" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <BlockIcon sx={{ fontSize: 40 }} /> Email Blacklist
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage emails that are blocked from registering new accounts
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchBlacklist}
                    disabled={loading}
                    sx={{ borderRadius: 2 }}
                >
                    Refresh
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <TextField
                    fullWidth
                    placeholder="Search by email, type, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                        }
                    }}
                />
            </Paper>

            {loading ? (
                <Box display="flex" justifyContent="center" p={10}>
                    <CircularProgress color="error" />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#fef2f2' }}>
                            <TableRow>
                                <TableCell><strong>Email Address</strong></TableCell>
                                <TableCell><strong>Type</strong></TableCell>
                                <TableCell><strong>Reason</strong></TableCell>
                                <TableCell><strong>Blacklisted At</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredBlacklist.length > 0 ? (
                                filteredBlacklist.map((item) => (
                                    <TableRow key={item._id} hover>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                            {item.email}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={item.type === 'doctor' ? <HealthAndSafetyIcon sx={{ fontSize: '1rem !important' }} /> : <PersonIcon sx={{ fontSize: '1rem !important' }} />}
                                                label={item.type.toUpperCase()}
                                                size="small"
                                                color={item.type === 'doctor' ? 'primary' : 'secondary'}
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary', maxWidth: 300 }}>
                                            {item.reason}
                                        </TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>
                                            {formatDate(item.createdAt)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveClick(item.email)}
                                                sx={{ '&:hover': { bgcolor: '#fee2e2' } }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            {searchTerm ? 'No matching blacklisted emails found' : 'The blacklist is currently empty'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Remove Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
                    Remove from Blacklist?
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Are you sure you want to remove <strong>{emailToRemove}</strong> from the blacklist?
                        This email will be able to register again.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} variant="outlined" color="primary">Cancel</Button>
                    <Button onClick={handleConfirmRemove} variant="contained" color="error">Remove</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BlacklistManagement;
