import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Profile from './profile';

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: memories } = await supabase
        .from('memories')
        .select('id, content, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return <Profile initialMemories={memories ?? []} />;
}