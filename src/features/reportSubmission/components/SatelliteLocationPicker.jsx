import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, ButtonGroup, Paper, Tooltip } from '@mui/material';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const OSM_STREET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const SatelliteLocationPicker = ({
  latitude,
  longitude,
  onChangeLocation,
  onRecenter,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapType, setMapType] = useState('satellite'); // 'satellite' | 'streets'

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === 'undefined' || !window.L) {
      console.warn('Leaflet (window.L) is not loaded yet');
      return;
    }

    const L = window.L;
    const initialLat = latitude || 8.7313;
    const initialLng = longitude || 77.7237;

    // Avoid double initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      maxZoom: 19,
      zoomControl: true,
    });

    // Add initial tile layer (Satellite)
    const initialTile = L.tileLayer(ESRI_SATELLITE_URL, {
      attribution: ESRI_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = initialTile;

    // Custom Draggable Pin
    const pinIcon = L.divIcon({
      className: 'civic-satellite-marker',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -100%);pointer-events:auto;cursor:grab;">
          <div style="background:#0F172A;color:#38BDF8;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.5);white-space:nowrap;margin-bottom:2px;border:1px solid rgba(56,189,248,0.4);">
            Move Pin to Spot
          </div>
          <svg width="34" height="42" viewBox="0 0 24 24" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.75" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,0.6));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [0, 0],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    // Marker Drag Event
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      if (onChangeLocation) {
        onChangeLocation({
          latitude: parseFloat(pos.lat.toFixed(6)),
          longitude: parseFloat(pos.lng.toFixed(6)),
        });
      }
    });

    // Map Click Event to jump pin
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      if (onChangeLocation) {
        onChangeLocation({
          latitude: parseFloat(e.latlng.lat.toFixed(6)),
          longitude: parseFloat(e.latlng.lng.toFixed(6)),
        });
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Trigger resize recalculation
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center & marker when coords change from outside
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (latitude == null || longitude == null) return;

    const currentPos = markerRef.current.getLatLng();
    const latDiff = Math.abs(currentPos.lat - latitude);
    const lngDiff = Math.abs(currentPos.lng - longitude);

    if (latDiff > 0.00005 || lngDiff > 0.00005) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Switch between Satellite and Streets
  const handleToggleMapType = (type) => {
    if (!mapInstanceRef.current || !window.L) return;
    setMapType(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const L = window.L;
    const url = type === 'satellite' ? ESRI_SATELLITE_URL : OSM_STREET_URL;
    const attribution = type === 'satellite' ? ESRI_ATTRIBUTION : OSM_ATTRIBUTION;

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        position: 'relative',
        bgcolor: '#0B132B',
        mb: 2.5,
      }}
    >
      {/* Top Controls Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          gap: 1,
        }}
      >
        <ButtonGroup
          size="small"
          variant="contained"
          sx={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            bgcolor: 'background.paper',
          }}
        >
          <Button
            onClick={() => handleToggleMapType('satellite')}
            variant={mapType === 'satellite' ? 'contained' : 'outlined'}
            color="primary"
            startIcon={<SatelliteAltIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, py: 0.25 }}
          >
            Satellite
          </Button>
          <Button
            onClick={() => handleToggleMapType('streets')}
            variant={mapType === 'streets' ? 'contained' : 'outlined'}
            color="primary"
            startIcon={<MapIcon sx={{ fontSize: 15 }} />}
            sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 600, py: 0.25 }}
          >
            Streets
          </Button>
        </ButtonGroup>

        {onRecenter && (
          <Tooltip title="Reset to Device GPS">
            <Button
              size="small"
              variant="contained"
              color="inherit"
              onClick={onRecenter}
              sx={{
                minWidth: 'auto',
                p: 0.75,
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <MyLocationIcon sx={{ fontSize: 16 }} />
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* Leaflet Map Div */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: { xs: 260, sm: 320 },
          cursor: 'crosshair',
        }}
      />

      {/* Bottom Floating Hint */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 1000,
          bgcolor: 'rgba(15, 23, 42, 0.85)',
          color: '#FFFFFF',
          px: 1.25,
          py: 0.5,
          borderRadius: 1,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
          💡 Click or drag the pin to position the issue accurately
        </Typography>
      </Box>
    </Paper>
  );
};
