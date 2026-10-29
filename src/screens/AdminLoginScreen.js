import React, { useState } from 'react';
import { adminSupabase } from '../supabaseClient';
import { verifyAdminAccess } from '../services/adminService';

export default function AdminLoginScreen({ onBack, onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await adminSupabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await verifyAdminAccess();
      onAuthenticated();
    } catch (error) {
      await adminSupabase.auth.signOut();
      setErrorMessage(error.message || 'This account is not authorized for the admin portal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={onBack}>&lt; Back</button>
      <h2 style={styles.title}>CDRRMO Administrator Sign In</h2>
      <p style={styles.description}>Use an administrator account authorized by the AGAP system administrator.</p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>
          Email
          <input style={styles.input} type="email" autoComplete="username" value={email}
            onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label style={styles.label}>
          Password
          <input style={styles.input} type="password" autoComplete="current-password" value={password}
            onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {errorMessage && <div role="alert" style={styles.error}>{errorMessage}</div>}
        <button style={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: '440px', margin: '0 auto', padding: '24px', fontFamily: "'Inter', sans-serif" },
  backButton: { background: 'none', border: 0, color: '#0F766E', fontWeight: 700, cursor: 'pointer' },
  title: { color: '#0F172A', fontSize: '20px', marginTop: '28px' },
  description: { color: '#64748B', fontSize: '13px', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '24px' },
  label: { color: '#334155', display: 'flex', flexDirection: 'column', fontSize: '12px', fontWeight: 700, gap: '6px' },
  input: { border: '1px solid #CBD5E1', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px', padding: '10px' },
  error: { background: '#FEF2F2', borderRadius: '6px', color: '#B91C1C', fontSize: '12px', padding: '10px' },
  submit: { background: '#1E293B', border: 0, borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 800, padding: '12px' }
};
