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
    .select('id, name, email, role, approval_status, active, created_at, assigned_departments', { count: 'exact' })
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
  const updatePayload = { role: newRole };
  // If promoting to GOVERNMENT_OFFICIAL and no departments assigned yet, default to all
  const { data: currentUser } = await supabase
    .from('users')
    .select('assigned_departments')
    .eq('id', userId)
    .single();

  if (newRole === 'GOVERNMENT_OFFICIAL' && (!currentUser?.assigned_departments || currentUser.assigned_departments.length === 0)) {
    updatePayload.assigned_departments = ['all'];
  }

  const { data, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', userId)
    .select('id, name, email, role, approval_status, active, created_at, assigned_departments')
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
    .select('id, name, email, role, approval_status, active, created_at, assigned_departments')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user assigned departments (admin-only).
 * departments: array of strings e.g. ['all'] or ['pothole', 'garbage']
 */
export const updateUserDepartments = async (userId, departments) => {
  const { data, error } = await supabase
    .from('users')
    .update({ assigned_departments: departments })
    .eq('id', userId)
    .select('id, name, email, role, approval_status, active, created_at, assigned_departments')
    .single();

  if (error) throw error;
  return data;
};
