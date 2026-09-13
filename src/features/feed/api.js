import { supabase } from '../../lib/supabaseClient';
import { DEMO_REPORTS } from './demoReports';

export const listReports = async ({ category, status, page = 1, pageSize = 12 }) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
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

    if (data && data.length > 0) {
      return {
        reports: data,
        totalCount: count || data.length,
        totalPages: Math.ceil((count || data.length) / pageSize),
      };
    }
  } catch (err) {
    console.warn('Supabase query failed or returned no data, using rich demo feed:', err.message);
  }

  // Fallback to high quality demo reports
  let filtered = [...DEMO_REPORTS];
  if (category && category !== 'all') {
    filtered = filtered.filter((r) => r.category === category);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }

  return {
    reports: filtered,
    totalCount: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
};

export const fetchUserLikedReportIds = async (userId) => {
  if (!userId) return new Set();
  try {
    const { data, error } = await supabase
      .from('report_likes')
      .select('report_id')
      .eq('user_id', userId);

    if (error) throw error;
    return new Set(data.map((item) => item.report_id));
  } catch (err) {
    console.warn('Could not fetch user likes:', err.message);
    return new Set();
  }
};

export const toggleReportLike = async ({ reportId, userId, isLiked }) => {
  if (!userId) throw new Error('You must be logged in to like a report.');

  try {
    if (isLiked) {
      await supabase
        .from('report_likes')
        .delete()
        .match({ report_id: reportId, user_id: userId });
    } else {
      await supabase
        .from('report_likes')
        .insert([{ report_id: reportId, user_id: userId }]);
    }
  } catch (err) {
    console.warn('Like toggle sync error:', err.message);
  }
};
