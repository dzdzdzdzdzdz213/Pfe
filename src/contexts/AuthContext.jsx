import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // --- DEVELOPER MOCK SESSION BYPASS ---
        const mockSessionStr = localStorage.getItem('demo_mock_session');
        if (mockSessionStr) {
          const mockData = JSON.parse(mockSessionStr);
          setSession(mockData.session);
          setUser(mockData.user);
          setRole(mockData.role);
          setLoading(false);
          return;
        }

        if (error) {
          throw error;
        }

        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } catch (error) {
        console.error('Error fetching session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Skip processing if in demo mock mode
        if (localStorage.getItem('demo_mock_session')) return;

        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching role:', error.message);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err.message);
    }
  };

  const login = async (email, password) => {
    // --- DEVELOPER MOCK LOGIN BYPASS ---
    const mockRoles = {
      'admin@demo.com': 'administrateur',
      'radiologue@demo.com': 'radiologue',
      'assistant@demo.com': 'receptionniste',
      'patient@demo.com': 'patient'
    };

    if (mockRoles[email] && password === 'demo') {
      const mockRole = mockRoles[email];
      const mockUser = { id: `demo-${mockRole}-id`, email };
      const mockSession = { access_token: 'demo-token', user: mockUser };
      
      setUser(mockUser);
      setSession(mockSession);
      setRole(mockRole);
      
      localStorage.setItem('demo_mock_session', JSON.stringify({
        user: mockUser,
        session: mockSession,
        role: mockRole
      }));
      
      return { user: mockUser, session: mockSession };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    // --- DEVELOPER MOCK SESSION LOGOUT ---
    if (localStorage.getItem('demo_mock_session')) {
      localStorage.removeItem('demo_mock_session');
      setUser(null);
      setSession(null);
      setRole(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/patient/dashboard'
      }
    });
    if (error) throw error;
    return data;
  };

  const value = {
    session,
    user,
    role,
    login,
    loginWithGoogle,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
