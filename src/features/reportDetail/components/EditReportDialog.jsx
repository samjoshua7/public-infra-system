import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { updateReportDetails } from '../api';

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'streetlight', label: 'Broken Streetlight' },
  { value: 'traffic_light', label: 'Broken Traffic Light' },
  { value: 'garbage', label: 'Uncollected Garbage' },
  { value: 'other', label: 'Other Issue' },
];

export const EditReportDialog = ({ open, onClose, report, onSaveSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [privacyLock, setPrivacyLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (report) {
      setTitle(report.title || '');
      setDescription(report.description || '');
      setCategory(report.category || 'other');
      setPrivacyLock(Boolean(report.privacy_lock));
      setError(null);
    }
  }, [report, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateReportDetails(report.report_id, {
        title: title.trim(),
        description: description.trim(),
        category,
        privacy_lock: privacyLock,
      });
      if (onSaveSuccess) {
        onSaveSuccess(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update report:', err);
      setError(err.message || 'Failed to update report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Report</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              disabled={submitting}
            />

            <FormControl fullWidth>
              <InputLabel id="edit-category-label">Category</InputLabel>
              <Select
                labelId="edit-category-label"
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              required
              fullWidth
              disabled={submitting}
            />

            {/* Privacy Lock Toggle in Edit Modal */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" sx={{ fontSize: 20 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">
                    Privacy Lock (Anonymous)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Keep this report anonymous to citizens, officials, and admins.
                  </Typography>
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={privacyLock}
                    onChange={(e) => setPrivacyLock(e.target.checked)}
                    disabled={submitting}
                    color="primary"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} /> : null}
          >
            Save Changes
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
