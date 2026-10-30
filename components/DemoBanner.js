import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function DemoBanner() {
  return (
    <div className="demo-banner">
      <strong>Demo data</strong>
      {isSupabaseConfigured ? (
        <span> — you are logged out. Log in to manage your own leads.</span>
      ) : (
        <span>
          {' '}
          — Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to use your own data. Demo changes are not saved.
        </span>
      )}
    </div>
  );
}
