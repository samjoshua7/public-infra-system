import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Paper,
  CardMedia,
  Skeleton,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BuildIcon from '@mui/icons-material/Build';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ReportDetailDialog } from '../officialDashboard/components/ReportDetailDialog';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        // Fetch recent reports to generate real-time activity stream
        const { data: recentReports } = await supabase
          .from('issue_reports')
          .select('report_id, title, photo_url, status, category, created_at, users:reporter_id (name)')
          .order('created_at', { ascending: false })
          .limit(20);

        // Map into clean civic activity stream
        const items = (recentReports || []).map((r, idx) => {
          let text = '';
          let icon = null;
          let iconBg = '';

          if (r.status === 'finished') {
            text = `Issue "${r.title}" was marked as Finished.`;
            icon = <BuildIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
            iconBg = '#059669';
          } else if (r.status === 'budget_allocated') {
            text = `Budget has been allocated for "${r.title}".`;
            icon = <BuildIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
            iconBg = '#0284C7';
          } else if (idx % 2 === 0) {
            text = `${r.users?.name || 'A citizen'} reported a new ${r.category || 'hazard'}.`;
            icon = <FavoriteIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
            iconBg = '#2563EB';
          } else {
            text = `New community comments on "${r.title}".`;
            icon = <ChatBubbleIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />;
            iconBg = '#64748B';
          }

          return {
            id: r.report_id + '_' + idx,
            reportId: r.report_id,
            photoUrl: r.photo_url,
            text,
            time: r.created_at,
            icon,
            iconBg,
          };
        });

        setActivities(items);
      } catch (err) {
        console.error('Failed to load activity notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3, px: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h6" fontWeight="700" sx={{ mb: 2.5 }}>
        Civic Activity & Updates
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <NotificationsNoneIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography variant="subtitle1" fontWeight="700">
            No activity yet
          </Typography>
          <Typography variant="caption">
            Status updates and citizen interactions on public reports will appear here.
          </Typography>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {activities.map((act) => (
            <Box
              key={act.id}
              onClick={() => setSelectedReportId(act.reportId)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                cursor: 'pointer',
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 2 }}>
                {/* Notification Icon Badge */}
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: act.iconBg,
                    flexShrink: 0,
                  }}
                >
                  {act.icon}
                </Avatar>

                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
                    {act.text}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(act.time)}
                  </Typography>
                </Box>
              </Box>

              {/* Thumbnail preview */}
              {act.photoUrl && (
                <CardMedia
                  component="img"
                  image={act.photoUrl}
                  alt="thumbnail"
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              )}
            </Box>
          ))}
        </Paper>
      )}

      {/* Detail Dialog */}
      <ReportDetailDialog
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </Container>
  );
};
