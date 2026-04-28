import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    utilisateur: null,
    session: null,
    role: null,
    profileComplete: false,
    loading: true,
    roleLoading: true,
    authInitialized: false
  });

  const fetchUserRole = useCallback(async (authUser) => {
    try {
      // Safety timeout: if the DB query hangs (e.g. broken RLS), resolve after 6s
      const queryPromise = supabase
        .from('utilisateurs')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 6000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error && error.code === 'PGRST116') {
          // Autoprovision: check if user exists by email without auth_id mapped yet
          const { data: legacyUser } = await supabase.from('utilisateurs').select('*').eq('email', authUser.email).single();
          const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
          const nameParts = fullName.split(' ');
          const finalRole = legacyUser?.role || 'patient';
          const finalNom = authUser.user_metadata?.nom || legacyUser?.nom || (nameParts.slice(1).join(' ') || nameParts[0]);
          const finalPrenom = authUser.user_metadata?.prenom || legacyUser?.prenom || nameParts[0];
          const finalTelephone = authUser.user_metadata?.telephone || legacyUser?.telephone || null;

          if (legacyUser) {
              const { data: updatedUtil } = await supabase.from('utilisateurs').update({
                  auth_id: authUser.id,
                  telephone: finalTelephone || legacyUser.telephone
              }).eq('id', legacyUser.id).select().single();
              
              let roleToSet = finalRole.toLowerCase().trim();
              if (roleToSet === 'administrateur') roleToSet = 'admin';
              if (roleToSet === 'assistant') roleToSet = 'receptionniste';

              // Ensure role-specific row exists
              if (roleToSet === 'patient') await supabase.from('patients').upsert({ utilisateur_id: updatedUtil.id }, { onConflict: 'utilisateur_id' });
              if (roleToSet === 'radiologue') await supabase.from('radiologues').upsert({ utilisateur_id: updatedUtil.id }, { onConflict: 'utilisateur_id' });
              if (roleToSet === 'receptionniste') await supabase.from('receptionnistes').upsert({ utilisateur_id: updatedUtil.id }, { onConflict: 'utilisateur_id' });

              return { role: roleToSet, profileComplete: !!updatedUtil?.profil_complet, utilisateur: updatedUtil };
          } else {
              const { data: newUtil } = await supabase.from('utilisateurs').insert({
                  auth_id: authUser.id,
                  nom: finalNom, 
                  prenom: finalPrenom, 
                  email: authUser.email, 
                  telephone: finalTelephone,
                  role: 'patient',
                  profil_complet: finalTelephone ? true : false
              }).select().single();
              if (newUtil) await supabase.from('patients').upsert({ utilisateur_id: newUtil.id }, { onConflict: 'utilisateur_id' });
              return { role: 'patient', profileComplete: newUtil?.profil_complet || false, utilisateur: newUtil };
          }
      }

      // Any other DB error (e.g. RLS infinite recursion) — don't hang, fail fast
      if (error) {
        console.error('DB error fetching utilisateur:', error.message, error.code);
        return { role: null, profileComplete: false, utilisateur: null };
      }

      let fetchedRole = data?.role ? data.role.toLowerCase().trim() : null;
      if (fetchedRole === 'administrateur') fetchedRole = 'admin';
      if (fetchedRole === 'assistant') fetchedRole = 'receptionniste';
      return { role: fetchedRole, profileComplete: !!data?.profil_complet, utilisateur: data };
    } catch (err) {
      if (err.message === 'DB_TIMEOUT') {
        console.error('fetchUserRole timed out — check RLS policies on utilisateurs table');
      } else {
        console.error('Unexpected error fetching utilisateur:', err.message);
      }
      return { role: null, profileComplete: false, utilisateur: null };
    }
  }, []);

  const stateRef = React.useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authUser = session?.user || null;
        let role = null;
        let utilisateur = null;
        let profileComplete = false;
        if (authUser) {
          const res = await fetchUserRole(authUser);
          role = res?.role;
          profileComplete = res?.profileComplete;
          utilisateur = res?.utilisateur;

          // NEW: Double check role-specific rows exist on every init
          if (utilisateur?.id) {
            if (role === 'patient') await supabase.from('patients').upsert({ utilisateur_id: utilisateur.id }, { onConflict: 'utilisateur_id' });
            if (role === 'radiologue') await supabase.from('radiologues').upsert({ utilisateur_id: utilisateur.id }, { onConflict: 'utilisateur_id' });
            if (role === 'receptionniste') await supabase.from('receptionnistes').upsert({ utilisateur_id: utilisateur.id }, { onConflict: 'utilisateur_id' });
          }
        }

        if (isMounted) {
          setState({
            session,
            user: authUser,
            utilisateur,
            role,
            profileComplete,
            loading: false,
            roleLoading: false,
            authInitialized: true
          });
        }
      } catch (err) {
        console.error("Initialization error:", err);
        if (isMounted) {
          setState(prev => ({ ...prev, loading: false, roleLoading: false, authInitialized: true }));
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // INITIAL_SESSION is already handled by initialize() above — skip to avoid race condition
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          utilisateur: null,
          session: null,
          role: null,
          profileComplete: false,
          loading: false,
          roleLoading: false,
          authInitialized: true
        });
        return;
      }

      const authUser = session?.user || null;
      if (authUser) {
        const currentState = stateRef.current;
        
        // Guard: If we already have the correct user/role, skip refetching 
        // to prevent UI flashes during TOKEN_REFRESHED or INITIAL_SESSION
        if (currentState.user?.id === authUser.id && currentState.role) {
          setState(prev => ({ ...prev, session, user: authUser }));
          return;
        }

        // Fresh login: set loading
        if (!currentState.user || !currentState.role) {
          setState(prev => ({ ...prev, loading: true, roleLoading: true, session, user: authUser }));
        } else {
          setState(prev => ({ ...prev, session, user: authUser }));
        }

        const res = await fetchUserRole(authUser);
        if (isMounted) {
          setState({
            session,
            user: authUser,
            utilisateur: res?.utilisateur,
            role: res?.role,
            profileComplete: res?.profileComplete,
            loading: false,
            roleLoading: false,
            authInitialized: true
          });
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
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

  const register = async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: `${userData.prenom} ${userData.nom}`,
          prenom: userData.prenom,
          nom: userData.nom,
          telephone: userData.telephone,
          age: userData.age,
          // Mark as manual signup so trigger sets profil_complet=true
          manual_signup: true
        }
      }
    });

    if (error) throw error;

    // If session is immediately available (email confirmation disabled),
    // the onAuthStateChange listener will handle the redirect.
    // If session is null (email confirmation required), we return a flag.
    return { ...data, requiresEmailConfirmation: !data.session };
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
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
