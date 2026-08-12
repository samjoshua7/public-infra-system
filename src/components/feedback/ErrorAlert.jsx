import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

export const ErrorAlert = ({
  title = 'An error occurred',
  message,
  onRetry,
  sx,
}) => {
  if (!message) return null;

  return (
    <Box sx={{ my: 2, ...sx }}>
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Box>
  );
};
