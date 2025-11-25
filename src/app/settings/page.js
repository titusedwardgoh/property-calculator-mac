import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login?next=/settings');
    }

    // Redirect to account page by default
    redirect('/settings/account');
}

