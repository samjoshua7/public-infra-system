import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  Chip,
  Pagination,
  Avatar,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';

import { listUsers, updateUserRole } from './api';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { useAuth } from '../../hooks/useAuth';

export const AdminUsersPage = () => {
  const { user: currentUser, refreshProfile } = useAuth();

  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers({ page, pageSize: 15 });
      setUsers(data.users);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to load user registry.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId, targetUserEmail, newRole) => {
    setUpdatingUserId(userId);
    try {
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      setToast({
        open: true,
        message: `Updated role for ${targetUserEmail} to ${newRole}`,
        severity: 'success',
      });

      if (userId === currentUser?.id) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Role update failed:', err);
      setToast({
        open: true,
        message: err.message || 'Failed to update user role.',
        severity: 'error',
      });
      // Refresh list to revert selection state
      loadUsers();
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return <Chip icon={<AdminPanelSettingsIcon />} label="Admin" color="error" size="small" sx={{ fontWeight: 700 }} />;
    }
    if (role === 'GOVERNMENT_OFFICIAL') {
      return <Chip icon={<SupervisorAccountIcon />} label="Official" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    }
    return <Chip icon={<PersonIcon />} label="Citizen" color="default" size="small" sx={{ fontWeight: 600 }} />;
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
            <AdminPanelSettingsIcon />
          </Avatar>
          <Typography variant="h4" component="h1" fontWeight="700">
            Admin User & Role Management
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage user accounts and re-assign operational roles across the platform.
        </Typography>
      </Box>

      {/* Content */}
      <ErrorAlert message={error} onRetry={loadUsers} />

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No Users Found"
          description="No registered user accounts found in the database."
          actionText="Refresh"
          onAction={loadUsers}
        />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }} aria-label="user roles table">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Current Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date Joined</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Change Role
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                          {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="700">
                            {u.name || 'User'}
                            {u.id === currentUser?.id && ' (You)'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </TableCell>

                    <TableCell>{getRoleBadge(u.role)}</TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(u.created_at)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <FormControl size="small" sx={{ minWidth: 170 }}>
                        <Select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                          disabled={updatingUserId === u.id}
                          startAdornment={
                            updatingUserId === u.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null
                          }
                          sx={{ fontSize: '0.875rem', fontWeight: 600 }}
                        >
                          <MenuItem value="CITIZEN">Citizen</MenuItem>
                          <MenuItem value="GOVERNMENT_OFFICIAL">Government Official</MenuItem>
                          <MenuItem value="ADMIN">Admin</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Snackbar Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
