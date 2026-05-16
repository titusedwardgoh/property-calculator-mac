/**
 * Find an auth user by email (case-insensitive) via the service role client.
 * @returns {import('@supabase/supabase-js').User | null}
 */
export async function findAuthUserByEmail(serviceClient, email) {
  if (!serviceClient || !email) return null;

  const normalized = email.trim().toLowerCase();
  const { data: { users }, error } = await serviceClient.auth.admin.listUsers();

  if (error) {
    throw error;
  }

  return (
    users.find((user) => user.email?.toLowerCase() === normalized) ?? null
  );
}
