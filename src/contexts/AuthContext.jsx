import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
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
        .from('utilisateurs')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found, this is a new user (likely via Google OAuth)
          const [prenom, ...nomParts] = (authUser.user_metadata?.full_name || '').split(' ');
          const nom = nomParts.length > 0 ? nomParts.join(' ') : (authUser.user_metadata?.name || '');
          const finalNom = nom || authUser.email?.split('@')[0] || 'Patient';
          const finalPrenom = prenom || 'Nouveau';

          const { error: insertError } = await supabase
            .from('utilisateurs')
            .insert({
              id: authUser.id,
              email: authUser.email,
              nom: finalNom,
              prenom: finalPrenom,
              role: 'patient',
              telephone: '0000000000'
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError.message);
            // If they signed in with google, forcefully let them in as patient anyway
            if (authUser.app_metadata?.provider === 'google') {
              setRole('patient');
            } else {
              setRole(null);
            }
          } else {
            // Try to create the patient record quietly
            try {
              await supabase.from('patients').insert({ utilisateur_id: authUser.id, date_naissance: new Date().toISOString() });
            } catch (err) {
              console.error('Could not create patient record', err);
            }
            setRole('patient');
          }
        } else {
          console.error('Error fetching role:', error.message);
          // Fallback if db is completely failing for a google user
          if (authUser.app_metadata?.provider === 'google') {
            setRole('patient');
          } else {
            setRole(null);
          }
        }
      } else {
        const fetchedRole = data?.role ? data.role.toLowerCase() : null;
        if (!fetchedRole && authUser.app_metadata?.provider === 'google') {
          setRole('patient');
        } else {
          setRole(fetchedRole);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err.message);
      if (authUser.app_metadata?.provider === 'google') {
        setRole('patient');
      } else {
        setRole(null);
      }
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
