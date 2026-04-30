import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight, ActivitySquare, HeartPulse, Scan, Bone, Waves, Microscope, Syringe, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

export const Landing = () => {
  const { t, lang } = useLanguage();

  const services = [
    { id: 1, icon: Scan, img: "/images/scanner.jpg", tag: "Haute précision" },
    { id: 2, icon: Bone, img: "/images/radio.jpg", tag: "Diagnostic osseux" },
    { id: 3, icon: Waves, img: "/images/echo.jpg", tag: "Temps réel" },
    { id: 4, icon: Activity, img: "/images/doppler.jpg", tag: "Vasculaire" },
    { id: 5, icon: HeartPulse, img: "/images/mammo.jpg", tag: "Dépistage" },
    { id: 6, icon: Microscope, img: "/images/biopsie.jpg", tag: "Interventionnel" },
    { id: 7, icon: Syringe, img: "/images/cytoponction.jpg", tag: "Cytologie" },
    { id: 8, icon: ClipboardCheck, img: "/images/dmo.jpg", tag: "Ostéoporose" },
  ];

  return (
    <div className={`flex flex-col w-full bg-white ${lang === 'ar' ? 'font-cairo' : ''}`}>

      {/* 1. HERO SECTION - BLANC PUR */}
      <section className="relative overflow-hidden bg-white pt-24 pb-32">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[800px] h-[800px] rounded-full bg-blue-50 blur-3xl opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 block lg:flex items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
              </span>
              {t('cabinet_ouvert')}
            </div>
            <h1 className="text-4xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              {t('imagerie_haute_precision').split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {i === 1 ? <span className="text-blue-600 block mt-2">{line}</span> : line}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl mx-auto lg:mx-0">{t('hero_description')}</p>
            <Link to="/book" className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:-translate-y-1 transition-all text-sm uppercase tracking-wider">
              {t('prendre_rdv')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
          <div className="flex-1 w-full relative mt-16 lg:mt-0">
            <div className="aspect-[4/3] rounded-[2.5rem] bg-slate-50 border border-slate-100 p-8 shadow-sm flex items-center justify-center">
              <ActivitySquare className="h-20 w-20 text-blue-200" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION - BLANC PUR (Même thème que le Hero) */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="services"
        className="py-24 bg-white relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-3">{t('nos_specialites')}</h2>
            <h3 className="text-4xl lg:text-5xl font-serif text-slate-900 italic">Nos Services <span className="text-blue-600">d'Imagerie</span></h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {services.map((service) => {
              const ServiceIcon = service.icon;
              return (
                <div key={service.id} className="relative h-[500px] overflow-hidden group cursor-pointer border-r border-b border-slate-50">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${service.img})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-80 group-hover:from-blue-600 group-hover:opacity-90 transition-all duration-500" />

                  <div className="absolute top-6 left-6 h-12 w-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-all">
                    <ServiceIcon className="h-6 w-6 text-white" />
                  </div>

                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <h4 className="text-2xl font-serif mb-2">{t(`service_${service.id}_title`)}</h4>
                    <p className="text-sm text-white/70 font-medium leading-relaxed max-h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 group-hover:mb-6">{t(`service_${service.id}_desc`)}</p>
                    <Link to="/book" className="inline-flex items-center justify-center w-fit px-6 py-3 bg-white text-blue-600 rounded-full text-xs font-black uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">Prendre RDV</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* 3. CALL TO ACTION - BLEU CIEL TRÈS CLAIR */}
      {/* 3. CALL TO ACTION - RETOUR AU BLEU NAVY D'ORIGINE */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-24 relative overflow-hidden"
      >
        {/* On remet le bleu foncé premium (bg-blue-700 / indigo-900) */}
        <div className="absolute inset-0 bg-blue-700" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 opacity-95" />

        {/* Effets de lumière subtils (plus de cyan flashy) */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-[120px] opacity-20" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-10" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-md">
            {t('sante_merite_meilleur')}
          </h2>
          <p className="text-xl text-blue-100 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('acceder_comptes_rendus')}
          </p>
          <div className="flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-blue-800 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 hover:bg-slate-50 transition-all duration-300 group"
            >
              {t('acceder_espace_patient')}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};