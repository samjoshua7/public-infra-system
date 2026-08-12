import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';


export const EmptyState = ({
  title = 'No reports found',
  description = 'There are no infrastructure reports matching your criteria.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <Box
      sx={{
        py: 8,
        px: 2,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          color: 'text.secondary',
          mb: 2,
          '& > svg': { fontSize: 48, opacity: 0.7 },
        }}
      >
        {icon || <InboxOutlinedIcon />}
      </Box>
      <Typography variant="h6" gutterBottom color="text.primary">
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxW: 400, mb: actionText ? 3 : 0 }}
      >
        {description}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Box>
  );
};
