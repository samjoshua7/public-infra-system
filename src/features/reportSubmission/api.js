import { supabase } from '../../lib/supabaseClient';
import { dbCapabilities } from '../../lib/dbCapabilities';

export const uploadReportPhoto = async (file, userId) => {
  if (!file) throw new Error('No photo selected');

  const fileExt = file.name.split('.').pop();
  const fileName = `reports/${userId}_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('report-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from('report-photos').getPublicUrl(fileName);
  return data.publicUrl;
};

export const createIssueReport = async ({
  photoUrl,
  title,
  description,
  category,
  latitude,
  longitude,
  address,
  reporterId,
}) => {
  const basePayload = {
    photo_url: photoUrl,
    title,
    description,
    category,
    latitude,
    longitude,
    reporter_id: reporterId,
  };

  // If address is provided, try including it
  if (address) {
    const { data, error } = await supabase
      .from('issue_reports')
      .insert([{ ...basePayload, address }])
      .select()
      .single();

    if (!error && data) {
      dbCapabilities.setHasAddressColumn(true);
      return data;
    }

    if (error && (error.code === '42703' || error.message?.includes('address'))) {
      dbCapabilities.setHasAddressColumn(false);
      // Fall through to insert without address
    } else if (error) {
      console.error('Failed to create issue report:', error);
      throw new Error(`Failed to submit report: ${error.message}`);
    }
  }

  const { data, error } = await supabase
    .from('issue_reports')
    .insert([basePayload])
    .select()
    .single();

  if (error) {
    console.error('Failed to create issue report:', error);
    throw new Error(`Failed to submit report: ${error.message}`);
  }

  return data;
};

