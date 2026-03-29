import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?next=/dashboard');
  }

  // Load user profile to get name - non-blocking (won't delay page render if it fails)
  // Profile query is wrapped in try-catch to ensure failures don't block page render
  let userName = null;
  let profilePictureUrl = null;
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, profile_picture_url')
      .eq('id', user.id)
      .single();

    if (!profileError && profile) {
      if (profile.first_name && profile.last_name) {
        userName = `${profile.first_name} ${profile.last_name}`;
      }
      if (profile.profile_picture_url) {
        profilePictureUrl = profile.profile_picture_url;
      }
    }
  } catch (error) {
    // If profile doesn't exist or error, userName will remain null
    // Don't block page render - this is non-critical data
    // Profile query failure should not prevent dashboard from loading
  }

  const handleLogout = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <DashboardContent
      userEmail={user.email}
      userName={userName}
      profilePictureUrl={profilePictureUrl}
      handleLogout={handleLogout}
    />
  );
}

