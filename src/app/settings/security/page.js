import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SecuritySettingsPage() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect('/login?next=/settings/security');
    }

    return (
        <div className="min-h-screen bg-base-200 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-base-100 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Security Settings</h1>
                    <p className="text-gray-600">Security settings page coming soon...</p>
                    <p className="text-sm text-gray-500 mt-4">User: {user.email}</p>
                </div>
            </div>
        </div>
    );
}

