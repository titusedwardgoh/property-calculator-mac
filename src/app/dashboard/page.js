import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const handleLogout = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return <DashboardContent userEmail={user.email} handleLogout={handleLogout} />;
}

