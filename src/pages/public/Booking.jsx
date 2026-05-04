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

  // --- CONFIGURATION DES LIMITES DE DATE ---
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Calcul de la date maximale (Aujourd'hui + 3 mois)
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 3);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [step, setStep] = useState(initialService ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenSlots, setTakenSlots] = useState([]);

  const [formData, setFormData] = useState({
    service: initialService,
    serviceName: initialServiceName,
    date: today,
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
    { id: 1, icon: Scan }, { id: 2, icon: Bone }, { id: 3, icon: Waves }, { id: 4, icon: Activity },
    { id: 5, icon: HeartPulse }, { id: 6, icon: Microscope }, { id: 7, icon: Syringe }, { id: 8, icon: ClipboardCheck },
  ];

  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  const isPhoneValid = /^(05|06|07)[0-9]{8}$/.test(formData.telephone);

  const handleNameChange = (field, value) => {
    const cleanValue = value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '');
    setFormData({ ...formData, [field]: cleanValue });
  };

  useEffect(() => {
    const fetchTakenSlots = async () => {
      if (!formData.date) return;
      const { data, error } = await supabase
        .from('rendez_vous')
        .select('date_heure_debut')
        .gte('date_heure_debut', `${formData.date}T00:00:00`)
        .lte('date_heure_debut', `${formData.date}T23:59:59`);

      if (!error && data) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseInt(formData.age) > 120 || !isPhoneValid) return;
    setIsSubmitting(true);
    try {
      const startDate = new Date(`${formData.date}T${formData.time}`);
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      let documentInfo = '';
      if (formData.document) {
        const file = formData.document;
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `public/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
          documentInfo = ` [DOC:${urlData.publicUrl}]`;
        }
      }
      const motif = `[${formData.serviceName}] ${formData.notes || 'Demande en ligne'} — Patient: ${formData.prenom} ${formData.nom} — Tél: ${formData.telephone} — Âge: ${formData.age}${documentInfo}`;
      await supabase.from('rendez_vous').insert({ date_heure_debut: startDate.toISOString(), date_heure_fin: endDate.toISOString(), motif, statut: 'planifie' });
      setStep(4);
    } catch (err) { setStep(4); } finally { setIsSubmitting(false); }
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0, filter: 'blur(4px)' }),
    center: { zIndex: 1, x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0, filter: 'blur(4px)' })
  };

  return (
    <PageTransition className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center justify-center w-10 h-10 rounded-2xl font-bold transition-all ${step >= i ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{i}</div>
                {i < 3 && <div className={`flex-1 h-1 mx-2 rounded-full ${step > i ? 'bg-primary' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{step === 1 ? t('booking_choose_service') : step === 2 ? t('booking_choose_date') : step === 3 ? t('booking_details') : t('booking_confirm_success')}</h2>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-xl border border-slate-100 min-h-[400px]">
          <AnimatePresence mode="wait">

            {step === 1 && (
              <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {servicesList.map((srv) => (
                  <button key={srv.id} onClick={() => { setFormData({ ...formData, service: srv.id, serviceName: t(`service_${srv.id}_title`) }); handleNext(); }} className={`p-5 rounded-2xl text-left border-2 transition-all ${formData.service === srv.id ? 'border-primary bg-blue-50' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                    <srv.icon className={`w-7 h-7 mb-3 ${formData.service === srv.id ? 'text-primary' : 'text-slate-400'}`} />
                    <h3 className="font-bold text-slate-800 text-sm">{t(`service_${srv.id}_title`)}</h3>
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="space-y-6">
                <input
                  type="date"
                  value={formData.date}
                  min={today}
                  max={maxDate} // LIMITATION À 3 MOIS
                  onChange={(e) => {
                    const s = e.target.value;
                    if (s < today) setFormData({ ...formData, date: today, time: '' });
                    else if (s > maxDate) setFormData({ ...formData, date: maxDate, time: '' });
                    else setFormData({ ...formData, date: s, time: '' });
                  }}
                  className="w-full p-4 bg-slate-50 border rounded-2xl outline-none"
                />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {timeSlots.map((time) => {
                    const [h, m] = time.split(':').map(Number);
                    const slotMinutes = h * 60 + m;
                    const isPastTime = formData.date === today && slotMinutes < currentTime;
                    const isTaken = takenSlots.includes(time);
                    const isDisabled = isPastTime || isTaken;
                    return (
                      <button key={time} disabled={isDisabled} onClick={() => setFormData({ ...formData, time })} className={`py-3 rounded-xl text-sm font-bold border transition-all ${isDisabled ? 'bg-red-50 text-red-200 border-red-50 cursor-not-allowed opacity-50' : formData.time === time ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-primary'}`}>
                        {time}
                        {isDisabled && <span className="block text-[8px]">{isTaken ? 'COMPLET' : 'PASSÉ'}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between">
                  <button onClick={handlePrev} className="px-6 py-3 font-bold text-slate-500">{t('back')}</button>
                  <button onClick={handleNext} disabled={!formData.time} className="px-8 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50">{t('next')}</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.form key="step3" variants={variants} initial="enter" animate="center" exit="exit" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder={t('last_name')} value={formData.nom} onChange={(e) => handleNameChange('nom', e.target.value)} className="p-4 bg-slate-50 border rounded-xl" />
                  <input type="text" required placeholder={t('first_name')} value={formData.prenom} onChange={(e) => handleNameChange('prenom', e.target.value)} className="p-4 bg-slate-50 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <input type="tel" required maxLength={10} placeholder="05 / 06 / 07 ..." value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value.replace(/\D/g, '').substring(0, 10) })} className={`w-full p-4 bg-slate-50 border rounded-xl outline-none ${formData.telephone.length > 0 && !isPhoneValid ? 'border-red-400' : 'border-slate-200'}`} />
                    {formData.telephone.length > 0 && !isPhoneValid && <p className="text-[10px] text-red-500 font-bold ml-2 italic">Numéro non valide (10 chiffres)</p>}
                  </div>
                  <input type="number" required min="0" max="120" placeholder={t('age')} value={formData.age} onChange={(e) => { const v = e.target.value; if (v === '' || (v >= 0 && v <= 120)) setFormData({ ...formData, age: v }); }} className="p-4 bg-slate-50 border rounded-xl" />
                </div>
                <textarea rows={2} placeholder={t('booking_motif_placeholder')} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-xl resize-none" />
                <div className="flex justify-between">
                  <button type="button" onClick={handlePrev} className="px-6 py-3 font-bold text-slate-500">{t('back')}</button>
                  <button type="submit" disabled={isSubmitting || !isPhoneValid || !formData.age || !formData.nom || !formData.prenom} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center shadow-lg disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />} {t('booking_confirm_btn')}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={variants} initial="enter" animate="center" className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-3xl font-black mb-2">{t('booking_sent')}</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">{t('booking_success_desc').replace('{service}', formData.serviceName).replace('{date}', formData.date).replace('{time}', formData.time).replace('{phone}', formData.telephone)}</p>
                <a href="/" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl">{t('back_to_home')}</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};