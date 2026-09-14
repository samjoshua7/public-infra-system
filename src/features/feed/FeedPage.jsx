import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Pagination,
  Button,
  Container,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

import { listReports, fetchUserLikedReportIds, toggleReportLike } from './api';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { ReportCard } from './components/ReportCard';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { useAuth } from '../../hooks/useAuth';
import { STATUS_ORDER, STATUS_LABELS } from '../../lib/reportStatus';

export const FeedPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [reports, setReports] = useState([]);
  const [likedReportIds, setLikedReportIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Category & Status Filters
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listReports({ category, status, page, pageSize: 8 });
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
          ? { ...r, like_count: isLiked ? Math.max(0, (r.like_count || 1) - 1) : (r.like_count || 0) + 1 }
          : r
      )
    );

    try {
      await toggleReportLike({ reportId, userId: user.id, isLiked });
    } catch (err) {
      console.error('Failed to toggle like:', err);
      loadReports();
    }
  };

  return (
    <Container maxWidth="md" disableGutters sx={{ px: { xs: 1.5, sm: 2 }, py: 1 }}>
      {/* 1. Header Bar with Title & Report Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2.5,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="700" sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Public Feed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Tracking {totalCount} verified infrastructure reports
          </Typography>
        </Box>

        {isAuthenticated && (
          <Button
            component={RouterLink}
            to="/report/new"
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
            size="small"
          >
            Report Issue
          </Button>
        )}
      </Box>

      {/* 2. Crisp Category Filter Bar */}
      <CategoryFilterBar
        activeCategory={category}
        onSelectCategory={(cat) => {
          setCategory(cat);
          setPage(1);
        }}
      />

      {/* 3. Clean Status Filter Pills */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 3,
          overflowX: 'auto',
          pb: 0.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Chip
          label="All Statuses"
          clickable
          size="small"
          onClick={() => {
            setStatus('all');
            setPage(1);
          }}
          sx={{
            fontWeight: 600,
            fontSize: '0.8125rem',
            borderRadius: '4px',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: status === 'all' ? 'primary.main' : 'divider',
            bgcolor: status === 'all' ? 'primary.main' : 'background.paper',
            color: status === 'all' ? 'primary.contrastText' : 'text.secondary',
          }}
        />
        {STATUS_ORDER.map((st) => {
          const isSelected = status === st;
          return (
            <Chip
              key={st}
              label={STATUS_LABELS[st]}
              clickable
              size="small"
              onClick={() => {
                setStatus(st === status ? 'all' : st);
                setPage(1);
              }}
              sx={{
                fontWeight: 600,
                fontSize: '0.8125rem',
                borderRadius: '4px',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'primary.main' : 'background.paper',
                color: isSelected ? 'primary.contrastText' : 'text.secondary',
              }}
            />
          );
        })}

        {(category !== 'all' || status !== 'all') && (
          <Button
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
            onClick={() => {
              setCategory('all');
              setStatus('all');
              setPage(1);
            }}
            sx={{ fontSize: '0.75rem', py: 0.25, minWidth: 'auto', flexShrink: 0, fontWeight: 600 }}
          >
            Reset
          </Button>
        )}
      </Box>

      {/* Error Alert if any */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <ErrorAlert message={error} onRetry={loadReports} />
        </Box>
      )}

      {/* 4. Stream of Clean Report Cards */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Reports Found"
          description="No infrastructure reports match this filter criteria. Be the first to report."
          actionText={isAuthenticated ? 'Report an Issue' : 'Sign In to Report'}
          onAction={() => {}}
        />
      ) : (
        <>
          {reports.map((report) => (
            <ReportCard
              key={report.report_id}
              report={report}
              isLiked={likedReportIds.has(report.report_id)}
              onToggleLike={handleToggleLike}
              isAuth={isAuthenticated}
              onReportUpdated={(updated) => {
                setReports((prev) =>
                  prev.map((r) => (r.report_id === updated.report_id ? { ...r, ...updated } : r))
                );
              }}
              onReportDeleted={(deletedId) => {
                setReports((prev) => prev.filter((r) => r.report_id !== deletedId));
                setTotalCount((prev) => Math.max(0, prev - 1));
              }}
            />
          ))}

          {/* Clean Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                color="primary"
                shape="rounded"
                size="small"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};
