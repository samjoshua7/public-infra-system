import React from 'react';
import { Dialog, DialogContent } from '@mui/material';
import { ReportDetailContent } from '../../reportDetail/components/ReportDetailContent';

export const ReportDetailDialog = ({ reportId, onClose, onStatusUpdated }) => {
  return (
    <Dialog
      open={Boolean(reportId)}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="body"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1.5, sm: 2 },
          overflow: 'hidden',
          height: { xs: '92vh', md: '84vh' },
          maxHeight: '92vh',
          bgcolor: 'background.paper',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
          m: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {reportId && (
          <ReportDetailContent
            reportId={reportId}
            showBackToFeed={false}
            onClose={onClose}
            onStatusUpdated={onStatusUpdated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
