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
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RefreshIcon from '@mui/icons-material/Refresh';

import { listReports, fetchUserLikedReportIds, toggleReportLike } from './api';
import { StoryBar } from './components/StoryBar';
import { InstagramPostCard } from './components/InstagramPostCard';
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
    <Container maxWidth="sm" disableGutters sx={{ px: { xs: 0, sm: 2 }, py: { xs: 0, sm: 2 } }}>
      {/* 1. Header Bar with Report Button & Title */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, sm: 0 },
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
            Civic Feed
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tracking {totalCount} local infrastructure reports
          </Typography>
        </Box>

        {isAuthenticated && (
          <Button
            component={RouterLink}
            to="/report/new"
            variant="contained"
            color="primary"
            startIcon={<AddCircleIcon sx={{ fontSize: 18 }} />}
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: 5,
              px: 2,
              boxShadow: '0 2px 8px rgba(0, 149, 246, 0.35)',
            }}
          >
            Report Issue
          </Button>
        )}
      </Box>

      {/* 2. Instagram Stories Category Bar */}
      <StoryBar
        activeCategory={category}
        onSelectCategory={(cat) => {
          setCategory(cat);
          setPage(1);
        }}
        activeStatus={status}
        onSelectStatus={(st) => {
          setStatus(st);
          setPage(1);
        }}
      />

      {/* 3. Instagram-Style Status Filter Pills */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: { xs: 2, sm: 0 },
          mb: 2.5,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Chip
          label="All Statuses"
          clickable
          size="small"
          variant={status === 'all' ? 'filled' : 'outlined'}
          color={status === 'all' ? 'primary' : 'default'}
          onClick={() => {
            setStatus('all');
            setPage(1);
          }}
          sx={{ fontWeight: 600 }}
        />
        {STATUS_ORDER.map((st) => {
          const isSelected = status === st;
          return (
            <Chip
              key={st}
              label={STATUS_LABELS[st]}
              clickable
              size="small"
              variant={isSelected ? 'filled' : 'outlined'}
              color={isSelected ? 'primary' : 'default'}
              onClick={() => {
                setStatus(st === status ? 'all' : st);
                setPage(1);
              }}
              sx={{ fontWeight: 600 }}
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
            sx={{ fontSize: '0.75rem', py: 0, minWidth: 'auto', flexShrink: 0, fontWeight: 600 }}
          >
            Reset
          </Button>
        )}
      </Box>

      {/* Error Alert if any */}
      <Box sx={{ px: { xs: 2, sm: 0 } }}>
        <ErrorAlert message={error} onRetry={loadReports} />
      </Box>

      {/* 4. Instagram Post Stream */}
      {loading ? (
        <Box sx={{ px: { xs: 2, sm: 0 } }}>
          <LoadingSkeleton count={2} />
        </Box>
      ) : reports.length === 0 ? (
        <Box sx={{ px: { xs: 2, sm: 0 } }}>
          <EmptyState
            title="No Reports Found"
            description="No infrastructure reports match this category yet. Be the first to report."
            actionText={isAuthenticated ? 'Report an Issue' : 'Sign In to Report'}
            onAction={() => {}}
          />
        </Box>
      ) : (
        <>
          {reports.map((report) => (
            <InstagramPostCard
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

          {/* Instagram-Style Clean Pagination */}
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
