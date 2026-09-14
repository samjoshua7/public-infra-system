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
  TableSortLabel,
  Chip,
  Button,
  IconButton,
  Pagination,
  Avatar,
  Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { listReportsForOfficial } from './api';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import {
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_COLORS,
  getNextStatus,
  getNextStatusLabel,
} from '../../lib/reportStatus';
import { ReportDetailDialog } from './components/ReportDetailDialog';
import { QuickAdvanceDialog } from './components/QuickAdvanceDialog';

const categoryLabels = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  traffic_light: 'Traffic Light',
  garbage: 'Garbage',
  other: 'Other',
};

export const OfficialDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting State
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [quickAdvanceReport, setQuickAdvanceReport] = useState(null);

  const loadOfficialReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReportsForOfficial({
        status: statusTab,
        page,
        pageSize,
        sortBy,
        sortOrder,
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
  }, [statusTab, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    loadOfficialReports();
  }, [loadOfficialReports]);

  const handleTabChange = (_, newValue) => {
    setStatusTab(newValue);
    setPage(1);
  };

  const handleSortRequest = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
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
          Monitor incoming civic infrastructure reports, track community likes, and advance report status through resolution.
        </Typography>
      </Box>

      {/* Status Tabs Paper */}
      <Paper sx={{ mb: 3, borderRadius: '6px' }}>
        <Tabs
          value={statusTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Reports" value="all" sx={{ fontWeight: 600 }} />
          {STATUS_ORDER.map((st) => (
            <Tab
              key={st}
              label={STATUS_LABELS[st]}
              value={st}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Content */}
      <ErrorAlert message={error} onRetry={loadOfficialReports} />

      {loading ? (
        <LoadingSkeleton count={5} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          description={`There are currently no reports with status "${STATUS_LABELS[statusTab] || statusTab}".`}
          actionText="Refresh Dashboard"
          onAction={loadOfficialReports}
        />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: '6px', overflow: 'hidden' }}>
            <Table size="small" sx={{ minWidth: 750 }} aria-label="official reports table">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'created_at'}
                      direction={sortBy === 'created_at' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('created_at')}
                    >
                      Date Reported
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'title'}
                      direction={sortBy === 'title' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('title')}
                    >
                      Report Title
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Location</TableCell>

                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'category'}
                      direction={sortBy === 'category' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('category')}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'status'}
                      direction={sortBy === 'status' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                    <TableSortLabel
                      active={sortBy === 'like_count'}
                      direction={sortBy === 'like_count' ? sortOrder : 'asc'}
                      onClick={() => handleSortRequest('like_count')}
                    >
                      Likes
                    </TableSortLabel>
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 700, py: 1.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => {
                  const nextStatus = getNextStatus(r.status);
                  const nextStatusLabel = getNextStatusLabel(r.status);

                  return (
                    <TableRow
                      key={r.report_id}
                      hover
                      onClick={() => setSelectedReportId(r.report_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {/* 1. Date Reported */}
                      <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" color="text.secondary" fontWeight="500">
                          {formatDate(r.created_at)}
                        </Typography>
                      </TableCell>

                      {/* 2. Report Title */}
                      <TableCell sx={{ py: 1, maxWidth: 280 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="600" noWrap>
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
                                sx={{ height: 18, fontSize: '0.6rem' }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      {/* 3. Location */}
                      <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {r.latitude != null && r.longitude != null
                            ? `${r.latitude.toFixed(3)}, ${r.longitude.toFixed(3)}`
                            : 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* 4. Category */}
                      <TableCell sx={{ py: 1 }}>
                        <Chip
                          label={categoryLabels[r.category] || r.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, height: 24 }}
                        />
                      </TableCell>

                      {/* 5. Status */}
                      <TableCell sx={{ py: 1 }}>
                        <Chip
                          label={STATUS_LABELS[r.status] || r.status}
                          color={STATUS_COLORS[r.status] || 'default'}
                          size="small"
                          sx={{ fontWeight: 700, height: 24 }}
                        />
                      </TableCell>

                      {/* 6. Likes (Compact inline format) */}
                      <TableCell sx={{ py: 1, whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FavoriteIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          <Typography variant="body2" fontWeight="700">
                            {r.like_count || 0}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* 7. Actions */}
                      <TableCell align="right" sx={{ py: 1 }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {r.status !== 'finished' && (
                            <Tooltip title={`Advance to ${nextStatusLabel}`}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={STATUS_COLORS[nextStatus] || 'primary'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickAdvanceReport(r);
                                  }}
                                >
                                  <ArrowForwardIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReportId(r.report_id);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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

      {/* Report Detail Dialog Popup */}
      <ReportDetailDialog
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onStatusUpdated={loadOfficialReports}
      />

      {/* Quick Advance Dialog Popup */}
      <QuickAdvanceDialog
        report={quickAdvanceReport}
        open={Boolean(quickAdvanceReport)}
        onClose={() => setQuickAdvanceReport(null)}
        onStatusUpdated={loadOfficialReports}
      />
    </Box>
  );
};
