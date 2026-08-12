import { supabase } from '../../lib/supabaseClient';

/**
 * List registered users for admin management with sorting and pagination.
 */
export const listUsers = async ({
  page = 1,
  pageSize = 10,
  sortBy = 'created_at',
  sortOrder = 'desc',
}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Map sort column names if needed
  const validSortColumns = ['name', 'email', 'role', 'approval_status', 'created_at'];
  const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const ascending = sortOrder === 'asc';

  const { data, error, count } = await supabase
    .from('users')
    .select('id, name, email, role, approval_status, active, created_at', { count: 'exact' })
    .order(sortCol, { ascending })
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
    .select('id, name, email, role, approval_status, active, created_at')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user approval status (pending/approved/rejected). Protected by DB trigger (admin-only).
 */
export const updateUserApprovalStatus = async (userId, newApprovalStatus) => {
  const { data, error } = await supabase
    .from('users')
    .update({ approval_status: newApprovalStatus })
    .eq('id', userId)
    .select('id, name, email, role, approval_status, active, created_at')
    .single();

  if (error) throw error;
  return data;
};
