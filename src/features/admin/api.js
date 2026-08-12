import { supabase } from '../../lib/supabaseClient';

/**
 * List registered users for admin management.
 */
export const listUsers = async ({ page = 1, pageSize = 20 }) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('users')
    .select('id, name, email, role, active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    users: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

/**
 * Update user role. Protected by DB trigger trg_users_enforce_role_change (admin-only).
 */
export const updateUserRole = async (userId, newRole) => {
  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
    .select('id, name, email, role, active, created_at')
    .single();

  if (error) throw error;
  return data;
};
