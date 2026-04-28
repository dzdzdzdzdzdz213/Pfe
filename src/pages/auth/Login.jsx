import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, X } from 'lucide-react';
import { StaggerContainer, FadeInItem } from '@/components/common/PageTransition';
import { supabase } from '@/lib/supabase';

import { useLanguage } from '@/contexts/LanguageContext';

export const Login = () => {
  const { t } = useLanguage();

  const loginSchema = z.object({
    email: z.string().email({ message: t('error_invalid_email') }),
    password: z.string().min(4, { message: t('error_password_too_short') }),
  });

  const registerSchema = z.object({
    nom: z.string().min(2, "Le nom est requis"),
    prenom: z.string().min(2, "Le prénom est requis"),
    telephone: z.string().min(8, "Le numéro est requis"),
    age: z.string().min(1, "L'âge est requis"),
    email: z.string().email({ message: t('error_invalid_email') }),
    password: z.string().min(6, { message: t('error_password_short') }),
  });

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  
  const { user, role, login, loginWithGoogle, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && role) {
      const from = location.state?.from?.pathname;
      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        navigate(`/${role}/dashboard`, { replace: true });
      }
    }
  }, [user, role, navigate, location]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errCode = params.get('error_code');
    const errDesc = params.get('error_description');
    if (errCode) {
      toast.error(errDesc?.replace(/\+/g, ' ') || 'Erreur de connexion Google. Veuillez réessayer.');
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isSignUp ? registerSchema : loginSchema),
  });

  const onSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const result = await registerUser(data);
        if (result?.requiresEmailConfirmation) {
          // Email confirmation required — show confirmation screen
          setEmailConfirmationSent(true);
          setIsSubmitting(false);
        } else {
          // Session is live — navigate directly to patient dashboard
          toast.success('Compte créé avec succès ! Bienvenue 👋');
          navigate('/patient/dashboard', { replace: true });
        }
      } else {
        await login(data.email, data.password);
        toast.success(t('login_success'));
        // Auth listener handles redirect for login
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || t('login_failed'));
      setIsSubmitting(false);
    }
  }, [login, registerUser, navigate, t, isSignUp]);


  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error(t('error_required_fields'));
    setIsResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('forgot_success'));
      setShowResetModal(false);
      setResetEmail('');
    }
    setIsResetting(false);
  };

  return (
    <>
      {/* Email Confirmation Screen */}
      {emailConfirmationSent ? (
        <div className="text-center space-y-4 py-4">
          <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Mail className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Vérifiez votre email</h2>
          <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">
            Un lien de confirmation a été envoyé à votre adresse email. Cliquez dessus pour accéder à votre espace patient.
          </p>
          <button
            onClick={() => { setEmailConfirmationSent(false); setIsSignUp(false); reset(); }}
            className="text-sm font-bold text-primary hover:underline"
          >
            Retour à la connexion
          </button>
        </div>
      ) : (
      <StaggerContainer className="space-y-6">
        <FadeInItem className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-100 p-1 rounded-xl inline-flex">
              <button 
                type="button"
                onClick={() => { setIsSignUp(false); reset(); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Se Connecter
              </button>
              <button 
                type="button"
                onClick={() => { setIsSignUp(true); reset(); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${isSignUp ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Créer un compte
              </button>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-center">
            {isSignUp ? 'Bienvenue parmi nous' : t('login_welcome')}
          </h1>
          <p className="text-sm text-slate-500 font-medium text-center">
            {isSignUp ? 'Remplissez vos informations pour créer un compte patient.' : t('login_subtitle')}
          </p>
        </FadeInItem>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignUp && (
            <FadeInItem className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Prénom</label>
                  <input
                    type="text"
                    placeholder="Prénom"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 ${errors.prenom ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                    {...register('prenom')}
                    disabled={isSubmitting}
                  />
                  {errors.prenom && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.prenom.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Nom</label>
                  <input
                    type="text"
                    placeholder="Nom"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 ${errors.nom ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                    {...register('nom')}
                    disabled={isSubmitting}
                  />
                  {errors.nom && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.nom.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Téléphone</label>
                  <input
                    type="text"
                    placeholder="0555 55 55 55"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 ${errors.telephone ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                    {...register('telephone')}
                    disabled={isSubmitting}
                  />
                  {errors.telephone && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.telephone.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Âge</label>
                  <input
                    type="number"
                    placeholder="Âge"
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 ${errors.age ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                    {...register('age')}
                    disabled={isSubmitting}
                  />
                  {errors.age && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.age.message}</p>}
                </div>
              </div>
            </FadeInItem>
          )}

          <FadeInItem className="space-y-1.5 mt-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" htmlFor="email">
              <Mail className="h-3 w-3 mr-1.5 text-primary" />
              {t('login_email')}
            </label>
            <div className="relative group">
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className={`
                  w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all duration-200
                  focus:bg-white focus:ring-4 focus:ring-primary/10 shadow-sm
                  ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'}
                `}
                {...register('email')}
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-semibold text-red-500 mt-1">{errors.email.message}</p>
            )}
          </FadeInItem>

          <FadeInItem className="space-y-1.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" htmlFor="password">
                <Lock className="h-3 w-3 mr-1.5 text-primary" />
                {t('login_password')}
              </label>
              {!isSignUp && (
                <button type="button" onClick={() => setShowResetModal(true)} className="text-xs font-bold text-primary hover:text-blue-700 transition-colors">
                  {t('login_forgot')}
                </button>
              )}
            </div>
            <div className="relative group">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`
                  w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all duration-200
                  focus:bg-white focus:ring-4 focus:ring-primary/10 shadow-sm
                  ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'}
                `}
                {...register('password')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-semibold text-red-500 mt-1">{errors.password.message}</p>
            )}
          </FadeInItem>

          {!isSignUp && (
            <FadeInItem className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="remember" 
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary focus:ring-offset-2" 
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors">
                {t('login_remember')}
              </label>
            </FadeInItem>
          )}

          <FadeInItem>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-3.5 px-4 bg-primary text-white rounded-xl font-bold border border-transparent shadow-[0_0_20px_rgba(37,99,235,0.2)]
                hover:bg-blue-700 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group
                ${isSubmitting ? 'opacity-80 cursor-not-allowed translate-y-0 shadow-none hover:-translate-y-0' : 'active:scale-[0.98]'}
              `}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Créer mon compte" : t('login_submit')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </FadeInItem>
        </form>
        
        <FadeInItem className="relative py-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-slate-400 bg-white px-2">{t('or')}</div>
        </FadeInItem>
        
        <FadeInItem>
          <button 
            type="button"
            onClick={async () => {
              try {
                setIsSubmitting(true);
                await loginWithGoogle();
              } catch(e) {
                toast.error(e.message || "Erreur Google");
                setIsSubmitting(false);
              }
            }}
            className="w-full py-3.5 px-4 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            <span>{t('login_google')}</span>
          </button>
        </FadeInItem>
      </StaggerContainer>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800">{t('forgot_title')}</h3>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('forgot_email_label')}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-70 text-sm"
              >
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('forgot_send')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
