import { supabase } from '../../lib/supabaseClient';

/**
 * Fetch paginated notifications for the authenticated user.
 */
export const listNotifications = async ({
  page = 1,
  pageSize = 20,
  type = 'all',
} = {}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('notifications')
    .select(
      `
      id,
      user_id,
      type,
      title,
      message,
      subtext,
      report_id,
      read,
      created_at,
      issue_reports:report_id (
        report_id,
        title,
        photo_url,
        category,
        status
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    notifications: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

/**
 * Get total unread notifications count for current user.
 */
export const getUnreadNotificationsCount = async () => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);

  if (error) throw error;
  return count || 0;
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Mark all unread notifications as read for current user.
 */
export const markAllNotificationsAsRead = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false)
    .select();

  if (error) throw error;
  return data || [];
};

/**
 * Delete/dismiss a notification.
 */
export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
  return true;
};
