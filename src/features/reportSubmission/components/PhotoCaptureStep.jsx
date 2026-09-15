import React, { useRef, useState } from 'react';
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
  Chip,
  Collapse,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MyLocationIcon from '@mui/icons-material/MyLocation';

import { SatelliteLocationPicker } from './SatelliteLocationPicker';

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
  address,
  addressLoading,
  onLocationChange,
}) => {
  const fileInputRef = useRef(null);
  const [showMap, setShowMap] = useState(false);

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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Take or select a photo of the public infrastructure issue. Your location will be captured automatically.
      </Typography>

      {/* Geolocation & Real Address Status Card */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, flexGrow: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: geoCoords ? 'primary.main' : geoError ? 'error.main' : 'action.selected',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.25,
              }}
            >
              <LocationOnIcon sx={{ fontSize: 20 }} />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight="700" sx={{ fontSize: '0.875rem' }}>
                Report Location & Coordinates
              </Typography>

              {geoLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                  <CircularProgress size={12} color="inherit" />
                  <Typography variant="caption" color="text.secondary">
                    Detecting GPS satellite fix...
                  </Typography>
                </Box>
              ) : geoCoords ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontWeight: 500 }}>
                    {geoCoords.latitude.toFixed(4)}, {geoCoords.longitude.toFixed(4)}
                  </Typography>

                  {/* Auto-filled Real Street Address */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                    {addressLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CircularProgress size={11} color="inherit" />
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Resolving street address...
                        </Typography>
                      </Box>
                    ) : address ? (
                      <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ fontSize: '0.8125rem', lineHeight: 1.3 }}>
                        📍 {address}
                      </Typography>
                    ) : null}
                  </Box>
                </>
              ) : (
                <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.25 }}>
                  {geoError || 'Location coordinates not captured yet.'}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Action Buttons: Show Satellite Map & Retry GPS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {geoCoords && (
              <Button
                size="small"
                variant={showMap ? 'contained' : 'outlined'}
                color="primary"
                startIcon={<SatelliteAltIcon sx={{ fontSize: 15 }} />}
                onClick={() => setShowMap((prev) => !prev)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  py: 0.4,
                  px: 1.25,
                  borderRadius: 1,
                }}
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            )}

            {geoError && (
              <Button size="small" variant="outlined" onClick={onRetryGeo} sx={{ textTransform: 'none' }}>
                Retry GPS
              </Button>
            )}
          </Box>
        </Box>

        {/* Expandable Interactive Satellite Map */}
        <Collapse in={showMap && Boolean(geoCoords)}>
          <Box sx={{ mt: 2, pt: 1.5, borderTop: (theme) => `1px dashed ${theme.palette.divider}` }}>
            {geoCoords && (
              <SatelliteLocationPicker
                latitude={geoCoords.latitude}
                longitude={geoCoords.longitude}
                onChangeLocation={onLocationChange}
                onRecenter={onRetryGeo}
              />
            )}
          </Box>
        </Collapse>
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
            borderRadius: '4px',
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
          <Paper sx={{ p: 1.5, mb: 3, bgcolor: 'action.hover', borderRadius: '4px' }}>
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
              color="primary"
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
