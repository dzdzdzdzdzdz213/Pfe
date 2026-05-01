import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Scan, Bone, Activity, Waves, HeartPulse, Microscope, Syringe, ClipboardCheck, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PageTransition } from '@/components/common/PageTransition';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '@/lib/supabase';

export const Booking = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const initialService = location.state?.serviceId || '';
  const initialServiceName = location.state?.serviceName || '';

  const [step, setStep] = useState(initialService ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenSlots, setTakenSlots] = useState([]); // État pour stocker les heures déjà prises
  const [formData, setFormData] = useState({
    service: initialService,
    serviceName: initialServiceName,
    date: '',
    time: '',
    nom: '',
    prenom: '',
    telephone: '',
    age: '',
    gender: 'M',
    document: null,
    notes: ''
  });

  const servicesList = [
    { id: 1, icon: Scan },
    { id: 2, icon: Bone },
    { id: 3, icon: Waves },
    { id: 4, icon: Activity },
    { id: 5, icon: HeartPulse },
    { id: 6, icon: Microscope },
    { id: 7, icon: Syringe },
    { id: 8, icon: ClipboardCheck },
  ];

  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  // --- EFFET POUR RÉCUPÉRER LES HEURES DÉJÀ RÉSERVÉES ---
  useEffect(() => {
    const fetchTakenSlots = async () => {
      if (!formData.date) return;

      const { data, error } = await supabase
        .from('rendez_vous')
        .select('date_heure_debut')
        .gte('date_heure_debut', `${formData.date}T00:00:00`)
        .lte('date_heure_debut', `${formData.date}T23:59:59`);

      if (!error && data) {
        // On extrait l'heure (HH:mm) de chaque rendez-vous trouvé
        const hours = data.map(rdv => {
          const d = new Date(rdv.date_heure_debut);
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace('h', ':');
        });
        setTakenSlots(hours);
      }
    };

    fetchTakenSlots();
  }, [formData.date]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
    ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Double sécurité pour l'âge avant envoi
    if (parseInt(formData.age) > 120) return;

    setIsSubmitting(true);
    try {
      const startDate = new Date(`${formData.date}T${formData.time}`);
      const endDate = new Date(startDate.getTime() + 30 * 60000);

      let documentInfo = '';
      if (formData.document) {
        try {
          const file = formData.document;
          const ext = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const path = `public/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
            documentInfo = ` [DOC:${urlData.publicUrl}]`;
          }
        } catch (e) { console.error(e); }
      }

      const motif = `[${formData.serviceName}] ${formData.notes || 'Demande en ligne'} — Patient: ${formData.prenom} ${formData.nom} — Tél: ${formData.telephone} — Âge: ${formData.age}${documentInfo}`;

      const bookingPromise = supabase
        .from('rendez_vous')
        .insert({
          date_heure_debut: startDate.toISOString(),
          date_heure_fin: endDate.toISOString(),
          motif,
          statut: 'planifie',
        });

      await withTimeout(bookingPromise, 6000);
      setStep(4);
    } catch (err) {
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0, filter: 'blur(4px)' }),
    center: { zIndex: 1, x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0, filter: 'blur(4px)' })
  };

  return (
    <PageTransition className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto">

        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`
                  flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300
                  ${step >= i ? 'bg-primary text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}
                `}>
                  {i}
                </div>
                {i < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${step > i ? 'bg-primary' : 'bg-slate-100'}`} />
                )}
              </div>
            ))}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center tracking-tight">
            {step === 1 && t('booking_choose_service')}
            {step === 2 && t('booking_choose_date')}
            {step === 3 && t('booking_details')}
            {step === 4 && t('booking_confirm_success')}
          </h2>
        </div>

        {/* Form Wizard */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-100 overflow-hidden relative min-h-[400px]">
          <AnimatePresence mode="wait" custom={1}>

            {/* STEP 1: SERVICE */}
            {step === 1 && (
              <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {servicesList.map((srv) => {
                    const SrvIcon = srv.icon;
                    const serviceTitle = t(`service_${srv.id}_title`);
                    const isSelected = formData.service === srv.id;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => setFormData({ ...formData, service: srv.id, serviceName: serviceTitle })}
                        className={`p-5 rounded-2xl text-left border-2 transition-all duration-200 group flex flex-col items-start ${isSelected ? 'border-primary bg-blue-50/50 shadow-lg' : 'border-slate-100 bg-white hover:border-blue-200'}`}
                      >
                        <SrvIcon className={`w-7 h-7 mb-3 ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{serviceTitle}</h3>
                        <p className="text-[10px] font-medium text-slate-500 leading-snug line-clamp-2">{t(`service_${srv.id}_desc`)}</p>
                      </button>
                    )
                  })}
                </div>
                <div className="pt-6 flex justify-end">
                  <button onClick={handleNext} disabled={!formData.service} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center">
                    {t('next')} <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> {t('booking_date')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
                    min={new Date().toISOString().split('T')[0]} // SÉCURITÉ : Bloque les dates passées
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                {formData.date && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-3">{t('booking_time')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {timeSlots.map((time) => {
                        const isTaken = takenSlots.includes(time); // Vérifie si l'heure est en base
                        return (
                          <button
                            key={time}
                            disabled={isTaken}
                            onClick={() => setFormData({ ...formData, time })}
                            className={`
                              py-3 rounded-xl text-sm font-bold border transition-all
                              ${isTaken
                                ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed' // STYLE ROUGE : Indisponible
                                : formData.time === time
                                  ? 'bg-primary text-white border-primary shadow-md'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'}
                            `}
                          >
                            {time}
                            {isTaken && <span className="block text-[8px] mt-0.5">COMPLET</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-6 flex justify-between">
                  <button onClick={handlePrev} className="px-6 py-3 text-slate-500 font-bold flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
                  </button>
                  <button onClick={handleNext} disabled={!formData.date || !formData.time} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center">
                    {t('next')} <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PATIENT DETAILS */}
            {step === 3 && (
              <motion.form key="step3" variants={variants} initial="enter" animate="center" exit="exit" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-2">{t('last_name')}</label>
                    <input type="text" required value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-2">{t('first_name')}</label>
                    <input type="text" required value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-2">{t('phone')}</label>
                    <input type="tel" required pattern="[0-9]{10}" placeholder="05XXXXXXXX" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value.replace(/[^0-9]/g, '') })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-2">{t('age')}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="120" // SÉCURITÉ : Limite l'âge à 120 ans
                      value={formData.age}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 120)) {
                          setFormData({ ...formData, age: val });
                        }
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-2">{t('booking_motif_label')}</label>
                  <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border rounded-xl resize-none" />
                </div>

                <div className="pt-6 flex justify-between">
                  <button type="button" onClick={handlePrev} className="px-6 py-3 text-slate-500 font-bold flex items-center"><ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}</button>
                  <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                    {t('booking_confirm_btn')}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div key="step4" variants={variants} initial="enter" animate="center" className="text-center py-8">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">{t('booking_sent')}</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
                  {t('booking_success_desc')
                    .replace('{service}', formData.serviceName)
                    .replace('{date}', formData.date)
                    .replace('{time}', formData.time)
                    .replace('{phone}', formData.telephone)}
                </p>
                <a href="/" className="inline-flex items-center px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                  {t('back_to_home')}
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};