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
    <div className={`flex flex-col w-full ${lang === 'ar' ? 'font-cairo' : ''}`}>
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-white pt-24 pb-32">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-100/40 blur-3xl opacity-70" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-emerald-50/50 to-teal-50/50 blur-3xl opacity-70" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 block lg:flex items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-start lg:rtl:text-right">
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
              <Link to="/book" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary to-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all group text-sm uppercase tracking-wider">
                {t('prendre_rdv')}
                <ArrowRight className="w-5 h-5 rtl:mr-2 rtl:rotate-180 ltr:ml-2 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 border-2 border-slate-100 rounded-2xl font-bold shadow-sm hover:bg-slate-50 hover:border-slate-200 transition-all text-sm uppercase tracking-wider">
                {t('consulter_resultats')}
              </Link>
            </div>
          </div>

          {/* Aesthetic Visual Hero */}
          <div className="flex-1 w-full max-w-lg mx-auto lg:max-w-none relative mt-16 lg:mt-0">
            <div className="aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-1 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 opacity-20" />
              <div className="relative h-full w-full rounded-[2.3rem] border border-white/10 bg-slate-900/80 backdrop-blur-xl flex flex-col justify-between p-8 overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <ActivitySquare className="h-12 w-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                  <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-extrabold border border-emerald-500/20">
                    {t('systeme_en_ligne')}
                  </div>
                </div>
                <div className="space-y-5 relative z-10">
                  <div className="h-3 w-3/4 bg-slate-700/50 rounded-full" />
                  <div className="flex gap-3 pt-4">
                    <div className="h-16 w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md" />
                    <div className="h-16 w-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Info Card */}
            <div className="absolute -bottom-8 rtl:-right-8 ltr:-left-8 bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/50 flex items-center gap-5 hidden md:flex">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">{t('resultats_securises')}</p>
                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">{t('espace_protege')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      {/* Services Section avec Photos */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        id="services"
        className="py-24 bg-white relative border-t border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-3">{t('nos_specialites')}</h2>
            <h3 className="text-4xl lg:text-5xl font-serif text-slate-900 mb-6 italic">Nos Services <span className="text-blue-600">d'Imagerie Médicale</span></h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
            {services.map((service, index) => {
              const ServiceIcon = service.icon;
              return (
                <div
                  key={service.id}
                  className="relative h-[500px] overflow-hidden group cursor-pointer"
                >
                  {/* Photo de fond */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${service.img})` }}
                  />

                  {/* Overlay dégradé (Noir -> Bleu au survol) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90 transition-all duration-500 group-hover:from-blue-900 group-hover:via-blue-600/20" />

                  {/* Tag en haut à droite */}
                  <div className="absolute top-6 right-6 px-3 py-1 bg-blue-600/90 backdrop-blur-md rounded-full text-[10px] text-white font-bold uppercase tracking-widest opacity-0 -translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    {service.tag}
                  </div>

                  {/* Icône */}
                  <div className="absolute top-6 left-6 h-12 w-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600">
                    <ServiceIcon className="h-6 w-6 text-white" />
                  </div>

                  {/* Textes et Bouton */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2 group-hover:text-blue-400">0{service.id} — Service</p>
                    <h4 className={`text-2xl font-serif mb-2 leading-tight ${lang === 'ar' ? 'font-cairo' : ''}`}>
                      {t(`service_${service.id}_title`)}
                    </h4>
                    <p className={`text-sm text-white/60 font-medium leading-relaxed max-h-0 opacity-0 overflow-hidden transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 group-hover:mb-6 ${lang === 'ar' ? 'font-tajawal' : ''}`}>
                      {t(`service_${service.id}_desc`)}
                    </p>
                    <Link
                      to="/book"
                      className="inline-flex items-center justify-center w-fit px-6 py-3 bg-white text-slate-900 rounded-full text-xs font-black uppercase tracking-wider opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-blue-600 hover:text-white"
                    >
                      Prendre RDV
                    </Link>
                  </div>

                  <div className="absolute bottom-0 left-0 h-1 bg-blue-600 w-full scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Call to Action Promo */}
      {/* Call to Action Promo - Plus stylé et sans noir */}
      {/* Call to Action Promo - ICI LE CHANGEMENT SANS NOIR */}
      {/* Call to Action Promo - BLEU CLAIR MÉDICAL */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-24 relative overflow-hidden"
      >
        {/* On force le bleu clair ici */}
        <div className="absolute inset-0 bg-blue-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500 opacity-90" />

        {/* Cercles de lumière */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-300 rounded-full blur-[120px] opacity-30" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-[120px] opacity-20" />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-md">
            {t('sante_merite_meilleur')}
          </h2>
          <p className="text-xl text-white font-medium mb-12 max-w-2xl mx-auto leading-relaxed opacity-95">
            {t('acceder_comptes_rendus')}
          </p>
          <div className="flex justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 hover:shadow-blue-200 transition-all duration-300 group"
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