import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight, ActivitySquare, HeartPulse, Scan, Bone, Waves, Microscope, Syringe, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

export const Landing = () => {
  const { t, lang } = useLanguage();

  const services = [
    { id: 1, icon: Scan, color: 'blue' },
    { id: 2, icon: Bone, color: 'blue' },
    { id: 3, icon: Waves, color: 'blue' },
    { id: 4, icon: Activity, color: 'blue' },
    { id: 5, icon: HeartPulse, color: 'blue' },
    { id: 6, icon: Microscope, color: 'blue' },
    { id: 7, icon: Syringe, color: 'blue' },
    { id: 8, icon: ClipboardCheck, color: 'blue' },
  ];

  const getColorClasses = (color) => {
    const classes = {
      blue: 'text-blue-600 bg-blue-50/10 hover:border-blue-200 hover:bg-blue-50/50 shadow-blue-200/50',
      emerald: 'text-emerald-600 bg-emerald-50/10 hover:border-emerald-200 hover:bg-emerald-50/50 shadow-emerald-200/50',
      violet: 'text-violet-600 bg-violet-50/10 hover:border-violet-200 hover:bg-violet-50/50 shadow-violet-200/50',
      orange: 'text-orange-600 bg-orange-50/10 hover:border-orange-200 hover:bg-orange-50/50 shadow-orange-200/50',
      pink: 'text-pink-600 bg-pink-50/10 hover:border-pink-200 hover:bg-pink-50/50 shadow-pink-200/50',
      teal: 'text-teal-600 bg-teal-50/10 hover:border-teal-200 hover:bg-teal-50/50 shadow-teal-200/50',
      red: 'text-red-600 bg-red-50/10 hover:border-red-200 hover:bg-red-50/50 shadow-red-200/50',
      amber: 'text-amber-600 bg-amber-50/10 hover:border-amber-200 hover:bg-amber-50/50 shadow-amber-200/50',
    };
    return classes[color];
  };

  return (
    <div className={`flex flex-col w-full ${lang === 'ar' ? 'font-cairo' : ''}`}>
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-white pt-24 pb-32">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-100/40 blur-3xl opacity-70" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-50/50 to-teal-50/50 blur-3xl opacity-70" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/0 via-white/50 to-white/80 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 block lg:flex items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-start lg:rtl:text-right mt-10 lg:mt-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100/80 shadow-sm text-primary text-xs font-bold mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {t('cabinet_ouvert')}
            </div>

            <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              {t('imagerie_haute_precision').split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {i === 1 ? (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-emerald-500 block mt-2">
                      {line}
                    </span>
                  ) : line}
                </React.Fragment>
              ))}
            </h1>

            <p className={`text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed ${lang === 'ar' ? 'font-tajawal text-slate-600' : ''}`}>
              {t('hero_description')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/book" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all group">
                {t('prendre_rdv')}
                <ArrowRight className="w-5 h-5 rtl:mr-2 rtl:rotate-180 ltr:ml-2 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 border-2 border-slate-100 rounded-2xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-200 transition-all">
                {t('consulter_resultats')}
              </Link>
            </div>
          </div>

          {/* Aesthetic Visual Hero */}
          <div className="flex-1 w-full max-w-lg mx-auto lg:max-w-none relative mt-16 lg:mt-0 animate-in fade-in zoom-in duration-1000 delay-150">
            <div className="aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-1 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
              <div className="relative h-full w-full rounded-[2.3rem] border border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col justify-between p-8 overflow-hidden">
                {/* Decorative glowing orb */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/30 blur-[50px] rounded-full" />

                <div className="flex justify-between items-start relative z-10">
                  <ActivitySquare className="h-12 w-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-extrabold border border-emerald-500/20 backdrop-blur-md">
                    {t('systeme_en_ligne')}
                  </div>
                </div>

                <div className="space-y-5 relative z-10 mt-12">
                  <div className="h-3 w-1/3 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-slate-600 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                  <div className="h-3 w-3/4 bg-slate-700/50 rounded-full" />
                  <div className="flex gap-3 pt-4">
                    <div className="h-16 w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md" />
                    <div className="h-16 w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -bottom-8 rtl:-right-8 ltr:-left-8 bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/50 flex items-center gap-5 hidden md:flex animate-bounce-slow">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-primary shadow-inner border border-blue-100/50">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div className="rtl:text-right ltr:text-left">
                <p className="text-sm font-extrabold text-slate-800">{t('resultats_securises')}</p>
                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">{t('espace_protege')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        id="services"
        className="py-24 bg-slate-50 relative border-t border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">{t('nos_specialites')}</h2>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">{t('services_composant')}</h3>
            <p className={`text-lg text-slate-500 font-medium ${lang === 'ar' ? 'font-tajawal' : ''}`}>
              {t('services_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <div key={service.id} className={`flex flex-col bg-white rounded-[2rem] p-8 border border-slate-100 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${getColorClasses(service.color)}`}>
                  <div className="h-14 w-14 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <ServiceIcon className="h-7 w-7 currentColor" />
                  </div>
                  <h4 className={`text-xl font-extrabold text-slate-900 mb-3 leading-tight ${lang === 'ar' ? 'font-cairo' : ''}`}>
                    {t(`service_${service.id}_title`)}
                  </h4>
                  <p className={`text-sm text-slate-500 font-medium flex-grow mb-8 leading-relaxed ${lang === 'ar' ? 'font-tajawal text-slate-600' : ''}`}>
                    {t(`service_${service.id}_desc`)}
                  </p>
                  <Link
                    to="/book"
                    state={{ serviceId: service.id, serviceName: t(`service_${service.id}_title`) }}
                    className="inline-flex items-center justify-center w-full px-5 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary hover:shadow-blue-500/20 transition-all group-hover:scale-[1.02]"
                  >
                    {t('prendre_un_rendezvous')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Call to Action Promo */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-emerald-900/40 opacity-80 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary/30 to-transparent" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
            {t('sante_merite_meilleur')}
          </h2>
          <p className={`text-xl text-slate-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed ${lang === 'ar' ? 'font-tajawal' : ''}`}>
            {t('acceder_comptes_rendus')}
          </p>
          <div className="flex justify-center">
            <Link to="/login" className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 rounded-2xl font-extrabold text-lg shadow-2xl hover:bg-slate-50 hover:scale-105 transition-all">
              {t('acceder_espace_patient')}
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
