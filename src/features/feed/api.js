import { supabase } from '../../lib/supabaseClient';

export const listReports = async ({ category, status, page = 1, pageSize = 12 }) => {
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

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

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

export const fetchUserLikedReportIds = async (userId) => {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('report_likes')
    .select('report_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch user likes:', error);
    return new Set();
  }

  return new Set(data.map((item) => item.report_id));
};

export const toggleReportLike = async ({ reportId, userId, isLiked }) => {
  if (!userId) throw new Error('You must be logged in to like a report.');

  if (isLiked) {
    // Remove like
    const { error } = await supabase
      .from('report_likes')
      .delete()
      .match({ report_id: reportId, user_id: userId });
    if (error) throw error;
  } else {
    // Add like
    const { error } = await supabase
      .from('report_likes')
      .insert([{ report_id: reportId, user_id: userId }]);
    if (error) throw error;
  }
};
