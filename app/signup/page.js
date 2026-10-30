'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError('');
    setNotice('');
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setSaving(false);
    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      router.push('/');
    } else {
      setNotice('Account created. Check your email to confirm it, then log in.');
    }
  }

  return (
    <div className="form-card auth-card">
      <h1>Sign up</h1>
      <p className="sub">Create an account to manage your own leads.</p>
      {!isSupabaseConfigured ? (
        <p className="error">
          Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY, then this form will work. Meanwhile the app runs in
          demo mode.
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p>{notice}</p> : null}
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
          {saving ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
