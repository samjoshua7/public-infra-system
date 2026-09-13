import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

import { listReportComments, addReportComment } from '../api';
import { useAuth } from '../../../hooks/useAuth';

export const CommentsSheet = ({ open, onClose, report, onCommentAdded }) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!report?.report_id || !open) return;
    setLoading(true);
    try {
      const data = await listReportComments(report.report_id);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [report?.report_id, open]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!newComment.trim() || submitting || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const created = await addReportComment({
        reportId: report.report_id,
        userId: user?.id,
        body: newComment.trim(),
      });
      setComments((prev) => [created, ...prev]);
      setNewComment('');
      if (onCommentAdded) {
        onCommentAdded(report.report_id);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            maxHeight: '80vh',
            minHeight: '40vh',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: { sm: 600 },
            mx: { sm: 'auto' },
            pb: 'env(safe-area-inset-bottom, 0px)',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ width: 40 }} />
        <Typography variant="subtitle1" fontWeight="700">
          Comments ({comments.length})
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close comments">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Comments List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 44, mb: 1, opacity: 0.5 }} />
            <Typography variant="subtitle2" fontWeight="600">
              No comments yet
            </Typography>
            <Typography variant="caption">Start the conversation on this civic report.</Typography>
          </Box>
        ) : (
          comments.map((c) => (
            <Box key={c.comment_id} sx={{ display: 'flex', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'secondary.main',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {(c.users?.name || 'C').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" fontWeight="700" fontSize="0.8125rem">
                    {c.users?.name || 'Citizen'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(c.created_at)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 0.25, color: 'text.primary', wordBreak: 'break-word' }}>
                  {c.body || c.content}
                </Typography>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <Divider />

      {/* Input Form */}
      {isAuthenticated ? (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {(user?.email || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a civic comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 20,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
              },
            }}
          />
          <Button
            type="submit"
            disabled={!newComment.trim() || submitting}
            color="primary"
            variant="text"
            sx={{ fontWeight: 700, minWidth: 'auto', px: 1 }}
          >
            {submitting ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
          </Button>
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Please log in to add a comment.
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};
