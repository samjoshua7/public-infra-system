import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Avatar, Button, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Link as RouterLink } from 'react-router-dom';

import { getDashboardStats } from './api';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { usePermissions } from '../../hooks/usePermissions';

export const OfficialDashboardPage = () => {
  const { assignedDepartments, isSuperOfficial } = usePermissions();
  const [scopeFilter, setScopeFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const deps = scopeFilter === 'my_departments' ? assignedDepartments : null;
      const dashboardStats = await getDashboardStats(deps);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Failed to load official dashboard stats:', err);
      setError(err.message || 'Failed to load stats. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, assignedDepartments]);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
              <DashboardIcon />
            </Avatar>
            <Typography variant="h4" component="h1" fontWeight="700">
              Government Official Dashboard
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Monitor incoming civic infrastructure reports and overall resolution metrics.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {!isSuperOfficial && assignedDepartments.length > 0 && (
            <ToggleButtonGroup
              size="small"
              value={scopeFilter}
              exclusive
              onChange={(_, val) => val && setScopeFilter(val)}
              aria-label="dashboard scope filter"
            >
              <ToggleButton value="all" sx={{ px: 2, fontWeight: 600 }}>
                Citywide
              </ToggleButton>
              <ToggleButton value="my_departments" sx={{ px: 2, fontWeight: 600 }}>
                My Department
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          <Button
            component={RouterLink}
            to="/dashboard/reports"
            variant="contained"
            color="primary"
            startIcon={<ViewListIcon />}
            sx={{ fontWeight: 600, px: 3, py: 1 }}
          >
            Manage Reports
          </Button>
        </Box>
      </Box>

      {/* Content */}
      <ErrorAlert message={error} onRetry={loadDashboardStats} />

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <DashboardAnalytics stats={stats} />
      )}
    </Box>
  );
};
