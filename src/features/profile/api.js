import { supabase } from '../../lib/supabaseClient';

export const getUserProfileById = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, anonymous_name, privacy_lock, created_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data;
};

export const updateAccountPrivacyLock = async (userId, isLocked) => {
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('users')
    .update({ privacy_lock: Boolean(isLocked) })
    .eq('id', userId)
    .select('id, name, email, role, anonymous_name, privacy_lock')
    .single();

  if (error) {
    console.error('Failed to update privacy lock:', error);
    throw error;
  }
  return data;
};
