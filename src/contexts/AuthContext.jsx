import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    session: null,
    role: null,
    loading: true,
    roleLoading: true,
    authInitialized: false
  });

  const fetchUserRole = useCallback(async (authUser) => {
    try {
      console.log("Fetching role for user:", authUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();
      
      console.log("DB Fetch Result -> Data:", data, "Error:", error);

      if (error && error.code === 'PGRST116') {
          // Legacy check & Autoprovision
          const { data: legacyUser } = await supabase.from('utilisateurs').select('*').eq('email', authUser.email).single();
          const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
          const nameParts = fullName.split(' ');
          const finalRole = legacyUser?.role || 'patient';
          const finalNom = legacyUser?.nom || (nameParts.slice(1).join(' ') || nameParts[0]);
          const finalPrenom = legacyUser?.prenom || nameParts[0];

          const { error: insertError } = await supabase.from('profiles').insert({
              id: authUser.id,
              role: finalRole,
              nom: finalNom,
              prenom: finalPrenom,
              telephone: legacyUser?.telephone || null
          });
          
          if (!insertError && !legacyUser) {
              const { data: newUtil } = await supabase.from('utilisateurs').insert({
                  nom: finalNom, prenom: finalPrenom, email: authUser.email, role: 'patient'
              }).select().single();
              if (newUtil) await supabase.from('patients').insert({ utilisateur_id: newUtil.id });
          }

          let roleToSet = finalRole.toLowerCase().trim();
          if (roleToSet === 'administrateur') roleToSet = 'admin';
          if (roleToSet === 'receptionniste') roleToSet = 'assistant';
          return roleToSet;
      }

      let fetchedRole = data?.role ? data.role.toLowerCase().trim() : null;
      if (fetchedRole === 'administrateur') fetchedRole = 'admin';
      if (fetchedRole === 'receptionniste') fetchedRole = 'assistant';
      return fetchedRole;
    } catch (err) {
      console.error('Unexpected error fetching role:', err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user || null;
        let role = null;
        if (authUser) {
          role = await fetchUserRole(authUser);
        }

        setState({
          session,
          user: authUser,
          role,
          loading: false,
          roleLoading: false,
          authInitialized: true
        });
      } catch (err) {
        console.error("Initialization error:", err);
        setState(prev => ({ ...prev, loading: false, roleLoading: false, authInitialized: true }));
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          role: null,
          loading: false,
          roleLoading: false,
          authInitialized: true
        });
        return;
      }

      const authUser = session?.user || null;
      if (authUser) {
        // Only trigger loading if we don't have a user or role yet, or if it's a sign-in event
        const shouldSetLoading = !state.user || !state.role || event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
        
        if (shouldSetLoading) {
          setState(prev => ({ ...prev, loading: true, roleLoading: true, session, user: authUser }));
        } else {
          setState(prev => ({ ...prev, session, user: authUser }));
        }

        const role = await fetchUserRole(authUser);
        setState({
          session,
          user: authUser,
          role,
          loading: false,
          roleLoading: false,
          authInitialized: true
        });
      }
    });

    return () => subscription?.unsubscribe();
  }, [fetchUserRole]);


  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' }
    });
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
