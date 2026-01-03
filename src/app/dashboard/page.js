import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?next=/dashboard');
  }

  // Load user profile to get name
  let userName = null;
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profileError && profile && profile.first_name && profile.last_name) {
      userName = `${profile.first_name} ${profile.last_name}`;
    }
  } catch (error) {
    // If profile doesn't exist or error, userName will remain null
    console.error('Error loading user profile:', error);
  }

  const handleLogout = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return <DashboardContent userEmail={user.email} userName={userName} handleLogout={handleLogout} />;
}

