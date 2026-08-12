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
import { signUp } from './api';
import { useAuth } from '../../hooks/useAuth';
import { ErrorAlert } from '../../components/feedback/ErrorAlert';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);

    try {
      await signUp({ email, password, name });
      await refreshProfile();

      const lowerEmail = email.trim().toLowerCase();
      if (lowerEmail === 'samjoshua.paldwin@gmail.com') {
        navigate('/admin', { replace: true });
      } else if (lowerEmail === 'samc.ug.24.cs@francisxavier.ac.in') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/waiting-approval', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
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
          <Typography variant="h5" component="h1" gutterBottom fontWeight="700">
            Create an Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join CivicSpeak in identifying and resolving public infrastructure issues across your community.
          </Typography>

          <ErrorAlert message={error} />

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password (min. 6 characters)"
              type="password"
              id="password"
              autoComplete="new-password"
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
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" underline="hover" fontWeight="600">
                  Log in
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
