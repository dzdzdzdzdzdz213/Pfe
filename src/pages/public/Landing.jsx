import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, HeartPulse, Scan, Bone, Waves, Microscope, Syringe, ClipboardCheck } from 'lucide-react';
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

      {/* 1. HERO SECTION */}
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

          <div className="flex-1 w-full max-w-lg mx-auto lg:max-w-none relative mt-16 lg:mt-0">
            <div className="aspect-[4/3] rounded-[3rem] relative overflow-hidden shadow-2xl group border-[6px] border-white">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: `url('/images/hero-medical.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent" />
              <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-white/50">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Technologie 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION - STYLE HARMONISÉ */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="services"
        className="py-24 bg-white relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            {/* Sous-titre traduit sans tirets */}
            <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
              {t('specialites')}
            </h2>
            {/* Titre principal HARMONISÉ (font-extrabold et sans italique) */}
            <h3 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
              {t('services_imagerie')}
            </h3>
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
                    <h4 className="text-2xl font-bold mb-2">{t(`service_${service.id}_title`)}</h4>
                    <p className="text-sm text-white/70 font-medium leading-relaxed max-h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 group-hover:mb-6">{t(`service_${service.id}_desc`)}</p>
                    <Link to="/book" className="inline-flex items-center justify-center w-fit px-6 py-3 bg-white text-blue-600 rounded-full text-xs font-black uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">{t('prendre_rdv')}</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* 3. LOCATION SECTION */}
      <section id="contact" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] mb-4">
                Localisation
              </h2>
              <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                Comment nous trouver ?
              </h3>
              <p className="text-lg text-slate-500 font-medium mb-8">
                Notre cabinet est situé à Bentalha, Baraki. Nous vous accueillons dans un environnement moderne et facile d'accès.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Adresse</h4>
                    <p className="text-sm text-slate-500 font-medium">Bentalha, Baraki, Alger, Algérie</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Téléphone</h4>
                    <p className="text-sm text-slate-500 font-medium">0770 99 11 11 / 0558 22 23 17</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <a 
                  href="https://maps.app.goo.gl/VSnFcWiUBfzyvaeD9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all text-sm"
                >
                  Ouvrir dans Google Maps
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="h-[500px] rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl relative">
              <iframe
                title="Google Maps Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2438.346813763942!2d3.0853314999999992!3d36.647763!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128fab0046f76375%3A0x2ca1aee7c3469cac!2sRadiologue%20BENTALHA%20Dr%20CHEMLOUL!5e1!3m2!1sfr!2sdz!4v1778103991503!5m2!1sfr!2sdz"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-blue-700" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950 opacity-95" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            {t('sante_merite_meilleur')}
          </h2>
          <Link to="/login" className="inline-flex items-center justify-center px-10 py-5 bg-white text-blue-800 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-all">
            {t('acceder_espace_patient')}
          </Link>
        </div>
      </motion.section>
    </div>
  );
};