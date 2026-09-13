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
      is_hidden,
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

/**
 * Edit a report's own fields. Only works while status is still 'ordered' —
 * enforced server-side by the enforce_report_edit_rules() trigger (005
 * migration), so this will throw if the report has already moved past
 * 'ordered' or if the caller isn't the owner/an admin.
 */
export const updateReportDetails = async (reportId, { title, description, category }) => {
  const { data, error } = await supabase
    .from('issue_reports')
    .update({ title, description, category })
    .eq('report_id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Toggle whether a report is hidden from the public feed. Allowed any time
 * by the owner or an admin, regardless of status.
 */
export const setReportHidden = async (reportId, isHidden) => {
  const { data, error } = await supabase
    .from('issue_reports')
    .update({ is_hidden: isHidden })
    .eq('report_id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a report outright. Only allowed while status is still 'ordered'
 * (owner), or any time (admin) — enforced by RLS in the 005 migration.
 */
export const deleteReport = async (reportId) => {
  const { error } = await supabase.from('issue_reports').delete().eq('report_id', reportId);
  if (error) throw error;
};

export const addReportComment = async ({ reportId, userId, body, content }) => {
  const commentText = body || content;
  const { data, error } = await supabase
    .from('report_comments')
    .insert([
      {
        report_id: reportId,
        user_id: userId,
        body: commentText,
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
