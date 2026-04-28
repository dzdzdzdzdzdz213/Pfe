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
      {/* Premium Footer */}
      <footer id="contact" className="bg-white border-t border-slate-100 pt-20 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 blur-3xl rounded-full -mr-20 -mt-20" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <img src="/logo.png" alt={t('clinic_name')} className="h-16 w-auto object-contain mix-blend-multiply mb-6" />
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {t('description_footer')}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">{t('horaires')}</h3>
              <ul className="space-y-3 text-sm font-semibold">
                <li className="flex justify-between items-center text-slate-600 border-b border-slate-50 pb-2">
                  <span>{t('dim_jeu')}</span>
                  <span className="text-blue-600 font-bold">08:00 - 17:00</span>
                </li>
                <li className="flex justify-between items-center text-slate-600 border-b border-slate-50 pb-2">
                  <span>{t('samedi')}</span>
                  <span className="text-blue-600 font-bold">08:00 - 12:00</span>
                </li>
                <li className="flex justify-between items-center text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                  <span>{t('vendredi')}</span>
                  <span className="font-black text-[10px] uppercase">{t('ferme')}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">{t('contact')}</h3>
              <div className="space-y-4">
                <a href="tel:0770991111" className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">0770 99 11 11</span>
                </a>
                <a href="tel:0558222317" className="flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Phone className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-black text-slate-800 group-hover:text-blue-600 transition-colors">0558 22 23 17</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Localisation</h3>
              <button
                onClick={() => window.open('https://maps.google.com', '_blank')}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 group"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t('voir_carte')}
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} {t('clinic_name')}. {t('all_rights_reserved')}</p>
            <div className="flex gap-8">
              <button className="hover:text-blue-600 transition-colors">{t('mentions_legales')}</button>
              <button className="hover:text-blue-600 transition-colors">{t('politique_confidentialite')}</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
