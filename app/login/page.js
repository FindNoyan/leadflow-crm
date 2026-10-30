'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSaving(false);
    if (signInError) {
      setError(signInError.message);
    } else {
      router.push('/');
    }
  }

  return (
    <div className="form-card auth-card">
      <h1>Log in</h1>
      <p className="sub">Log in to manage your own leads.</p>
      {!isSupabaseConfigured ? (
        <p className="error">
          Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY, then this form will work. Meanwhile the app runs in
          demo mode.
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={!isSupabaseConfigured}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={!isSupabaseConfigured}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={saving || !isSupabaseConfigured}>
          {saving ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        No account yet? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  );
}
