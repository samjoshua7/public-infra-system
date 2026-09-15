import { supabase } from '../../lib/supabaseClient';

/**
 * List all reports for government officials / admins, including hidden reports, with sorting and pagination.
 */
export const listReportsForOfficial = async ({
  status = 'all',
  category = 'all',
  assignedDepartments = null,
  page = 1,
  pageSize = 10,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const validSortColumns = ['title', 'category', 'created_at', 'like_count', 'status'];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const ascending = sortOrder === 'asc';

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
      privacy_lock,
      status,
      is_hidden,
      like_count,
      comment_count,
      created_at,
      users:reporter_id (name, email, anonymous_name, privacy_lock)
    `,
      { count: 'exact' }
    )
    .order(sortCol, { ascending })
    .range(from, to);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (category === 'my_departments' && assignedDepartments && !assignedDepartments.includes('all')) {
    if (assignedDepartments.length === 0) {
      query = query.in('category', ['__none__']);
    } else {
      query = query.in('category', assignedDepartments);
    }
  } else if (category && category !== 'all' && category !== 'my_departments') {
    query = query.eq('category', category);
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
 * Enforces forward-only transitions (ordered -> budget_allocated -> on_process -> finished) and role permissions in DB.
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

/**
 * Fetch overall statistics for the Official Dashboard.
 * Aggregates reports by category and status.
 */
export const getDashboardStats = async (assignedDepartments = null) => {
  let query = supabase
    .from('issue_reports')
    .select('status, category, created_at');

  if (assignedDepartments && !assignedDepartments.includes('all')) {
    if (assignedDepartments.length === 0) {
      query = query.in('category', ['__none__']);
    } else {
      query = query.in('category', assignedDepartments);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  const totalReports = data.length;
  const statusCounts = {};
  const categoryCounts = {};
  const timelineCounts = {};

  data.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    
    if (r.created_at) {
      const dateStr = new Date(r.created_at).toISOString().split('T')[0];
      timelineCounts[dateStr] = (timelineCounts[dateStr] || 0) + 1;
    }
  });

  return {
    totalReports,
    openReports: totalReports - (statusCounts['finished'] || 0),
    resolvedReports: statusCounts['finished'] || 0,
    statusCounts,
    categoryCounts,
    timelineCounts
  };
};
