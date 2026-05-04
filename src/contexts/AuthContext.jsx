import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';


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

  const isRegistering = React.useRef(false);

  // Helper to handle the "Lock broken" / "AbortError" race condition in Supabase
  const safeCall = async (operation) => {
    let lastError;
    for (let i = 0; i < 3; i++) {
      try {
        const result = await operation();
        // Check if the result itself has a lock error (some methods return {error})
        if (result?.error && (result.error.message?.includes('Lock') || result.error.name === 'AbortError')) {
          console.warn(`[SafeCall] Lock error detected in result (attempt ${i+1}), retrying...`);
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        return result;
      } catch (err) {
        if (err.message?.includes('Lock') || err.name === 'AbortError') {
          console.warn(`[SafeCall] Lock exception caught (attempt ${i+1}), retrying...`);
          lastError = err;
          await new Promise(r => setTimeout(r, 300));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  const fetchUserRole = useCallback(async (authUser) => {
    console.log("[fetchUserRole] Checking role for:", authUser.email, authUser.id);
    try {
      // Retry up to 3 times to handle timing gap between trigger and query
      let data = null;
      let error = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await safeCall(() => supabase
          .from('utilisateurs')
          .select('*')
          .eq('auth_id', authUser.id)
          .maybeSingle()
        );
        data = result.data;
        error = result.error;
        
        if (data) {
          console.log("[fetchUserRole] Found user record on attempt", attempt);
          break;
        }
        if (error) {
          console.error("[fetchUserRole] Query error:", error);
          break;
        }
        console.log("[fetchUserRole] User record not found yet, retrying...", attempt);
        await new Promise(r => setTimeout(r, 800));
      }

      if (error && error.code === 'PGRST116') {
        // Autoprovision: check if user exists by email without auth_id mapped yet
        const { data: legacyUser } = await safeCall(() => supabase.from('utilisateurs').select('*').eq('email', authUser.email).maybeSingle());
        
        const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
        const nameParts = fullName.split(' ');
        const finalRole = legacyUser?.role || 'patient';
        const finalNom = authUser.user_metadata?.nom || legacyUser?.nom || (nameParts.slice(1).join(' ') || nameParts[0]);
        const finalPrenom = authUser.user_metadata?.prenom || legacyUser?.prenom || nameParts[0];
        const finalTelephone = authUser.user_metadata?.telephone || legacyUser?.telephone || null;

        if (legacyUser) {
          const { data: updatedUtil } = await safeCall(() => supabase.from('utilisateurs').update({
            auth_id: authUser.id,
            telephone: finalTelephone || legacyUser.telephone
          }).eq('id', legacyUser.id).select().single());

          let roleToSet = finalRole.toLowerCase().trim();
          if (roleToSet === 'administrateur') roleToSet = 'admin';
          if (roleToSet === 'assistant') roleToSet = 'receptionniste';

          // Ensure role-specific row exists
          if (roleToSet === 'patient') { const { data: ep } = await safeCall(() => supabase.from('patients').select('id').eq('utilisateur_id', updatedUtil.id).maybeSingle()); if (!ep) await safeCall(() => supabase.from('patients').insert({ utilisateur_id: updatedUtil.id })); }
          if (roleToSet === 'radiologue') { const { data: er } = await safeCall(() => supabase.from('radiologues').select('id').eq('utilisateur_id', updatedUtil.id).maybeSingle()); if (!er) await safeCall(() => supabase.from('radiologues').insert({ utilisateur_id: updatedUtil.id })); }
          if (roleToSet === 'receptionniste') { const { data: ere } = await safeCall(() => supabase.from('receptionnistes').select('id').eq('utilisateur_id', updatedUtil.id).maybeSingle()); if (!ere) await safeCall(() => supabase.from('receptionnistes').insert({ utilisateur_id: updatedUtil.id })); }

          return { role: roleToSet, profileComplete: !!updatedUtil?.profil_complet, utilisateur: updatedUtil };
        } else {
          // Use safe check-then-update/insert instead of upsert to avoid missing unique constraint errors
          let newUtil = null;
          let insErr = null;
          try {
            const { data: checkUtil } = await safeCall(() => supabase.from('utilisateurs').select('*').eq('auth_id', authUser.id).maybeSingle());
            const payload = {
              auth_id: authUser.id,
              nom: finalNom,
              prenom: finalPrenom,
              email: authUser.email,
              telephone: finalTelephone,
              age: authUser.user_metadata?.age || null,
              role: 'patient',
              profil_complet: finalTelephone ? true : false
            };
            if (checkUtil) {
              const { data: updated, error } = await safeCall(() => supabase.from('utilisateurs').update(payload).eq('id', checkUtil.id).select().single());
              newUtil = updated; insErr = error;
            } else {
              const { data: inserted, error } = await safeCall(() => supabase.from('utilisateurs').insert(payload).select().single());
              newUtil = inserted; insErr = error;
            }
          } catch(e) { insErr = e; }
          
          if (insErr) {
            console.warn("Erreur mineure de synchronisation du profil:", insErr.message);
            // Don't block login. Return what we know.
            return { role: 'patient', profileComplete: false, utilisateur: null };
          }
          
          if (newUtil) {
            // Check if patient row already exists
            const { data: existingPat } = await safeCall(() => supabase.from('patients').select('id').eq('utilisateur_id', newUtil.id).maybeSingle());
            if (!existingPat) {
              await safeCall(() => supabase.from('patients').insert({ utilisateur_id: newUtil.id }));
            }
          }
          return { role: 'patient', profileComplete: newUtil?.profil_complet || false, utilisateur: newUtil };
        }
      }

      // Any other DB error (e.g. RLS infinite recursion) — don't hang, fail fast
      if (error && !error.message?.includes('Lock')) {
        console.error('DB error fetching utilisateur:', error.message, error.code);
        toast.error('Erreur DB fetch role: ' + error.message);
        return { role: null, profileComplete: false, utilisateur: null };
      } else if (error && error.message?.includes('Lock')) {
        console.warn('Supabase JS Auth Lock error caught and ignored in fetchUserRole');
      }

      let fetchedRole = data?.role ? data.role.toLowerCase().trim() : null;
      if (fetchedRole === 'administrateur') fetchedRole = 'admin';
      if (fetchedRole === 'assistant') fetchedRole = 'receptionniste';
      return { role: fetchedRole, profileComplete: !!data?.profil_complet, utilisateur: data };
    } catch (err) {
      if (err.message === 'DB_TIMEOUT') {
        console.error('fetchUserRole timed out — check RLS policies on utilisateurs table');
        toast.error('Délai d\'attente dépassé pour la base de données. Vérifiez RLS.');
      } else {
        console.error('Unexpected error fetching utilisateur:', err.message);
        toast.error('Erreur inattendue: ' + err.message);
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
            if (role === 'patient') { const { data: ep } = await supabase.from('patients').select('id').eq('utilisateur_id', utilisateur.id).maybeSingle(); if (!ep) await supabase.from('patients').insert({ utilisateur_id: utilisateur.id }); }
            if (role === 'radiologue') { const { data: er } = await supabase.from('radiologues').select('id').eq('utilisateur_id', utilisateur.id).maybeSingle(); if (!er) await supabase.from('radiologues').insert({ utilisateur_id: utilisateur.id }); }
            if (role === 'receptionniste') { const { data: ere } = await supabase.from('receptionnistes').select('id').eq('utilisateur_id', utilisateur.id).maybeSingle(); if (!ere) await supabase.from('receptionnistes').insert({ utilisateur_id: utilisateur.id }); }
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

      // CRITICAL: If we are currently in the middle of a manual registration,
      // skip the automatic listener to prevent race conditions and double-inserts.
      if (isRegistering.current) {
        console.log("[AuthListener] Skipping because manual registration is in progress.");
        return;
      }

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
    if (isRegistering.current) return;
    
    isRegistering.current = true;
    try {
      console.log("[REGISTER] Attempting account creation for:", userData.email);
      let { data, error } = await safeCall(() => supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: window.location.origin + '/login',
          data: {
            full_name: `${userData.prenom} ${userData.nom}`,
            prenom: userData.prenom,
            nom: userData.nom,
            telephone: userData.telephone,
            age: userData.age,
            manual_signup: true
          }
        }
      }));

      // RECOVERY: Handle React 18 double-fire race condition
      if (error && error.message?.includes('already registered')) {
        console.warn("[REGISTER] Double-fire detected, attempting recovery login...");
        const loginRes = await safeCall(() => supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        }));
        
        if (!loginRes.error && loginRes.data?.session) {
          data = loginRes.data;
          error = null;
        } else {
          throw new Error("Cet email est déjà utilisé par un autre compte.");
        }
      }

      if (error) throw error;

      // data.user always exists even without email confirmation
      // data.session is null when email confirmation is required
      const authUser = data?.user;

      if (authUser) {
        console.log("[REGISTER] Provisioning profile for:", authUser.id);

        // Wait a moment for the DB trigger to create the row
        await new Promise(r => setTimeout(r, 600));

        // 1. Check if trigger already created the utilisateur row
        let util = null;
        try {
          const { data: existingUtil } = await safeCall(() => supabase.from('utilisateurs').select('*').eq('auth_id', authUser.id).maybeSingle());
          
          const payload = {
            auth_id: authUser.id,
            nom: userData.nom,
            prenom: userData.prenom,
            email: userData.email,
            telephone: userData.telephone || null,
            age: userData.age || null,
            role: 'patient',
            profil_complet: true
          };

          if (existingUtil) {
            // Update with the full name from the form (trigger may have used email as nom)
            const { data: updated } = await safeCall(() => supabase.from('utilisateurs').update(payload).eq('id', existingUtil.id).select().single());
            util = updated || existingUtil;
          } else {
            // Trigger didn't run yet, insert manually
            const { data: inserted } = await safeCall(() => supabase.from('utilisateurs').insert(payload).select().single());
            util = inserted;
          }
        } catch(e) {
          console.warn("[REGISTER] Utilisateur provisioning warning:", e.message);
        }

        // 2. Ensure patient row exists
        if (util?.id) {
          try {
            const { data: existingPat } = await safeCall(() => supabase.from('patients').select('id').eq('utilisateur_id', util.id).maybeSingle());
            if (!existingPat) {
              await safeCall(() => supabase.from('patients').insert({ utilisateur_id: util.id }));
            }
          } catch(e) {
            console.warn("[REGISTER] Patient row warning:", e.message);
          }
        }

        // 3. If we have a live session, update state immediately for instant redirect
        if (data?.session) {
          setState(prev => ({
            ...prev,
            user: authUser,
            session: data.session,
            utilisateur: util,
            role: 'patient',
            profileComplete: true,
            loading: false,
            roleLoading: false
          }));
        }
        
        console.log("[REGISTER] Registration & Provisioning complete.");
      }

      return { ...data, requiresEmailConfirmation: !data?.session };
    } finally {
      setTimeout(() => { isRegistering.current = false; }, 1000);
    }
  };

  const loginWithGoogle = async () => {
    const redirectTo = window.location.origin + '/login';
    console.log("[GOOGLE] Redirecting to:", redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
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
