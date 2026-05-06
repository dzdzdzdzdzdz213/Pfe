import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Scan, Bone, Activity, Waves, HeartPulse, Microscope, Syringe, ClipboardCheck, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PageTransition } from '@/components/common/PageTransition';
import { useLanguage } from '../../contexts/LanguageContext';
import { FileUpload } from '@/components/common/FileUpload';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const Booking = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const initialService = location.state?.serviceId || '';
  const initialServiceName = location.state?.serviceName || '';

  // --- CONFIGURATION DES LIMITES DE DATE ---
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  // Calcul de la date maximale (Aujourd'hui + 7 jours)
  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [step, setStep] = useState(initialService ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenSlots, setTakenSlots] = useState([]); // État pour stocker les heures déjà prises

  const [formData, setFormData] = useState({
    service: initialService ? { id: initialService, name: initialServiceName } : null,
    date: todayStr,
    time: '',
    nom: '',
    prenom: '',
    telephone: '',
    age: '',
    gender: 'M',
    documentUrl: '',
    notes: ''
  });

  const servicesList = [
    { id: 1, icon: Scan }, { id: 2, icon: Bone }, { id: 3, icon: Waves }, { id: 4, icon: Activity },
    { id: 5, icon: HeartPulse }, { id: 6, icon: Microscope }, { id: 7, icon: Syringe }, { id: 8, icon: ClipboardCheck },
  ];

  const timeSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

  const isPhoneValid = /^(05|06|07)[0-9]{8}$/.test(formData.telephone.replace(/\s/g, ''));

  const handleNameChange = (field, value) => {
    const cleanValue = value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '');
    setFormData({ ...formData, [field]: cleanValue });
  };

  const formatAlgerianPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)} ${digits.slice(2)}`;
    if (digits.length <= 6) return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4)}`;
    if (digits.length <= 8) return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,6)} ${digits.slice(6)}`;
    return `${digits.slice(0,2)} ${digits.slice(2,4)} ${digits.slice(4,6)} ${digits.slice(6,8)} ${digits.slice(8)}`;
  };

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
          return format(d, 'HH:mm');
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
    // Double sécurité pour l'âge et tél avant envoi
    if (parseInt(formData.age) > 120 || !isPhoneValid) return;

    setIsSubmitting(true);
    try {
      const startDate = new Date(`${formData.date}T${formData.time}`);
      const endDate = new Date(startDate.getTime() + 30 * 60000);
      const documentInfo = formData.documentUrl ? `\n[DOC:${formData.documentUrl}]` : '';

      const serviceTag = formData.service ? `[${formData.service.name}]` : '';
      const motif = `${serviceTag} ${formData.notes || 'Demande en ligne'} — Patient: ${formData.prenom} ${formData.nom} — Tél: ${formData.telephone} — Âge: ${formData.age}${documentInfo}`;

      const { error } = await supabase
        .from('rendez_vous')
        .insert({
          date_heure_debut: startDate.toISOString(),
          date_heure_fin: endDate.toISOString(),
          motif,
          statut: 'planifie',
        });

      if (error) throw error;
      setStep(4);
    } catch (err) { 
      console.error("Booking error:", err);
      toast.error("Erreur lors de la réservation: " + (err.message || "Problème de connexion"));
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
                    const isSelected = formData.service?.id === srv.id;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, service: { id: srv.id, name: serviceTitle } }));
                          setStep(2);
                        }}
                        className={`
                          p-5 rounded-2xl text-left border-2 transition-all duration-200 group flex flex-col items-start
                          ${isSelected
                            ? 'border-primary bg-blue-50/50 shadow-[0_4px_15px_rgba(37,99,235,0.15)]'
                            : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="w-full flex justify-between items-start mb-3">
                          <SrvIcon className={`w-7 h-7 ${isSelected ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} transition-colors`} />
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{serviceTitle}</h3>
                        <p className="text-[10px] font-medium text-slate-500 leading-snug line-clamp-2">{t(`service_${srv.id}_desc`)}</p>
                      </button>
                    );
                  })}
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
                    min={todayStr}
                    max={maxDate} // LIMITATION À 7 JOURS
                    onChange={(e) => {
                      const s = e.target.value;
                      if (s < todayStr) setFormData({ ...formData, date: todayStr, time: '' });
                      else if (s > maxDate) setFormData({ ...formData, date: maxDate, time: '' });
                      else setFormData({ ...formData, date: s, time: '' });
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                  />
                </div>

                {formData.date && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">{t('booking_time')}</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {timeSlots.map((time) => {
                        const [h, m] = time.split(':').map(Number);
                        const slotMinutes = h * 60 + m;
                        const isPastTime = formData.date === todayStr && slotMinutes < currentTime;
                        const isTaken = takenSlots.includes(time); // Vérifie si l'heure est en base
                        const isDisabled = isPastTime || isTaken;

                        return (
                          <button
                            key={time}
                            disabled={isDisabled}
                            onClick={() => setFormData({ ...formData, time })}
                            className={`
                              py-3 rounded-xl text-sm font-bold border transition-all
                              ${isDisabled
                                ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed opacity-50' // STYLE ROUGE : Indisponible
                                : formData.time === time
                                  ? 'bg-primary text-white border-primary shadow-md shadow-blue-200'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-blue-50'}
                            `}
                          >
                            {time}
                            {isDisabled && <span className="block text-[8px] mt-0.5">{isTaken ? 'COMPLET' : 'PASSÉ'}</span>}
                          </button>
                        );
                      })}
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
              <motion.form key="step3" variants={variants} initial="enter" animate="center" exit="exit" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" required placeholder={t('last_name')} value={formData.nom} onChange={(e) => handleNameChange('nom', e.target.value)} className="p-4 bg-slate-50 border rounded-xl" />
                  <input type="text" required placeholder={t('first_name')} value={formData.prenom} onChange={(e) => handleNameChange('prenom', e.target.value)} className="p-4 bg-slate-50 border rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center justify-between">
                      {t('phone')}
                      <span className="text-[9px] lowercase text-slate-400 font-normal">06 12 34 56 78</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={14}
                      placeholder="06 12 34 56 78"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: formatAlgerianPhone(e.target.value) })}
                      className={`w-full p-4 bg-slate-50 border rounded-xl outline-none ${formData.telephone.length > 0 && !isPhoneValid ? 'border-red-400' : 'border-slate-200'}`}
                    />
                    {formData.telephone.length > 0 && !isPhoneValid && <p className="text-[10px] text-red-500 font-bold ml-2 italic">Numéro non valide (05/06/07 XX XX XX XX)</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">{t('age')}</label>
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Ordonnance médicale</label>
                  <FileUpload 
                    bucket="documents" 
                    folder="public" 
                    onUploadComplete={(files) => {
                      if (files.length > 0) {
                        setFormData({ ...formData, documentUrl: files[0].url });
                      }
                    }}
                  />
                </div>
                <textarea rows={2} placeholder={t('booking_motif_placeholder')} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full p-4 bg-slate-50 border rounded-xl resize-none" />
                <div className="flex justify-between pt-4">
                  <button type="button" onClick={handlePrev} className="px-6 py-3 font-bold text-slate-500">{t('back')}</button>
                  <button type="submit" disabled={isSubmitting || !isPhoneValid || !formData.age || !formData.nom || !formData.prenom} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold flex items-center shadow-lg disabled:opacity-50 hover:bg-emerald-600 transition-colors">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />} {t('booking_confirm_btn')}
                  </button>
                </div>
              </motion.form>
            )}

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
                    .replace('{service}', formData.service?.name || '')
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