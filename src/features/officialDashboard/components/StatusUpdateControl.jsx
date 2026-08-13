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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { updateReportStatus } from '../api';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  getNextStatus,
  getNextStatusLabel,
} from '../../../lib/reportStatus';

export const StatusUpdateControl = ({ reportId, currentStatus, onStatusUpdated }) => {
  const { canUpdateStatus } = usePermissions();

  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!canUpdateStatus) return null;

  const nextStatus = getNextStatus(currentStatus);
  const nextStatusLabel = getNextStatusLabel(currentStatus);
  const currentStatusLabel = STATUS_LABELS[currentStatus] || currentStatus;

  let buttonIcon = <TaskAltIcon />;
  let buttonColor = 'primary';

  if (nextStatus === 'budget_allocated') {
    buttonIcon = <AccountBalanceIcon />;
    buttonColor = 'info';
  } else if (nextStatus === 'on_process') {
    buttonIcon = <BuildIcon />;
    buttonColor = 'warning';
  } else if (nextStatus === 'finished') {
    buttonIcon = <CheckCircleIcon />;
    buttonColor = 'success';
  }

  const isCommentEmpty = note.trim().length === 0;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!nextStatus || !reportId || isCommentEmpty) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateReportStatus(reportId, nextStatus, note.trim());
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

      {currentStatus === 'finished' ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          This report is marked as <strong>Finished</strong>. The status pipeline is complete.
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleUpdate}>
          <Typography variant="body2" color="text.secondary" paragraph>
            Advance status from <strong>{currentStatusLabel}</strong> to{' '}
            <strong>{nextStatusLabel}</strong>:
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Comment (required)"
            placeholder="e.g. Work order created, budget approved, crew assigned, or repair verified..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            required
            error={note.length > 0 && isCommentEmpty}
            helperText={isCommentEmpty ? 'A comment is required to update the report status.' : ''}
            sx={{ mb: 2 }}
          />

          <Button
            type="submit"
            variant="contained"
            color={buttonColor}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : buttonIcon}
            disabled={submitting || isCommentEmpty}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? 'Updating...' : `Move to ${nextStatusLabel}`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};
