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

  // --- SCHÉMAS DE VALIDATION (MODIFIÉS POUR ÊTRE LOGIQUES) ---

  const loginSchema = z.object({
    email: z.string().email({ message: t('error_invalid_email') }),
    password: z.string().min(4, { message: t('error_password_too_short') }),
  });
  const registerSchema = z.object({
    nom: z.string()
      .min(2, "Le nom est trop court")
      .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, "Le nom ne doit contenir que des lettres"),
    prenom: z.string()
      .min(2, "Le prénom est trop court")
      .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, "Le prénom ne doit contenir que des lettres"),
    telephone: z.string()
      .refine(val => val.replace(/\s/g, '').length === 10, "Le numéro doit faire exactement 10 chiffres")
      .refine(val => /^(05|06|07)[0-9]{8}$/.test(val.replace(/\s/g, '')), "Doit commencer par 05, 06 ou 07"),
    date_naissance: z.string()
      .min(1, "La date de naissance est requise")
      .refine((val) => {
        const d = new Date(val);
        return d <= new Date();
      }, { message: "La date ne peut pas être dans le futur" }),
    sexe: z.string().optional(),
    email: z.string().email({ message: t('error_invalid_email') }),
    // --- SÉCURITÉ MOT DE PASSE RENFORCÉE ---
    password: z.string()
      .min(8, "Le mot de passe doit faire au moins 8 caractères")
      .regex(/[A-Z]/, "Il faut au moins une lettre majuscule")
      .regex(/[0-9]/, "Il faut au moins un chiffre")
      .regex(/[a-z]/, "Il faut au moins une lettre minuscule"),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue // Ajouté pour nettoyer les champs en temps réel
  } = useForm({
    resolver: zodResolver(isSignUp ? registerSchema : loginSchema),
  });

  // Effets de redirection
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
    // Supabase can return OAuth errors in the search query OR the hash fragment
    const params = new URLSearchParams(location.search || location.hash.replace('#', '?'));
    const errCode = params.get('error_code') || params.get('error');
    const errDesc = params.get('error_description');
    if (errCode) {
      toast.error(errDesc?.replace(/\+/g, ' ') || 'Erreur de connexion Google. Veuillez réessayer.');
      // Clean up the URL
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search, location.hash]);
  const formatAlgerianPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)} ${digits.slice(2)}`;
    if (digits.length <= 6) return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4)}`;
    if (digits.length <= 8) return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,6)} ${digits.slice(6)}`;
    return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,6)} ${digits.slice(6,8)} ${digits.slice(8)}`;
  };

  const onSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      if (isSignUp) {
        // --- Vérifier l'unicité du téléphone ---
        const { data: existingUser } = await supabase
          .from('utilisateurs')
          .select('id')
          .eq('telephone', data.telephone)
          .maybeSingle();
        
        if (existingUser) {
          toast.error("Ce numéro de téléphone est déjà utilisé par un autre compte.");
          setIsSubmitting(false);
          return;
        }

        const result = await registerUser(data);
        if (result?.requiresEmailConfirmation) {
          // Email confirmation required — show confirmation screen
          setEmailConfirmationSent(true);
          setIsSubmitting(false);
        } else {
          // Session is live — keep spinner active and let useEffect redirect naturally
          // once the database finishes creating the profile and assigning the role.
          toast.success('Compte créé avec succès ! Préparation de votre espace...');
        }
      } else {
        await login(data.email, data.password);
        toast.success(t('login_success') + " Préparation de votre espace...");
        // Do NOT set isSubmitting(false) here. 
        // Let the useEffect handle the redirect when role is ready.
        return;
      }
    } catch (error) {
      toast.error(error.message || t('login_failed'));

      // Auto-recover from fatal lock error
      if (error.message?.includes('Une erreur de synchronisation')) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          </FadeInItem>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <FadeInItem className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">Prénom</label>
                    <input
                      type="text"
                      placeholder="Prénom"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 ${errors.prenom ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                      {...register('prenom')}
                      onChange={(e) => setValue('prenom', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, ''))}
                      disabled={isSubmitting}
                    />
                    {errors.prenom && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.prenom.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">Nom</label>
                    <input
                      type="text"
                      placeholder="Nom"
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 ${errors.nom ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                      {...register('nom')}
                      onChange={(e) => setValue('nom', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, ''))}
                      disabled={isSubmitting}
                    />
                    {errors.nom && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.nom.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5 flex items-center justify-between">
                      Téléphone
                      <span className="text-[9px] lowercase text-slate-400 font-normal">06 12 34 56 78</span>
                    </label>
                    <input
                      type="text"
                      placeholder="06 12 34 56 78"
                      maxLength={14}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 ${errors.telephone ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                      {...register('telephone')}
                      onChange={(e) => setValue('telephone', formatAlgerianPhone(e.target.value))}
                      disabled={isSubmitting}
                    />
                    {errors.telephone && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.telephone.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">Date de naissance</label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 ${errors.date_naissance ? 'border-red-300' : 'border-slate-200 focus:border-primary'}`}
                      {...register('date_naissance')}
                      disabled={isSubmitting}
                    />
                    {errors.date_naissance && <p className="text-[10px] text-red-500 mt-1 font-bold italic">{errors.date_naissance.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">Genre</label>
                  <select
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none focus:ring-4 focus:ring-primary/10 border-slate-200 focus:border-primary`}
                    {...register('sexe')}
                    disabled={isSubmitting}
                  >
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
              </FadeInItem>
            )}

            {/* Email & Password (commun) */}
            <FadeInItem className="space-y-1.5 mt-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" htmlFor="email">
                <Mail className="h-3 w-3 mr-1.5 text-primary" /> {t('login_email')}
              </label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'}`}
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-xs font-semibold text-red-500 mt-1">{errors.email.message}</p>}
            </FadeInItem>

            <FadeInItem className="space-y-1.5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" htmlFor="password">
                  <Lock className="h-3 w-3 mr-1.5 text-primary" /> {t('login_password')}
                </label>
                {!isSignUp && (
                  <button type="button" onClick={() => setShowResetModal(true)} className="text-xs font-bold text-primary hover:text-blue-700">
                    {t('login_forgot')}
                  </button>
                )}
              </div>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'}`}
                  {...register('password')}
                  disabled={isSubmitting}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs font-semibold text-red-500 mt-1">{errors.password.message}</p>}
            </FadeInItem>

            <FadeInItem>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-primary text-white rounded-xl font-bold border border-transparent shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center group disabled:opacity-80"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>{isSignUp ? "Créer mon compte" : t('login_submit')} <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </FadeInItem>
          </form>

          {/* Google Login ... reste du code identique */}
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
                } catch (e) {
                  toast.error(e.message || "Erreur Google");
                  setIsSubmitting(false);
                }
              }}
              className="w-full py-3.5 px-4 bg-white border-2 border-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center space-x-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
              <span>{t('login_google')}</span>
            </button>
          </FadeInItem>
        </StaggerContainer>
      )}

      {/* Reset Modal ... reste du code identique */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-800">{t('forgot_title')}</h3>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                required
              />
              <button type="submit" disabled={isResetting} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center">
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('forgot_send')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};