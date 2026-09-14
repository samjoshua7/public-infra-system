import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Typography,
  CardMedia,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';

import { listReports } from '../feed/api';
import { ReportDetailDialog } from '../officialDashboard/components/ReportDetailDialog';

const categoryOptions = [
  { id: 'all', label: 'All' },
  { id: 'pothole', label: 'Potholes' },
  { id: 'streetlight', label: 'Streetlights' },
  { id: 'traffic_light', label: 'Traffic' },
  { id: 'garbage', label: 'Garbage' },
  { id: 'other', label: 'Other' },
];

const categoryFallbackImages = {
  pothole: '/images/pothole.jpg',
  streetlight: '/images/streetlight.jpg',
  traffic_light: '/images/traffic_light.jpg',
  garbage: '/images/garbage.jpg',
  other: '/images/pothole.jpg',
};

export const ExplorePage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedReportId, setSelectedReportId] = useState(null);

  useEffect(() => {
    const fetchExploreReports = async () => {
      setLoading(true);
      try {
        const data = await listReports({ category: 'all', status: 'all', page: 1, pageSize: 36 });
        setReports(data.reports || []);
      } catch (err) {
        console.error('Failed to load explore reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExploreReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
      const search = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !search ||
        r.title?.toLowerCase().includes(search) ||
        r.description?.toLowerCase().includes(search) ||
        r.category?.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [reports, selectedCategory, searchTerm]);

  return (
    <Container maxWidth="md" sx={{ py: 3, px: { xs: 1, sm: 3 } }}>
      {/* Search Bar */}
      <Box sx={{ mb: 2.5 }}>
        <TextField
          fullWidth
          placeholder="Search reports by title, hazard, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: 1,
              bgcolor: 'background.paper',
            },
          }}
        />
      </Box>

      {/* Category Filter Chips */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          overflowX: 'auto',
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {categoryOptions.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            clickable
            color={selectedCategory === cat.id ? 'primary' : 'default'}
            variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
            onClick={() => setSelectedCategory(cat.id)}
            sx={{ fontWeight: 600, fontSize: '0.8125rem' }}
          />
        ))}
      </Box>

      {/* 3-Column Visual Reports Grid */}
      {loading ? (
        <Grid container spacing={1}>
          {[...Array(9)].map((_, i) => (
            <Grid item xs={4} key={i}>
              <Skeleton variant="rectangular" sx={{ width: '100%', pt: '100%', borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredReports.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <SearchIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography variant="subtitle1" fontWeight="700">
            No issues found
          </Typography>
          <Typography variant="caption">Try adjusting your search query or category filter.</Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 0.5, sm: 1.5 }}>
          {filteredReports.map((report) => (
            <Grid item xs={4} key={report.report_id}>
              <Box
                onClick={() => setSelectedReportId(report.report_id)}
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '100%',
                  cursor: 'pointer',
                  borderRadius: { xs: 0.5, sm: 2 },
                  overflow: 'hidden',
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#141414' : '#EAEAEA'),
                  '&:hover .overlay': {
                    opacity: 1,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={report.photo_url || categoryFallbackImages[report.category] || '/images/traffic_light.jpg'}
                  alt={report.title}
                  loading="lazy"
                  onError={(e) => {
                    const fallback = categoryFallbackImages[report.category] || '/images/traffic_light.jpg';
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Instagram Hover Overlay with Likes & Comments */}
                <Box
                  className="overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 1, sm: 2.5 },
                    color: '#FFFFFF',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FavoriteIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="700">
                      {report.like_count || 0}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ChatBubbleIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="700">
                      {report.comment_count || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Report Detail Modal */}
      <ReportDetailDialog
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </Container>
  );
};
