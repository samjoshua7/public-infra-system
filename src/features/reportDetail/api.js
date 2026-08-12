import { supabase } from '../../lib/supabaseClient';

export const getReportDetail = async (reportId) => {
  const { data, error } = await supabase
    .from('issue_reports')
    .select(
      `
      report_id,
      reporter_id,
      photo_url,
      title,
      description,
      category,
      latitude,
      longitude,
      status,
      like_count,
      comment_count,
      created_at,
      updated_at,
      users:reporter_id (name, email)
    `
    )
    .eq('report_id', reportId)
    .single();

  if (error) throw error;
  return data;
};

export const listReportComments = async (reportId) => {
  const { data, error } = await supabase
    .from('report_comments')
    .select(
      `
      comment_id,
      report_id,
      user_id,
      body,
      created_at,
      users:user_id (name, email, role)
    `
    )
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const addReportComment = async ({ reportId, userId, body }) => {
  const { data, error } = await supabase
    .from('report_comments')
    .insert([
      {
        report_id: reportId,
        user_id: userId,
        body,
      },
    ])
    .select(
      `
      comment_id,
      report_id,
      user_id,
      body,
      created_at,
      users:user_id (name, email, role)
    `
    )
    .single();

  if (error) throw error;
  return data;
};

export const listStatusHistory = async (reportId) => {
  const { data, error } = await supabase
    .from('report_status_history')
    .select(
      `
      history_id,
      report_id,
      status,
      changed_by,
      note,
      created_at,
      users:changed_by (name, role)
    `
    )
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};
