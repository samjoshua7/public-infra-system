import { supabase } from '../../lib/supabaseClient';

/**
 * Fetch system singleton settings (whatsapp_number, geofence config).
 * Readable by all users.
 */
export const getAppSettings = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('whatsapp_number, geofence_center_lat, geofence_center_lng, geofence_radius_km, updated_at')
    .eq('id', true)
    .maybeSingle();

  if (error) throw error;
  return data || {};
};

/**
 * Update system settings (admin-only).
 */
export const updateAppSettings = async ({
  whatsapp_number,
  geofence_center_lat,
  geofence_center_lng,
  geofence_radius_km,
}) => {
  const { data, error } = await supabase
    .from('app_settings')
    .update({
      whatsapp_number: whatsapp_number || null,
      geofence_center_lat: geofence_center_lat !== '' && geofence_center_lat !== null ? parseFloat(geofence_center_lat) : null,
      geofence_center_lng: geofence_center_lng !== '' && geofence_center_lng !== null ? parseFloat(geofence_center_lng) : null,
      geofence_radius_km: geofence_radius_km !== '' && geofence_radius_km !== null ? parseFloat(geofence_radius_km) : null,
    })
    .eq('id', true)
    .select()
    .single();

  if (error) throw error;
  return data;
};
