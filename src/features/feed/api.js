import { supabase } from '../../lib/supabaseClient';
import { DEMO_REPORTS } from './demoReports';
import { calculateDistanceKm } from '../../lib/geoUtils';
import { dbCapabilities } from '../../lib/dbCapabilities';

/**
 * Fetch issues nearby user's GPS coordinates using get_nearby_reports RPC.
 * Automatically sorts by distance_km ASC and filters by radius.
 */
export const listNearbyReports = async ({
  userLat = null,
  userLng = null,
  radiusKm = null,
  category = 'all',
  status = 'all',
  page = 1,
  pageSize = 10,
} = {}) => {
  try {
    const { data, error } = await supabase.rpc('get_nearby_reports', {
      p_user_lat: userLat !== null && userLat !== undefined ? parseFloat(userLat) : null,
      p_user_lng: userLng !== null && userLng !== undefined ? parseFloat(userLng) : null,
      p_max_radius_km: radiusKm && radiusKm > 0 ? parseFloat(radiusKm) : null,
      p_category: category || 'all',
      p_status: status || 'all',
      p_page: page,
      p_page_size: pageSize,
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const totalCount = parseInt(data[0].total_count, 10) || data.length;
      return {
        reports: data.map((item) => ({
          ...item,
          distance_km: item.distance_km !== null ? parseFloat(item.distance_km) : null,
          privacy_lock: Boolean(item.privacy_lock),
          anonymous_name: item.anonymous_name || 'LongGiraffe',
          users: {
            name: item.reporter_name,
            email: item.reporter_email,
            anonymous_name: item.anonymous_name || 'LongGiraffe',
            privacy_lock: Boolean(item.privacy_lock),
          },
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    }

    return {
      reports: [],
      totalCount: 0,
      totalPages: 1,
    };
  } catch (err) {
    console.warn('RPC get_nearby_reports fallback to standard listReports:', err.message);
    const fallback = await listReports({ category, status, page, pageSize });
    if (userLat !== null && userLng !== null) {
      const enriched = fallback.reports.map((r) => ({
        ...r,
        distance_km: calculateDistanceKm(userLat, userLng, r.latitude, r.longitude),
      }));

      let filtered = enriched;
      if (radiusKm && radiusKm > 0) {
        filtered = enriched.filter((r) => r.distance_km !== null && r.distance_km <= radiusKm);
      }
      filtered.sort((a, b) => (a.distance_km ?? 99999) - (b.distance_km ?? 99999));
      return {
        ...fallback,
        reports: filtered,
      };
    }
    return fallback;
  }
};

export const listReports = async ({ category, status, page = 1, pageSize = 12 }) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const selectCols = dbCapabilities.hasAddressColumn
    ? `
        report_id,
        reporter_id,
        photo_url,
        title,
        description,
        category,
        latitude,
        longitude,
        address,
        privacy_lock,
        status,
        is_hidden,
        like_count,
        comment_count,
        created_at,
        users:reporter_id (name, email, anonymous_name, privacy_lock)
      `
    : `
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
      `;

  try {
    let query = supabase
      .from('issue_reports')
      .select(selectCols, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    let { data, error, count } = await query;
    if (error && dbCapabilities.hasAddressColumn && (error.code === '42703' || error.message?.includes('address'))) {
      dbCapabilities.setHasAddressColumn(false);
      return listReports({ category, status, page, pageSize });
    }
    if (error) throw error;

    if (data && data.length > 0) {
      return {
        reports: data.map((item) => ({ ...item, address: item.address || null })),
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
