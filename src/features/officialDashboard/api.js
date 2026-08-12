import { supabase } from '../../lib/supabaseClient';

/**
 * List all reports for government officials / admins, including hidden reports.
 */
export const listReportsForOfficial = async ({ status = 'all', page = 1, pageSize = 12 }) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
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
      users:reporter_id (name, email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    reports: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

/**
 * Update report status using authoritative Supabase RPC update_report_status.
 * Enforces forward-only transitions (posted -> action_taken -> fixed) and role permissions in DB.
 */
export const updateReportStatus = async (reportId, newStatus, note = '') => {
  const { data, error } = await supabase.rpc('update_report_status', {
    p_report_id: reportId,
    p_new_status: newStatus,
    p_note: note.trim() || null,
  });

  if (error) throw error;
  return data;
};
