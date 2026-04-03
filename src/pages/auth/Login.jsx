import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { StaggerContainer, FadeInItem } from '@/components/common/PageTransition';
import { supabase } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  password: z.string().min(4, { message: "Le mot de passe doit contenir au moins 4 caractères." }),
});

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      
      if (result.user) {
        toast.success("Connexion réussie !");
        
        if (result.user.email === 'admin@demo.com') {
          navigate('/admin/dashboard', { replace: true });
        } else if (result.user.email === 'radiologue@demo.com') {
          navigate('/radiologue/dashboard', { replace: true });
        } else if (result.user.email === 'assistant@demo.com') {
          navigate('/assistant/dashboard', { replace: true });
        } else if (result.user.email === 'patient@demo.com') {
          navigate('/patient/dashboard', { replace: true });
        } else {
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Échec de la connexion. Veuillez vérifier vos identifiants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoMode = useCallback((role) => {
    const data = { email: `${role}@demo.com`, password: 'demo' };
    onSubmit(data);
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error('Veuillez entrer votre email');
    setIsResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Lien de réinitialisation envoyé ! Vérifiez vos emails.');
      setShowResetModal(false);
      setResetEmail('');
    }
    setIsResetting(false);
  };

  return (
    <>
      <StaggerContainer className="space-y-6">
        <FadeInItem className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenue</h1>
          <p className="text-sm text-slate-500 font-medium">
            Connectez-vous à votre compte pour continuer
          </p>
        </FadeInItem>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Demo Access Panel */}
          <FadeInItem className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] text-center mb-1">Accès Démo Instantané</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoMode('admin')}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all hover:-translate-y-0.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Administrateur
              </button>
              <button
                type="button"
                onClick={() => handleDemoMode('radiologue')}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all hover:-translate-y-0.5"
              >
                🩺 Radiologue
              </button>
              <button
                type="button"
                onClick={() => handleDemoMode('assistant')}
                className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all hover:-translate-y-0.5"
              >
                🎧 Assistant
              </button>
              <button
                type="button"
                onClick={() => handleDemoMode('patient')}
                className="flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-xs font-bold shadow transition-all hover:-translate-y-0.5"
              >
                👤 Patient
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center">Mot de passe démo : <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">demo</code></p>
          </FadeInItem>

          <FadeInItem className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </FadeInItem>

          <FadeInItem className="space-y-1.5 mt-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" htmlFor="email">
              <Mail className="h-3 w-3 mr-1.5 text-primary" />
              Adresse Email
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center" htmlFor="password">
                <Lock className="h-3 w-3 mr-1.5 text-primary" />
                Mot de passe
              </label>
              <button type="button" onClick={() => setShowResetModal(true)} className="text-xs font-bold text-primary hover:text-blue-700 transition-colors">
                Mot de passe oublié ?
              </button>
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

          <FadeInItem className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary focus:ring-offset-2" 
            />
            <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors">
              Se souvenir de moi
            </label>
          </FadeInItem>

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
                  Se Connecter
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </FadeInItem>
        </form>
        
        <FadeInItem className="relative py-2">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-slate-400 bg-white px-2">Ou</div>
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
            <span>Connexion avec Google</span>
          </button>
        </FadeInItem>
      </StaggerContainer>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800">Mot de passe oublié</h3>
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
                  Email du compte
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
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Envoyer le lien"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
