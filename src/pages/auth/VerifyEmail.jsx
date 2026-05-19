import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader2, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      toast.success(t('email_verified_access'));
      navigate('/login', { replace: true });
    }
  }, [user, navigate, t]);

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
      toast.error(t('email_not_found_relogin'));
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
      toast.success(t('verification_email_resent'));
    } catch (err) {
      toast.error(err.message || t('cannot_send_email'));
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
            {t('verify_email_title')}
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6 max-w-sm mx-auto">
            {t('verify_email_intro')}&nbsp;
            <span className="font-bold text-slate-800">{email}</span>.
            <br />
            {t('verify_email_outro')}
            <br /><br />
            {t('cant_access_until_verified')}
          </p>

          {polling && (
            <p className="text-[10px] text-slate-400 font-medium mb-4 flex items-center justify-center gap-1.5">
              <CheckCircle className="h-3 w-3" /> {t('waiting_verification')}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {resending ? t('resending') : t('resend_email')}
            </button>

            <button
              onClick={handleBackToLogin}
              className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t('back_to_login')}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 mt-6 font-medium">
            {t('check_spam_folder')}
          </p>
        </div>
      </div>
    </div>
  );
};
