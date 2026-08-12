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
} from '@mui/material';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (report) {
      setTitle(report.title || '');
      setDescription(report.description || '');
      setCategory(report.category || 'other');
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
