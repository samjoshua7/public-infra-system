import React, { useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardMedia,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const PhotoCaptureStep = ({
  photoFile,
  photoPreview,
  onPhotoSelected,
  onProceed,
  analyzing,
  geoCoords,
  geoError,
  geoLoading,
  onRetryGeo,
  aiFillUpEnabled,
  onToggleAiFillUp,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelected(file);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" fontWeight="700" gutterBottom>
        Step 1: Capture & Upload Photo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Take or select a photo of the public infrastructure issue. Your location will be captured automatically.
      </Typography>

      {/* Geolocation Status Alert */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocationOnIcon color={geoCoords ? 'success' : geoError ? 'error' : 'action'} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" fontWeight="600">
              Location Coordinates
            </Typography>
            {geoLoading ? (
              <Typography variant="caption" color="text.secondary">
                Detecting GPS coordinates...
              </Typography>
            ) : geoCoords ? (
              <Typography variant="caption" color="success.main" fontWeight="600">
                <CheckCircleIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                Lat: {geoCoords.latitude.toFixed(6)}, Long: {geoCoords.longitude.toFixed(6)}
              </Typography>
            ) : (
              <Typography variant="caption" color="error.main">
                {geoError || 'Location coordinates not captured yet.'}
              </Typography>
            )}
          </Box>
          {geoError && (
            <Button size="small" onClick={onRetryGeo}>
              Retry GPS
            </Button>
          )}
        </Box>
      </Paper>

      {geoError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {geoError} Submission requires location permissions per civic audit rules.
        </Alert>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Photo Preview / Upload Area */}
      {!photoPreview ? (
        <Paper
          onClick={() => fileInputRef.current?.click()}
          sx={{
            p: 6,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'action.hover',
            transition: 'border-color 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.selected',
            },
          }}
        >
          <PhotoCameraIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight="600">
            Take or Choose a Photo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click here to open camera or browse files (JPEG, PNG, WebP)
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Card sx={{ mb: 2, overflow: 'hidden' }}>
            <CardMedia
              component="img"
              height="300"
              image={photoPreview}
              alt="Issue preview"
              sx={{ objectFit: 'cover' }}
            />
          </Card>

          {/* Opt-In AI Checkbox */}
          <Paper sx={{ p: 1.5, mb: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={aiFillUpEnabled}
                  onChange={(e) => onToggleAiFillUp(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2" fontWeight="600">
                    AI Fill-Up (auto-fill title, description & category)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Uses OpenRouter AI to analyze your photo and generate report details. Uncheck for manual entry.
                  </Typography>
                </Box>
              }
            />
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={analyzing}
            >
              Change Photo
            </Button>

            <Button
              variant="contained"
              color={aiFillUpEnabled ? 'secondary' : 'primary'}
              startIcon={
                analyzing ? (
                  <CircularProgress size={20} color="inherit" />
                ) : aiFillUpEnabled ? (
                  <AutoAwesomeIcon />
                ) : (
                  <ArrowForwardIcon />
                )
              }
              onClick={onProceed}
              disabled={analyzing || !geoCoords}
            >
              {analyzing
                ? 'Analyzing Photo with AI...'
                : aiFillUpEnabled
                ? 'Analyze Photo with AI'
                : 'Continue'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
