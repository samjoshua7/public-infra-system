import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Pagination,
  Button,
  Drawer,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';

import { listNearbyReports, fetchUserLikedReportIds, toggleReportLike } from './api';
import { FeedFilterPanel } from './components/FeedFilterPanel';
import { ReportCard } from './components/ReportCard';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';
import { useAuth } from '../../hooks/useAuth';
import { useUserLocation } from '../../hooks/useUserLocation';

export const FeedPage = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    coords,
    hasCoords,
    loading: loadingLocation,
    permissionStatus,
    requestLocation,
  } = useUserLocation();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [likedReportIds, setLikedReportIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Proximity, Category & Status Filters
  const [radiusKm, setRadiusKm] = useState(null); // null means 'All Nearby'
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNearbyReports({
        userLat: coords?.latitude ?? null,
        userLng: coords?.longitude ?? null,
        radiusKm,
        category,
        status,
        page,
        pageSize: 8,
      });
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
  }, [category, status, page, radiusKm, coords?.latitude, coords?.longitude, user?.id]);

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

  const activeFilterCount =
    (radiusKm !== null ? 1 : 0) +
    (category !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0);

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 0, lg: 3.5 },
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        {/* 1. Main Feed Stream Column (Centered & Clean) */}
        <Box
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            maxWidth: { xs: '100%', lg: '680px' },
            width: '100%',
          }}
        >
          {/* Stream Header (Compact single-line) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              pb: 1,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Nearby Civic Feed
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hasCoords
                  ? `Prioritizing closest issues ${radiusKm ? `within ${radiusKm} km` : 'in your vicinity'}`
                  : `Showing all ${totalCount} verified infrastructure complaints`}
              </Typography>
            </Box>

            {/* Mobile / Tablet Filter Button (< lg) */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1 }}>
              <Button
                variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                startIcon={<TuneIcon sx={{ fontSize: 16 }} />}
                onClick={() => setMobileFilterOpen(true)}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1.5,
                }}
              >
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Button>
            </Box>
          </Box>

          {/* Active Filter Chips Bar (Quick Dismiss Pills if active) */}
          {activeFilterCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="600">
                Active:
              </Typography>
              {radiusKm !== null && (
                <Chip
                  label={`< ${radiusKm} km`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => {
                    setRadiusKm(null);
                    setPage(1);
                  }}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
                />
              )}
              {category !== 'all' && (
                <Chip
                  label={category.replace('_', ' ')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => {
                    setCategory('all');
                    setPage(1);
                  }}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                />
              )}
              {status !== 'all' && (
                <Chip
                  label={status.replace('_', ' ')}
                  size="small"
                  color="primary"
                  variant="outlined"
                  onDelete={() => {
                    setStatus('all');
                    setPage(1);
                  }}
                  sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                />
              )}
              <Button
                size="small"
                onClick={() => {
                  setCategory('all');
                  setStatus('all');
                  setRadiusKm(null);
                  setPage(1);
                }}
                sx={{ fontSize: '0.75rem', py: 0.25, minWidth: 'auto', fontWeight: 600 }}
              >
                Clear all
              </Button>
            </Box>
          )}

          {/* Error Alert if any */}
          {error && (
            <Box sx={{ mb: 2 }}>
              <ErrorAlert message={error} onRetry={loadReports} />
            </Box>
          )}

          {/* Reports Feed Stream */}
          {loading ? (
            <LoadingSkeleton count={3} />
          ) : reports.length === 0 ? (
            <EmptyState
              title={radiusKm ? `No Reports Within ${radiusKm} km` : 'No Reports Found'}
              description={
                radiusKm
                  ? 'No infrastructure complaints were found within your chosen distance. Try selecting "All Nearby" or expanding your radius.'
                  : 'No infrastructure reports match this filter criteria. Be the first to report.'
              }
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
        </Box>

        {/* 2. Right Sticky Filter Rail (Desktop lg+) */}
        <Box
          sx={{
            width: 310,
            flexShrink: 0,
            display: { xs: 'none', lg: 'block' },
            position: 'sticky',
            top: 76,
            alignSelf: 'flex-start',
            zIndex: 10,
          }}
        >
          <FeedFilterPanel
            coords={coords}
            hasCoords={hasCoords}
            loadingLocation={loadingLocation}
            permissionStatus={permissionStatus}
            onRequestLocation={() => requestLocation().catch(() => {})}
            selectedRadius={radiusKm}
            onSelectRadius={(r) => {
              setRadiusKm(r);
              setPage(1);
            }}
            selectedCategory={category}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setPage(1);
            }}
            selectedStatus={status}
            onSelectStatus={(st) => {
              setStatus(st);
              setPage(1);
            }}
            onResetFilters={() => {
              setCategory('all');
              setStatus('all');
              setRadiusKm(null);
              setPage(1);
            }}
            totalCount={totalCount}
          />
        </Box>
      </Box>

      {/* 3. Mobile Filter Drawer (< lg) */}
      <Drawer
        anchor="bottom"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85vh',
            p: 2,
          },
        }}
      >
        <FeedFilterPanel
          coords={coords}
          hasCoords={hasCoords}
          loadingLocation={loadingLocation}
          permissionStatus={permissionStatus}
          onRequestLocation={() => requestLocation().catch(() => {})}
          selectedRadius={radiusKm}
          onSelectRadius={(r) => {
            setRadiusKm(r);
            setPage(1);
          }}
          selectedCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            setPage(1);
          }}
          selectedStatus={status}
          onSelectStatus={(st) => {
            setStatus(st);
            setPage(1);
          }}
          onResetFilters={() => {
            setCategory('all');
            setStatus('all');
            setRadiusKm(null);
            setPage(1);
          }}
          totalCount={totalCount}
          isMobile
          onClose={() => setMobileFilterOpen(false)}
        />
      </Drawer>
    </Box>
  );
};
