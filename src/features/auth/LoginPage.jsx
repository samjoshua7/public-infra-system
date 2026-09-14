import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { signIn, getUserProfile } from './api';
import { useAuth } from '../../hooks/useAuth';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const authData = await signIn({ email, password });
      await refreshProfile();

      if (authData?.user?.id) {
        const profile = await getUserProfile(authData.user.id);
        const role = profile?.role || 'CITIZEN';
        const approval = profile?.approval_status || (role === 'CITIZEN' ? 'pending' : 'approved');

        if (role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else if (role === 'GOVERNMENT_OFFICIAL') {
          navigate('/dashboard', { replace: true });
        } else if (approval === 'approved') {
          navigate('/feed', { replace: true });
        } else {
          navigate('/waiting-approval', { replace: true });
        }
      } else {
        navigate('/feed', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', p: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5, textAlign: 'center' }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Civic Voice"
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                border: '2px solid',
                borderColor: 'divider',
                mb: 1.5,
              }}
            />
            <Typography variant="h5" component="h1" fontWeight="700">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to Civic Voice to track infrastructure reports and contribute to your community.
            </Typography>
          </Box>

          <ErrorAlert message={error} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" underline="hover" fontWeight="600">
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
