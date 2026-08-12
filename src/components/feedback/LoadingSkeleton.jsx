import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  if (type === 'detail') {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="text" height={40} width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={24} width="30%" sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2, mb: 2 }} />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {Array.from(new Array(count)).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" height={28} width="80%" sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="40%" sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
