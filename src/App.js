import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LandingScreen from './screens/LandingScreen';
import DashboardScreen from './screens/DashboardScreen';
import ReportSubmitScreen from './screens/ReportSubmitScreen';
import HotlinesScreen from './screens/HotlineScreen';
import ReportTrackerScreen from './screens/ReportTrackerScreen';
import DangerZoneMapScreen from './screens/DangerZoneMapScreen';
import AdminScreen from './screens/AdminScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing'); 
  const [userRole, setUserRole] = useState('GUEST'); 
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    checkExistingDeviceProfile();
  }, []);

  const checkExistingDeviceProfile = async () => {
    let localDeviceId = localStorage.getItem('agap_device_id');
    if (!localDeviceId) {
      localDeviceId = 'DEV-' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('agap_device_id', localDeviceId);
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', localDeviceId)
        .maybeSingle();

      if (data) {
        setUserProfile(data);
        setUserRole(data.user_role || 'GUEST');
      } else {
        // Auto-register new guest device into database on app launch
        const profileId = 'USER-' + Math.floor(100000 + Math.random() * 900000);
        const newGuestProfile = {
          id: profileId,
          device_id: localDeviceId,
          username: 'Guest User',
          full_name: 'Unverified Guest',
          user_role: 'GUEST',
          verification_status: 'GUEST',
          barangay: 'Batangas City'
        };

        const { data: createdProfile, error } = await supabase
          .from('profiles')
          .insert([newGuestProfile])
          .select()
          .maybeSingle();

        if (!error && createdProfile) {
          setUserProfile(createdProfile);
          setUserRole('GUEST');
        } else if (error) {
          // Fallback simple insert if .select() not supported by RLS
          await supabase.from('profiles').insert([newGuestProfile]);
          setUserProfile(newGuestProfile);
          setUserRole('GUEST');
        }
      }
    } catch (err) {
      console.log('Device registration check:', err.message);
    }
  };

  const handleResidentAccess = () => {
    if (userProfile && userProfile.full_name && userProfile.verification_status !== 'GUEST') {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('profile');
    }
  };

  const handleGuestAccess = () => {
    setUserRole('GUEST');
    setCurrentScreen('dashboard');
  };

  const handleNavigate = (screenKey) => {
    setCurrentScreen(screenKey);
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleAdminLogin = () => {
    setUserRole('ADMIN');
    setCurrentScreen('admin');
  };

  return (
    <div style={styles.appContainer}>
      <div style={styles.screenWrapper}>
        {currentScreen === 'landing' && (
          <LandingScreen
            onResidentAccess={handleResidentAccess}
            onGuestAccess={handleGuestAccess}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onNavigate={handleNavigate}
            userRole={userRole}
            onOpenProfile={() => setCurrentScreen('profile')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onBack={handleBackToDashboard}
            onAdminLogin={handleAdminLogin}
          />
        )}

        {currentScreen === 'submit-report' && (
          <ReportSubmitScreen
            onBack={handleBackToDashboard}
            onSubmitSuccess={handleBackToDashboard}
            userRole={userRole}
          />
        )}

        {currentScreen === 'hotlines' && (
          <HotlinesScreen
            onBack={handleBackToDashboard}
          />
        )}

        {currentScreen === 'tracker' && (
          <ReportTrackerScreen
            onBack={handleBackToDashboard}
          />
        )}

        {currentScreen === 'danger-map' && (
          <DangerZoneMapScreen
            onBack={handleBackToDashboard}
          />
        )}

        {currentScreen === 'admin' && (
          <AdminScreen
            onBack={handleBackToDashboard}
          />
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
    alignItems: 'center', fontFamily: "'Inter', sans-serif"
  },
  screenWrapper: {
    width: '100%',
    maxWidth: '440px',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  }
};