/* eslint-disable no-console */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { auditService } from '../services/audit';


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
    // Set a global timeout for any DB operation to prevent "hanging indefinitely"
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Délai d'attente de la base de données dépassé (Timeout)")), 10000)
    );

    for (let i = 0; i < 3; i++) {
      try {
        const result = await Promise.race([operation(), timeoutPromise]);
        
        if (result?.error && (result.error.message?.includes('Lock') || result.error.name === 'AbortError')) {
          console.warn(`[SafeCall] Lock error detected in result (attempt ${i+1}), retrying...`);
          await new Promise(r => setTimeout(r, 400));
          continue;
        }
        return result;
      } catch (err) {
        if (err.message?.includes('Lock') || err.name === 'AbortError') {
          console.warn(`[SafeCall] Lock exception caught (attempt ${i+1}), retrying...`);
          lastError = err;
          await new Promise(r => setTimeout(r, 400));
          continue;
        }
        console.error("[SafeCall] Permanent error:", err.message);
        throw err;
      }
    }
    throw lastError || new Error("Échec de la communication avec la base de données après plusieurs tentatives.");
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

      if (error?.code === 'PGRST116' || !data) {
        // Autoprovision: check if user exists by email without auth_id mapped yet
        const { data: legacyUser } = await safeCall(() => supabase.from('utilisateurs').select('*').eq('email', authUser.email).maybeSingle());
        
        const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
        const nameParts = (fullName || '').split(' ');
        const finalRole = legacyUser?.role || 'patient';
        const finalNom = authUser.user_metadata?.nom || legacyUser?.nom || (nameParts.slice(1).join(' ') || nameParts[0] || 'User');
        const finalPrenom = authUser.user_metadata?.prenom || legacyUser?.prenom || nameParts[0] || 'Patient';
        const finalTelephone = authUser.user_metadata?.telephone || legacyUser?.telephone || null;

        if (finalRole !== 'patient') {
          const roleToSet = finalRole;
          const { data: updatedUtil } = await safeCall(() => supabase.from('utilisateurs').update({ auth_id: authUser.id }).eq('email', authUser.email).select().single());
          
          if (roleToSet === 'admin') { const { data: adm } = await safeCall(() => supabase.from('admins').select('id').eq('utilisateur_id', updatedUtil.id).maybeSingle()); if (!adm) await safeCall(() => supabase.from('admins').insert({ utilisateur_id: updatedUtil.id })); }
          if (roleToSet === 'radiologue') { const { data: rad } = await safeCall(() => supabase.from('radiologues').select('id').eq('utilisateur_id', updatedUtil.id).maybeSingle()); if (!rad) await safeCall(() => supabase.from('radiologues').insert({ utilisateur_id: updatedUtil.id })); }
          if (roleToSet === 'receptionniste') { const { data: ere } = await safeCall(() => supabase.from('receptionnistes').select('id').eq('utilisateur_id', updatedUtil.id).maybeSingle()); if (!ere) await safeCall(() => supabase.from('receptionnistes').insert({ utilisateur_id: updatedUtil.id })); }

          return { role: roleToSet, profileComplete: !!updatedUtil?.profil_complet, utilisateur: updatedUtil };
        } else {
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
              date_naissance: authUser.user_metadata?.date_naissance || null,
              sexe: authUser.user_metadata?.sexe || 'M',
              role: 'patient',
              profil_complet: !!finalTelephone
            };
            if (checkUtil) {
              const { data: updated } = await safeCall(() => supabase.from('utilisateurs').update(payload).eq('id', checkUtil.id).select().single());
              newUtil = updated;
            } else {
              const { data: inserted } = await safeCall(() => supabase.from('utilisateurs').insert(payload).select().single());
              newUtil = inserted;
            }
          } catch(e) { insErr = e; }
          
          if (insErr) {
            console.warn("Erreur synchronisation du profil:", insErr.message);
            return { role: 'patient', profileComplete: false, utilisateur: null };
          }
          
          if (newUtil) {
            const { data: existingPat } = await safeCall(() => supabase.from('patients').select('id').eq('utilisateur_id', newUtil.id).maybeSingle());
            if (!existingPat) {
              await safeCall(() => supabase.from('patients').insert({ utilisateur_id: newUtil.id }));
            }
          }
          return { role: 'patient', profileComplete: newUtil?.profil_complet || false, utilisateur: newUtil };
        }
      }

      // Fallback for no data and no error
      if (!data) {
        console.warn("[fetchUserRole] No utilisateur found and no error. Using guest profile.");
        return { role: 'patient', profileComplete: false, utilisateur: null };
      }

      let fetchedRole = data.role ? data.role.toLowerCase().trim() : 'patient';
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
    
    // Log success
    if (data?.user) {
      auditService.createAuditLog('Connexion', `L'utilisateur ${email} s'est connecté`, data.user.id).catch(console.warn);
    }
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
            age: userData.date_naissance ? Math.floor((new Date() - new Date(userData.date_naissance)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            date_naissance: userData.date_naissance || null,
            sexe: userData.sexe || 'M',
            manual_signup: true
          }
        }
      }));

      // RECOVERY: Handle "already registered" - could be React double-fire OR stuck unconfirmed account
      if (error && error.message?.includes('already registered')) {
        console.warn("[REGISTER] Already registered, attempting recovery login...");
        const loginRes = await safeCall(() => supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        }));
        
        if (!loginRes.error && loginRes.data?.session) {
          // Account exists and password matches — treat as login
          data = loginRes.data;
          error = null;
        } else if (loginRes.error?.message?.includes('Email not confirmed')) {
          // Account exists but email not confirmed — resend confirmation
          await supabase.auth.resend({ type: 'signup', email: userData.email });
          throw new Error("Un email de confirmation a été renvoyé. Vérifiez votre boîte mail et confirmez votre compte.");
        } else if (loginRes.error?.message?.includes('Invalid login credentials')) {
          // Email taken by another account with a different password
          throw new Error("Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.");
        } else {
          // Unknown error - try to proceed anyway since auth user was created
          error = null;
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
          
            const computedAge = userData.date_naissance ? Math.floor((new Date() - new Date(userData.date_naissance)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
            const payload = {
              auth_id: authUser.id,
              nom: userData.nom,
              prenom: userData.prenom,
              email: userData.email,
              telephone: userData.telephone || null,
              age: computedAge,
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
              await safeCall(() => supabase.from('patients').insert({ utilisateur_id: util.id, sexe: userData.sexe || 'M', date_naissance: userData.date_naissance || null }));
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
          
          // Log success
          auditService.createAuditLog('Inscription', `Nouvel utilisateur inscrit: ${userData.email}`, authUser.id).catch(console.warn);
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
