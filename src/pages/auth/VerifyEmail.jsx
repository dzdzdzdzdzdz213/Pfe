import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader2, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * VerifyEmail — blocks unverified accounts.
 *
 * Reached either:
 *   - immediately after registration (via /verify-email?email=...), or
 *   - when ProtectedRoute detects the logged-in user still has
 *     `email_confirmed_at === null`.
 *
 * The page does NOT let the user navigate anywhere except:
 *   - "Renvoyer l'email" — resend the verification email via Supabase Auth
 *   - "Retour à la connexion" — sign out so they can log back in after verifying
 */
export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [polling, setPolling] = useState(false);

  // Pick the email from (in order): query string, current session, otherwise blank
  const email = (() => {
    const fromQuery = new URLSearchParams(location.search).get('email');
    if (fromQuery) return fromQuery;
    return user?.email || '';
  })();

  // If the user is verified mid-stay, bounce them to the appropriate space.
  useEffect(() => {
    if (user?.email_confirmed_at) {
      toast.success('Email vérifié — accès accordé.');
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Light polling — every 5s, refresh the session so a freshly-verified email
  // detected by Supabase bounces the user out automatically.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(async () => {
      try {
        setPolling(true);
        await supabase.auth.refreshSession();
      } catch { /* silent */ }
      finally { setPolling(false); }
    }, 5000);
    return () => clearInterval(id);
  }, [user]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Adresse email introuvable. Veuillez vous reconnecter.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin + '/login' }
      });
      if (error) throw error;
      toast.success("Un nouvel email de vérification a été envoyé.");
    } catch (err) {
      toast.error(err.message || "Impossible d'envoyer l'email.");
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    try { await logout(); } catch { /* ignore */ }
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-2xl shadow-blue-100/50 sm:rounded-3xl border border-slate-100 text-center">
          <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 mb-6">
            <Mail className="h-10 w-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Vérifiez votre email
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 max-w-sm mx-auto">
            Nous avons envoyé un lien de vérification à&nbsp;
            <span className="font-bold text-slate-800">{email || 'votre adresse email'}</span>.
            Cliquez sur le lien dans cet email pour activer votre compte.
            <br /><br />
            Vous ne pourrez accéder à l'application qu'une fois votre adresse vérifiée.
          </p>

          {polling && (
            <p className="text-[10px] text-slate-400 font-medium mb-4 flex items-center justify-center gap-1.5">
              <CheckCircle className="h-3 w-3" /> En attente de la vérification…
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {resending ? 'Envoi…' : "Renvoyer l'email de vérification"}
            </button>

            <button
              onClick={handleBackToLogin}
              className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Retour à la connexion
            </button>
          </div>

          <p className="text-[10px] text-slate-400 mt-6 font-medium">
            Pensez à vérifier votre dossier spam si vous ne voyez pas l'email.
          </p>
        </div>
      </div>
    </div>
  );
};
