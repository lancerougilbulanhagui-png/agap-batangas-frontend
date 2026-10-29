import React, { useEffect, useState } from 'react';
import { adminSupabase, supabase } from './supabaseClient';
import { verifyAdminAccess } from './services/adminService';
import LandingScreen from './screens/LandingScreen';
import DashboardScreen from './screens/DashboardScreen';
import ReportSubmitScreen from './screens/ReportSubmitScreen';
import HotlinesScreen from './screens/HotlineScreen';
import ReportTrackerScreen from './screens/ReportTrackerScreen';
import DangerZoneMapScreen from './screens/DangerZoneMapScreen';
import AdminScreen from './screens/AdminScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [userRole, setUserRole] = useState('GUEST');
  const [userProfile, setUserProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [startupError, setStartupError] = useState('');

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        let user = session?.user;
        if (!user) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          user = data.user;
        }
        if (!user) throw new Error('Supabase did not create an authenticated guest session.');

        let deviceId = localStorage.getItem('agap_device_id');
        if (!deviceId) {
          deviceId = `DEV-${Math.floor(100000 + Math.random() * 900000)}`;
          localStorage.setItem('agap_device_id', deviceId);
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        let resolvedProfile = profile;
        if (!resolvedProfile) {
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: `USER-${user.id}`,
              auth_user_id: user.id,
              device_id: deviceId,
              username: 'Guest User',
              full_name: 'Unverified Guest',
              user_role: 'GUEST',
              verification_status: 'GUEST',
              barangay: 'Batangas City'
            })
            .select()
            .single();
          if (createError) throw createError;
          resolvedProfile = createdProfile;
        }

        let administrator = false;
        const { data: { session: adminSession }, error: adminSessionError } =
          await adminSupabase.auth.getSession();
        if (adminSessionError) throw adminSessionError;
        if (adminSession?.access_token) {
          try {
            await verifyAdminAccess();
            administrator = true;
          } catch (error) {
            await adminSupabase.auth.signOut();
            if (error.message !== 'Administrator sign-in is required.') {
              console.warn('Saved admin session is no longer authorized:', error.message);
            }
          }
        }

        if (active) {
          setUserProfile(resolvedProfile);
          setUserRole(administrator ? 'ADMIN' : 'GUEST');
          if (administrator) setCurrentScreen('admin');
          setAuthReady(true);
        }
      } catch (error) {
        if (active) {
          setStartupError(error.message || 'Unable to initialize the AGAP authentication session.');
          setAuthReady(true);
        }
      }
    };

    initialize();
    return () => { active = false; };
  }, []);

  const handleResidentAccess = () => {
    if (userProfile?.full_name && userProfile.verification_status !== 'GUEST') {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('profile');
    }
  };

  const handleGuestAccess = () => {
    setUserRole('GUEST');
    setCurrentScreen('dashboard');
  };

  const handleAdminAuthenticated = () => {
    setUserRole('ADMIN');
    setCurrentScreen('admin');
  };

  const handleAdminLogout = async () => {
    const { error } = await adminSupabase.auth.signOut();
    if (error) {
      setStartupError(`Admin sign-out failed: ${error.message}`);
      return;
    }
    setUserRole('GUEST');
    setCurrentScreen('dashboard');
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.screenWrapper}>
        {!authReady ? (
          <div style={styles.message}>Connecting securely to AGAP...</div>
        ) : startupError ? (
          <div role="alert" style={styles.error}>
            <strong>AGAP could not start.</strong>
            <p>{startupError}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <>
            {currentScreen === 'landing' && (
              <LandingScreen onResidentAccess={handleResidentAccess} onGuestAccess={handleGuestAccess} />
            )}
            {currentScreen === 'dashboard' && (
              <DashboardScreen
                onNavigate={setCurrentScreen}
                userRole={userRole}
                onOpenProfile={() => setCurrentScreen('profile')}
              />
            )}
            {currentScreen === 'profile' && (
              <ProfileScreen
                onBack={() => setCurrentScreen('dashboard')}
                onAdminLogin={() => setCurrentScreen('admin-login')}
              />
            )}
            {currentScreen === 'admin-login' && (
              <AdminLoginScreen
                onBack={() => setCurrentScreen('profile')}
                onAuthenticated={handleAdminAuthenticated}
              />
            )}
            {currentScreen === 'submit-report' && (
              <ReportSubmitScreen
                onBack={() => setCurrentScreen('dashboard')}
                onSubmitSuccess={() => setCurrentScreen('dashboard')}
                userRole={userRole}
              />
            )}
            {currentScreen === 'hotlines' && <HotlinesScreen onBack={() => setCurrentScreen('dashboard')} />}
            {currentScreen === 'tracker' && <ReportTrackerScreen onBack={() => setCurrentScreen('dashboard')} />}
            {currentScreen === 'danger-map' && <DangerZoneMapScreen onBack={() => setCurrentScreen('dashboard')} />}
            {currentScreen === 'admin' && <AdminScreen onBack={handleAdminLogout} />}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Inter', sans-serif"
  },
  screenWrapper: {
    width: '100%',
    maxWidth: '440px',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  },
  message: { padding: '32px', color: '#334155', textAlign: 'center' },
  error: { margin: '24px', padding: '16px', background: '#FEF2F2', color: '#991B1B', borderRadius: '8px' }
};
