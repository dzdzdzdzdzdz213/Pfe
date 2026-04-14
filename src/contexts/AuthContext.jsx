import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        setSession(session);
        setUser(session?.user || null);

        if (session?.user) {
          await fetchUserRole(session.user);
        }
      } catch (error) {
        console.error('Error fetching session:', error.message);
      } finally {
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    initializeAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {

        setSession(session);
        setUser(session?.user || null);

        try {
          if (session?.user) {
            await fetchUserRole(session.user);
          } else {
            setRole(null);
          }
        } catch (err) {
          console.error("Error in auth state change:", err);
        } finally {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found, auto-provision user as patient
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              role: 'patient'
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError.message);
            setRole(null);
          } else {
            setRole('patient');
          }
        } else {
          console.error('Error fetching role:', error.message);
          setRole(null);
        }
      } else {
        const fetchedRole = data?.role ? data.role.toLowerCase().trim() : null;
        setRole(fetchedRole);
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err.message);
      setRole(null);
    }
  };


  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {

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
        redirectTo: window.location.origin + '/login'
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
    loading,
    authInitialized
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
