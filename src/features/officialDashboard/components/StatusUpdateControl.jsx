import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BuildIcon from '@mui/icons-material/Build';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { updateReportStatus } from '../api';
import { usePermissions } from '../../../hooks/usePermissions';

export const StatusUpdateControl = ({ reportId, currentStatus, onStatusUpdated }) => {
  const { canUpdateStatus } = usePermissions();

  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!canUpdateStatus) return null;

  let nextStatus = null;
  let actionLabel = '';
  let buttonIcon = null;
  let buttonColor = 'primary';

  if (currentStatus === 'posted') {
    nextStatus = 'action_taken';
    actionLabel = 'Mark Action Taken';
    buttonIcon = <BuildIcon />;
    buttonColor = 'warning';
  } else if (currentStatus === 'action_taken') {
    nextStatus = 'fixed';
    actionLabel = 'Mark Fixed';
    buttonIcon = <CheckCircleIcon />;
    buttonColor = 'success';
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!nextStatus || !reportId) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateReportStatus(reportId, nextStatus, note);
      setNote('');
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(err.message || 'Failed to update status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
        mb: 4,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TaskAltIcon color="primary" />
        <Typography variant="h6" fontWeight="700">
          Official Status Control
        </Typography>
        <Chip
          label="Government Official & Admin Access"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ ml: 'auto', fontWeight: 600 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {currentStatus === 'fixed' ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          This report is marked as <strong>Fixed</strong>. The status pipeline is complete.
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleUpdate}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Advance status from <strong>{currentStatus.replace('_', ' ')}</strong> to{' '}
            <strong>{nextStatus.replace('_', ' ')}</strong>:
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Audit Note (Optional)"
            placeholder="e.g. Work order issued, crew assigned, or repair completed..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            color={buttonColor}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : buttonIcon}
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? 'Updating...' : actionLabel}
          </Button>
        </Box>
      )}
    </Paper>
  );
};
