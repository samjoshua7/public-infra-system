import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReportDetailContent } from '../../reportDetail/components/ReportDetailContent';

export const ReportDetailDialog = ({ reportId, onClose, onStatusUpdated }) => {
  return (
    <Dialog
      open={Boolean(reportId)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '6px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="700">
          Report Audit Details
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {reportId && (
          <ReportDetailContent
            reportId={reportId}
            showBackToFeed={false}
            onStatusUpdated={onStatusUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
