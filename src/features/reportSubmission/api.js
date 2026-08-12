import { supabase } from '../../lib/supabaseClient';

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
  reporterId,
}) => {
  const { data, error } = await supabase
    .from('issue_reports')
    .insert([
      {
        photo_url: photoUrl,
        title,
        description,
        category,
        latitude,
        longitude,
        reporter_id: reporterId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Failed to create issue report:', error);
    throw new Error(`Failed to submit report: ${error.message}`);
  }

  return data;
};
