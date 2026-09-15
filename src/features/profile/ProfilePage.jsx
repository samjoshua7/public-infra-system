import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Avatar,
  Typography,
  Button,
  Grid,
  Chip,
  Tabs,
  Tab,
  CardMedia,
  Skeleton,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import GridOnIcon from '@mui/icons-material/GridOn';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';

import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { ReportDetailDialog } from '../officialDashboard/components/ReportDetailDialog';
import { signOut } from '../auth/api';
import { getUserProfileById, updateAccountPrivacyLock } from './api';

export const ProfilePage = () => {
  const { id: routeUserId } = useParams();
  const { user, profile: authProfile, role: authRole, isAuthenticated, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const targetUserId = routeUserId || user?.id;
  const isOwnProfile = !routeUserId || (user && routeUserId === user.id);

  const [activeTab, setActiveTab] = useState('reports');
  const [userReports, setUserReports] = useState([]);
  const [likedReports, setLikedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [privacyLock, setPrivacyLock] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  const [profileData, setProfileData] = useState(null);

  const loadProfileData = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch user profile
      let loadedProfile = null;
      if (isOwnProfile) {
        const ownData = await getUserProfileById(user?.id);
        loadedProfile = {
          name: ownData?.name || authProfile?.name || user?.email?.split('@')[0] || 'Citizen',
          email: user?.email,
          role: ownData?.role || authRole,
          anonymous_name: ownData?.anonymous_name || authProfile?.anonymous_name || 'LongGiraffe',
          privacy_lock: ownData?.privacy_lock ?? authProfile?.privacy_lock ?? false,
        };
        setPrivacyLock(Boolean(loadedProfile.privacy_lock));
      } else {
        const uData = await getUserProfileById(targetUserId);
        loadedProfile = uData || { name: 'Citizen', email: '', role: 'CITIZEN', privacy_lock: false };
      }
      setProfileData(loadedProfile);

      // If viewing someone else and their profile is privacy-locked, guard their reports
      if (!isOwnProfile && loadedProfile?.privacy_lock) {
        setUserReports([]);
        setLikedReports([]);
        setLoading(false);
        return;
      }

      // 2. Fetch user's own reports
      const { data: myReports } = await supabase
        .from('issue_reports')
        .select('*')
        .eq('reporter_id', targetUserId)
        .order('created_at', { ascending: false });

      setUserReports(myReports || []);

      // 3. Fetch user's liked reports
      const { data: likedRefs } = await supabase
        .from('report_likes')
        .select('report_id, issue_reports (*)')
        .eq('user_id', targetUserId);

      const resolvedLiked = (likedRefs || [])
        .map((item) => item.issue_reports)
        .filter(Boolean);
      setLikedReports(resolvedLiked);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isOwnProfile, authProfile, user, authRole]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleTogglePrivacyLock = async (e) => {
    if (!user?.id || updatingPrivacy) return;
    const nextVal = e.target.checked;
    setPrivacyLock(nextVal);
    setUpdatingPrivacy(true);
    try {
      await updateAccountPrivacyLock(user.id, nextVal);
      if (refreshProfile) await refreshProfile();
      setToastMessage(
        nextVal
          ? '🔒 Privacy Lock enabled! All your reports are now anonymous.'
          : 'Privacy Lock disabled. Your public profile is visible.'
      );
    } catch (err) {
      console.error('Failed to update privacy lock:', err);
      setPrivacyLock(!nextVal);
      setToastMessage('Failed to update Privacy Lock. Please try again.');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setToastMessage('Profile link copied to clipboard!');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  if (!isAuthenticated && !routeUserId) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="700" gutterBottom>
          Sign in to view your profile
        </Typography>
        <Button component={RouterLink} to="/login" variant="contained" color="primary" sx={{ mt: 2 }}>
          Log In
        </Button>
      </Container>
    );
  }

  const reportsCount = userReports.length;
  const supportsReceived = userReports.reduce((sum, r) => sum + (r.like_count || 0), 0);
  const resolvedCount = userReports.filter((r) => r.status === 'finished').length;

  const currentGridList = activeTab === 'reports' ? userReports : likedReports;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {/* Profile Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: { xs: 2, sm: 5 },
          mb: 4,
          pb: 3,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar
          sx={{
            width: { xs: 84, sm: 130 },
            height: { xs: 84, sm: 130 },
            bgcolor: 'secondary.main',
            fontSize: { xs: '2rem', sm: '3rem' },
            fontWeight: 700,
          }}
        >
          {(profileData?.name || 'U').charAt(0).toUpperCase()}
        </Avatar>

        {/* Profile Info & Actions */}
        <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'center' },
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h5" fontWeight="700">
              {profileData?.name || 'Citizen'}
            </Typography>

            <Chip
              label={
                profileData?.role === 'ADMIN'
                  ? 'Administrator'
                  : profileData?.role === 'GOVERNMENT_OFFICIAL'
                  ? 'Official'
                  : 'Citizen'
              }
              color={
                profileData?.role === 'ADMIN'
                  ? 'error'
                  : profileData?.role === 'GOVERNMENT_OFFICIAL'
                  ? 'warning'
                  : 'default'
              }
              size="small"
              sx={{ fontWeight: 700 }}
            />

            {/* Profile Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ShareOutlinedIcon />}
                onClick={handleShareProfile}
              >
                Share
              </Button>

              {isOwnProfile && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutIcon />}
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              )}
            </Box>
          </Box>

          {/* Citizen Statistics Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              gap: { xs: 3, sm: 4 },
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight="700" component="span">
                {reportsCount}{' '}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span">
                reports
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" fontWeight="700" component="span">
                {supportsReceived}{' '}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span">
                supports received
              </Typography>
            </Box>

            <Box>
              <Typography variant="body1" fontWeight="700" component="span">
                {resolvedCount}{' '}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span">
                resolved
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" fontWeight="600">
            Civic Contributor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Actively reporting public infrastructure issues to create safer streets for our city.
          </Typography>

          {/* Privacy Lock (Account-Wide) Card for Own Profile */}
          {isOwnProfile && (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <SecurityIcon color="primary" sx={{ fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight="700">
                    Privacy Lock (Account-Wide)
                  </Typography>
                  <Chip
                    label={privacyLock ? 'Active' : 'Disabled'}
                    color={privacyLock ? 'success' : 'default'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 480 }}>
                  When enabled, your identity is masked across <b>all</b> your reports. Other citizens, officials, and admins will only see your dummy alias:
                </Typography>
                <Box
                  sx={{
                    mt: 0.75,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.35,
                    borderRadius: 1.5,
                    bgcolor: 'action.hover',
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography variant="caption" fontWeight="700" color="primary.main">
                    🦒 {profileData?.anonymous_name || authProfile?.anonymous_name || 'LongGiraffe'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                    (Your Assigned Dummy Alias)
                  </Typography>
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(privacyLock)}
                    onChange={handleTogglePrivacyLock}
                    disabled={updatingPrivacy}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight="600">
                    {privacyLock ? 'Locked' : 'Public'}
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>
          )}

          {/* Privacy Protected notice if viewing someone else's locked profile */}
          {!isOwnProfile && profileData?.privacy_lock && (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <LockIcon color="warning" sx={{ fontSize: 24 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="700">
                  Profile Protected by Privacy Lock
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This citizen has enabled Privacy Lock. Their identity and activity are kept strictly anonymous to protect whistleblower safety.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* If viewing someone else with privacy lock, hide report list tabs */}
      {!isOwnProfile && profileData?.privacy_lock ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No public reports or activity available for protected citizen profiles.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 44,
                  gap: 1,
                },
              }}
            >
              <Tab icon={<GridOnIcon sx={{ fontSize: 18 }} />} label="Reports" value="reports" />
              {isOwnProfile && (
                <Tab icon={<FavoriteBorderIcon sx={{ fontSize: 18 }} />} label="Liked Issues" value="liked" />
              )}
            </Tabs>
          </Box>
      {loading ? (
        <Grid container spacing={1}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={4} key={i}>
              <Skeleton variant="rectangular" sx={{ width: '100%', pt: '100%', borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : currentGridList.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <GridOnIcon sx={{ fontSize: 50, mb: 1, opacity: 0.4 }} />
          <Typography variant="subtitle1" fontWeight="700">
            {activeTab === 'reports' ? 'No reports posted yet' : 'No liked reports yet'}
          </Typography>
          {isOwnProfile && activeTab === 'reports' && (
            <Button
              component={RouterLink}
              to="/report/new"
              variant="contained"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              sx={{ mt: 2 }}
            >
              Post your first report
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={{ xs: 0.5, sm: 1.5 }}>
          {currentGridList.map((report) => (
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
                  '&:hover .overlay': { opacity: 1 },
                }}
              >
                <CardMedia
                  component="img"
                  image={report.photo_url}
                  alt={report.title}
                  loading="lazy"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

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
      </>
      )}

      {/* Report Detail Modal */}
      <ReportDetailDialog
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onStatusUpdated={loadProfileData}
      />

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};
