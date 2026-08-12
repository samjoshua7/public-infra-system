import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Paper,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';


import { listReports, fetchUserLikedReportIds, toggleReportLike } from './api';
import { ReportCard } from './components/ReportCard';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { useAuth } from '../../hooks/useAuth';

export const FeedPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [reports, setReports] = useState([]);
  const [likedReportIds, setLikedReportIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReports({ category, status, page, pageSize: 9 });
      setReports(data.reports);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);

      if (user?.id) {
        const likedSet = await fetchUserLikedReportIds(user.id);
        setLikedReportIds(likedSet);
      }
    } catch (err) {
      console.error('Failed to load feed reports:', err);
      setError('Could not load reports. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, [category, status, page, user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleToggleLike = async (reportId) => {
    if (!isAuthenticated || !user?.id) return;

    const isLiked = likedReportIds.has(reportId);

    // Optimistic UI update
    setLikedReportIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(reportId);
      else next.add(reportId);
      return next;
    });

    setReports((prev) =>
      prev.map((r) =>
        r.report_id === reportId
          ? { ...r, like_count: isLiked ? Math.max(0, r.like_count - 1) : r.like_count + 1 }
          : r
      )
    );

    try {
      await toggleReportLike({ reportId, userId: user.id, isLiked });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert optimistic update on failure
      loadReports();
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Banner */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
            Public Infrastructure Feed
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View, track, and support infrastructure issues reported across your community.
          </Typography>
        </Box>
        {isAuthenticated && (
          <Button
            component={RouterLink}
            to="/report/new"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            size="medium"
          >
            Report Issue
          </Button>
        )}
      </Box>

      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <FilterListIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight="600">
              Filter by:
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={category}
              label="Category"
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="pothole">Pothole</MenuItem>
              <MenuItem value="streetlight">Streetlight</MenuItem>
              <MenuItem value="traffic_light">Traffic Light</MenuItem>
              <MenuItem value="garbage">Garbage</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={status}
              label="Status"
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="posted">Reported</MenuItem>
              <MenuItem value="action_taken">In Progress</MenuItem>
              <MenuItem value="fixed">Resolved</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            Showing {totalCount} report{totalCount === 1 ? '' : 's'}
          </Typography>
        </Box>
      </Paper>

      {/* Content */}
      <ErrorAlert message={error} onRetry={loadReports} />

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          description="No public reports match your selected filters. Try changing filters or post a new issue."
          actionText={isAuthenticated ? 'Report an Issue' : 'Sign In to Report'}
          onAction={() => {}}
        />
      ) : (
        <>
          <Grid container spacing={3}>
            {reports.map((report) => (
              <Grid item xs={12} sm={6} md={4} key={report.report_id}>
                <ReportCard
                  report={report}
                  isLiked={likedReportIds.has(report.report_id)}
                  onToggleLike={handleToggleLike}
                  isAuth={isAuthenticated}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
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
