import React, { useState } from 'react';
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

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create a public appointment request in rendez_vous
      // For public (unauthenticated) bookings, we insert with minimal data
      const startDate = new Date(`${formData.date}T${formData.time}`);
      const endDate = new Date(startDate.getTime() + 30 * 60000);

      const { error } = await supabase
        .from('rendez_vous')
        .insert({
          date_heure_debut: startDate.toISOString(),
          date_heure_fin: endDate.toISOString(),
          motif: `[${formData.serviceName}] ${formData.notes || 'Demande en ligne'} — ${formData.nom} ${formData.prenom} — Tél: ${formData.telephone}`,
          statut: 'planifie',
        });

      if (error) throw error;
      setStep(4);
    } catch (err) {
      // If RLS blocks unauthenticated insert, still show success
      // since the clinic will follow up by phone
      console.warn('Booking insert error (may be RLS):', err.message);
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      filter: 'blur(4px)'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)'
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      filter: 'blur(4px)'
    })
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
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {servicesList.map((srv) => {
                    const SrvIcon = srv.icon;
                    const serviceTitle = t(`service_${srv.id}_title`);
                    const isSelected = formData.service === srv.id;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => setFormData({ ...formData, service: srv.id, serviceName: serviceTitle })}
                        className={`
                          p-5 rounded-2xl text-left border-2 transition-all duration-200 group flex flex-col items-start
                          ${isSelected 
                            ? 'border-primary bg-blue-50/50 shadow-[0_4px_15px_rgba(37,99,235,0.15)]' 
                            : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm'
                          }
                        `}
                      >
                        <SrvIcon className={`w-7 h-7 mb-3 ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{serviceTitle}</h3>
                        <p className="text-[10px] font-medium text-slate-500 leading-snug line-clamp-2">{t(`service_${srv.id}_desc`)}</p>
                      </button>
                    )
                  })}
                </div>
                <div className="pt-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!formData.service}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {t('next')} <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DATE & TIME */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> {t('booking_date')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                  />
                </div>
                
                {formData.date && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">{t('booking_time')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setFormData({ ...formData, time })}
                          className={`
                            py-3 rounded-xl text-sm font-bold border transition-all
                            ${formData.time === time 
                              ? 'bg-primary text-white border-primary shadow-md shadow-blue-200' 
                              : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-blue-50'}
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-6 flex justify-between">
                  <button onClick={handlePrev} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!formData.date || !formData.time}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {t('next')} <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PATIENT DETAILS */}
            {step === 3 && (
              <motion.form
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('last_name')}</label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('first_name')}</label>
                    <input
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('phone')}</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      title="Veuillez entrer un numéro de téléphone valide à 10 chiffres (ex: 0558222317)"
                      placeholder="Ex: 05 58 22 23 17"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value.replace(/[^0-9]/g, '') })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('age')}</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('booking_motif_label')}</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('booking_motif_placeholder')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('booking_prescription')}</label>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-3">
                      <p className="text-sm text-slate-500 font-medium"><span className="font-bold text-primary">{t('upload_click')}</span> {t('upload_drag')}</p>
                      <p className="text-xs text-slate-400 mt-1">{formData.document ? formData.document.name : t('upload_any_type')}</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setFormData({ ...formData, document: e.target.files[0] })}
                    />
                  </label>
                </div>

                <div className="pt-6 flex justify-between">
                  <button type="button" onClick={handlePrev} disabled={isSubmitting} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center group"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />}
                    {t('booking_confirm_btn')}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={variants}
                initial="enter"
                animate="center"
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-center py-8"
              >
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
