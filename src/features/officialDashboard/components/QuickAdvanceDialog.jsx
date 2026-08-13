import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  TextField,
  Box,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import BuildIcon from '@mui/icons-material/Build';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { updateReportStatus } from '../api';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  getNextStatus,
  getNextStatusLabel,
} from '../../../lib/reportStatus';

export const QuickAdvanceDialog = ({ report, open, onClose, onStatusUpdated }) => {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!report) return null;

  const currentStatus = report.status;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nextStatus || !report.report_id || isCommentEmpty) return;

    setSubmitting(true);
    setError(null);

    try {
      await updateReportStatus(report.report_id, nextStatus, note.trim());
      setNote('');
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to advance report status:', err);
      setError(err.message || 'Failed to advance status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="700">
          Advance Report Status
        </Typography>
        <IconButton aria-label="close" onClick={handleClose} sx={{ color: 'grey.500' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle2" fontWeight="700" gutterBottom noWrap>
            {report.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2, flexWrap: 'wrap' }}>
            <Chip
              label={currentStatusLabel}
              size="small"
              color={STATUS_COLORS[currentStatus] || 'default'}
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary" fontWeight="700">
              →
            </Typography>
            <Chip
              label={nextStatusLabel || 'Complete'}
              size="small"
              color={buttonColor}
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Enter a mandatory audit comment to advance status to <strong>{nextStatusLabel}</strong>:
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Comment (required)"
            placeholder="e.g. Work order issued, budget approved, crew assigned, or repair completed..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            required
            error={note.length > 0 && isCommentEmpty}
            helperText={isCommentEmpty ? 'A comment is required to advance status.' : ''}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={buttonColor}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : buttonIcon}
            disabled={submitting || isCommentEmpty || !nextStatus}
            sx={{ fontWeight: 700 }}
          >
            {submitting ? 'Updating...' : `Move to ${nextStatusLabel}`}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
