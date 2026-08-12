import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Pagination,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { listReportsForOfficial } from './api';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { useThemeMode } from '../../app/providers/ThemeModeProvider';
import { statusColors } from '../../app/theme/theme';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const OfficialDashboardPage = () => {
  const { mode } = useThemeMode();

  const [reports, setReports] = useState([]);
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOfficialReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReportsForOfficial({
        status: statusTab,
        page,
        pageSize: 10,
      });
      setReports(data.reports);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load official dashboard reports:', err);
      setError(err.message || 'Failed to load official reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusTab, page]);

  useEffect(() => {
    loadOfficialReports();
  }, [loadOfficialReports]);

  const handleTabChange = (_, newValue) => {
    setStatusTab(newValue);
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
            <DashboardIcon />
          </Avatar>
          <Typography variant="h4" component="h1" fontWeight="700">
            Government Official Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Monitor incoming civic infrastructure reports, review details, and advance status through the resolution pipeline.
        </Typography>
      </Box>

      {/* Status Tabs Paper */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={statusTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Reports" value="all" sx={{ fontWeight: 600 }} />
          <Tab label="Reported (Posted)" value="posted" sx={{ fontWeight: 600 }} />
          <Tab label="In Progress (Action Taken)" value="action_taken" sx={{ fontWeight: 600 }} />
          <Tab label="Resolved (Fixed)" value="fixed" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Paper>

      {/* Content */}
      <ErrorAlert message={error} onRetry={loadOfficialReports} />

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          description={`There are currently no reports with status "${statusTab.replace('_', ' ')}".`}
          actionText="Refresh Dashboard"
          onAction={loadOfficialReports}
        />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 700 }} aria-label="official reports table">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Report</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reporter</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => {
                  const statusConfig = statusColors[r.status] || statusColors.posted;
                  const statusStyle = statusConfig[mode] || statusConfig.light;

                  return (
                    <TableRow key={r.report_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            component="img"
                            src={r.photo_url}
                            alt={r.title}
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: 1.5,
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2" fontWeight="700" noWrap>
                                {r.title}
                              </Typography>
                              {r.is_hidden && (
                                <Tooltip title="Hidden from public feed">
                                  <Chip
                                    icon={<VisibilityOffOutlinedIcon fontSize="small" />}
                                    label="Hidden"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {r.description}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={categoryLabels[r.category] || r.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {r.users?.name || 'Citizen'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.users?.email || ''}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{formatDate(r.created_at)}</Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            fontWeight: 700,
                            border: `1px solid ${statusStyle.main}`,
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          to={`/report/${r.report_id}`}
                          variant="outlined"
                          size="small"
                          endIcon={<OpenInNewIcon fontSize="small" />}
                          sx={{ fontWeight: 600 }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </Box>
  );
};
