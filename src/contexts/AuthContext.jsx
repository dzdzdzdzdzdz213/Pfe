import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
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
    setRoleLoading(true);
    try {
      console.log("Fetching role for user:", authUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();
      
      console.log("DB Fetch Result -> Data:", data, "Error:", error);

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found in profiles. Check if they exist in legacy utilisateurs table by email!
          const { data: legacyUser } = await supabase
            .from('utilisateurs')
            .select('*')
            .eq('email', authUser.email)
            .single();

          // Extract names from Google metadata to satisfy NOT NULL constraints
          const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
          const nameParts = fullName.split(' ');
          const parsedPrenom = nameParts[0];
          const parsedNom = nameParts.slice(1).join(' ') || parsedPrenom;

          // Merge data intelligently
          const finalRole = legacyUser?.role || 'patient';
          const finalNom = legacyUser?.nom || parsedNom;
          const finalPrenom = legacyUser?.prenom || parsedPrenom;
          const finalTelephone = legacyUser?.telephone || null;

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              role: finalRole,
              nom: finalNom,
              prenom: finalPrenom,
              telephone: finalTelephone
            });
            
          // If they are brand new (no legacy user), we also MUST insert them into utilisateurs to save the dashboards!
          if (!insertError && !legacyUser) {
             const { data: newUtilisateur } = await supabase
               .from('utilisateurs')
               .insert({
                 nom: finalNom,
                 prenom: finalPrenom,
                 email: authUser.email,
                 role: 'patient' // Always patient for brand new
               })
               .select()
               .single();
               
             // Safely seed the patients table
             if (newUtilisateur) {
                 await supabase.from('patients').insert({
                     utilisateur_id: newUtilisateur.id
                 });
             }
          }

          if (insertError) {
            console.error('Error creating user profile:', insertError.message);
            setRole(null);
          } else {
            let roleToSet = finalRole.toLowerCase().trim();
            if (roleToSet === 'administrateur') roleToSet = 'admin';
            if (roleToSet === 'receptionniste') roleToSet = 'assistant';
            setRole(roleToSet);
          }
        } else {
          console.error('Error fetching role:', error.message);
          setRole(null);
        }
      } else {
        let fetchedRole = data?.role ? data.role.toLowerCase().trim() : null;
        
        // Normalize legacy database roles to strict application routing equivalents
        if (fetchedRole === 'administrateur') fetchedRole = 'admin';
        if (fetchedRole === 'receptionniste') fetchedRole = 'assistant';
        
        console.log("Setting Normalized Role To:", fetchedRole);
        setRole(fetchedRole);
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err.message);
      setRole(null);
    } finally {
      setRoleLoading(false);
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
    roleLoading,
    authInitialized
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
