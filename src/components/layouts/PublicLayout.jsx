import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Calendar, Phone, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const PublicLayout = () => {
  const { lang, toggleLang, t } = useLanguage();

  const navLinks = [
    { name: t('accueil'), path: '/' },
    { name: t('nos_services'), path: '/#services' },
    { name: t('contact'), path: '/#contact' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-colors duration-500">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group -ml-2">
              <img src="/logo.png" alt={t('clinic_name')} className="h-20 w-auto object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="text-sm font-bold text-slate-600 hover:text-primary transition-all duration-300 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:rtl:right-0 after:ltr:left-0 after:bg-primary after:origin-bottom-right hover:after:scale-x-100 after:transition-transform"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Actions & Language */}
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors border border-slate-200"
              >
                <Globe className="h-4 w-4 text-primary" />
                {lang === 'fr' ? 'العربية' : 'Français'}
              </button>
              
              <Link
                to="/login"
                className="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-primary bg-blue-50/80 border border-blue-100/50 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
              >
                {t('espace_patient')}
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center py-2.5 px-6 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
                {t('prendre_rdv')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Premium Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img src="/logo.png" alt={t('clinic_name')} className="h-20 w-auto object-contain bg-white/95 rounded-2xl shadow-lg border border-white/10" />
            </div>
            <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
              {t('description_footer')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 opacity-80">{t('horaires')}</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">{t('dim_jeu')}</span><span className="text-slate-200">08:00 - 17:00</span></li>
              <li className="flex justify-between pb-2 border-b border-slate-800"><span className="text-slate-400">{t('vendredi')}</span><span className="text-rose-400 font-bold">{t('ferme')}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">{t('samedi')}</span><span className="text-slate-200">08:00 - 12:00</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 opacity-80">{t('contact')}</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-white font-bold text-lg mb-1">0770 99 11 11</span>
                  <span className="block text-white font-bold text-lg mb-1">0558 22 23 17</span>
                  <span className="text-emerald-400 text-xs font-bold tracking-wide uppercase">{t('urgences')}</span>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => window.open('https://maps.app.goo.gl/svFjfVStarFtH7GM7', '_blank')}>
                <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-white font-bold text-base mb-1">{t('voir_carte')}</span>
                  <span className="text-rose-400 text-xs font-bold tracking-wide uppercase">Google Maps</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-center md:text-left text-sm font-medium flex flex-col md:flex-row justify-between items-center text-slate-500 relative z-10">
          <p>&copy; {new Date().getFullYear()} {t('clinic_name')}. {t('all_rights_reserved')}</p>
          <div className="flex gap-6 mt-6 md:mt-0">
            <button className="hover:text-white transition-colors bg-transparent border-0 p-0 text-sm font-medium cursor-pointer">{t('mentions_legales')}</button>
            <button className="hover:text-white transition-colors bg-transparent border-0 p-0 text-sm font-medium cursor-pointer">{t('politique_confidentialite')}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
