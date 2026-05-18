import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Check, X, Clock, Building, Stethoscope, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = [
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
  { key: 'vendredi', label: 'Vendredi' },
  { key: 'samedi', label: 'Samedi' },
  { key: 'dimanche', label: 'Dimanche' },
];

export const AdminSettings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('services');

  // Services management
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('nom');
      if (error) throw error;
      return data;
    },
  });

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editService, setEditService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ nom: '', description: '', image_url: '', tag: '' });
  const [imageUploading, setImageUploading] = useState(false);

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      // Block duplicate names client-side (no DB unique constraint exists on `nom`)
      const trimmed = (data.nom || '').trim();
      const { data: existing } = await supabase
        .from('services')
        .select('id')
        .ilike('nom', trimmed)
        .maybeSingle();
      if (existing) {
        throw new Error(`Un service nommé "${trimmed}" existe déjà.`);
      }

      const { data: result, error } = await supabase
        .from('services')
        .insert({ ...data, nom: trimmed })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service ajouté');
      setShowServiceDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase.from('services').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service mis à jour');
      setShowServiceDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service supprimé');
    },
    onError: (err) => toast.error(err.message),
  });

  const openServiceEdit = (service) => {
    setEditService(service);
    setServiceForm({
      nom: service.nom,
      description: service.description || '',
      image_url: service.image_url || '',
      tag: service.tag || '',
    });
    setShowServiceDialog(true);
  };

  const handleServiceSubmit = () => {
    if (!serviceForm.nom) { toast.error('Le nom est obligatoire'); return; }
    if (editService) {
      updateServiceMutation.mutate({ id: editService.id, data: serviceForm });
    } else {
      createServiceMutation.mutate(serviceForm);
    }
  };

  // Upload an image to the public 'documents' bucket and store its public URL on the form
  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `services/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      setServiceForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast.success('Image téléchargée');
    } catch (err) {
      toast.error("Erreur lors du téléchargement de l'image : " + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  // Working hours state
  const [workingHours, setWorkingHours] = useState(() => {
    const saved = localStorage.getItem('clinic_working_hours');
    return saved ? JSON.parse(saved) : DAYS.map(d => ({ 
      day: d.key, 
      open: '08:00', 
      close: '17:00', 
      isClosed: d.key === 'dimanche' 
    }));
  });

  // Clinic Info state
  const [clinicInfo, setClinicInfo] = useState(() => {
    const saved = localStorage.getItem('clinic_info');
    return saved ? JSON.parse(saved) : {
      nom: 'CHEMLOUL RADIOLOGIE',
      telephone: '',
      email: '',
      adresse: ''
    };
  });

  const tabs = [
    { id: 'services', label: 'Services', icon: Stethoscope },
    { id: 'hours', label: 'Horaires', icon: Clock },
    { id: 'clinic', label: 'Clinique', icon: Building },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Paramètres Système</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Configurez les paramètres de la clinique</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 -mb-px',
              activeTab === tab.id ? 'text-primary border-primary bg-white' : 'text-slate-500 border-transparent hover:text-slate-700'
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800">Services Médicaux</h3>
            <button onClick={() => { setEditService(null); setServiceForm({ nom: '', description: '', image_url: '', tag: '' }); setShowServiceDialog(true); }} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loadingServices ? (
              [...Array(3)].map((_, i) => <div key={i} className="px-6 py-5 flex items-center gap-4"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse" /></div>)
            ) : services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.nom} className="h-12 w-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{service.nom}</p>
                        {service.tag && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">{service.tag}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{service.description || 'Aucune description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openServiceEdit(service)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => { if (window.confirm(`Supprimer le service "${service.nom}" ?`)) deleteServiceMutation.mutate(service.id); }} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 font-semibold text-sm">Aucun service configuré</div>
            )}
          </div>
        </div>
      )}

      {/* Working Hours Tab */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-800">Heures de Travail</h3>
          <div className="space-y-3">
            {workingHours.map((wh, i) => (
              <div key={wh.day} className="flex items-center gap-4 flex-wrap">
                <div className="w-28">
                  <span className="text-sm font-bold text-slate-700 capitalize">{DAYS.find(d => d.key === wh.day)?.label}</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!wh.isClosed} onChange={(e) => { const hrs = [...workingHours]; hrs[i].isClosed = !e.target.checked; setWorkingHours(hrs); }} className="h-4 w-4 rounded border-slate-300 text-primary accent-primary" />
                  <span className="text-xs font-semibold text-slate-500">Ouvert</span>
                </label>
                {!wh.isClosed && (
                  <>
                    <input type="time" value={wh.open} onChange={(e) => { const hrs = [...workingHours]; hrs[i].open = e.target.value; setWorkingHours(hrs); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10" />
                    <span className="text-slate-400 font-bold">à</span>
                    <input type="time" value={wh.close} onChange={(e) => { const hrs = [...workingHours]; hrs[i].close = e.target.value; setWorkingHours(hrs); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10" />
                  </>
                )}
                {wh.isClosed && <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">Fermé</span>}
              </div>
            ))}
          </div>
          <button onClick={() => {
            localStorage.setItem('clinic_working_hours', JSON.stringify(workingHours));
            toast.success('Heures enregistrées');
          }} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      )}

      {/* Clinic Tab */}
      {activeTab === 'clinic' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-extrabold text-slate-800">Informations Clinique</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Nom de la clinique</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" 
                value={clinicInfo.nom}
                onChange={e => setClinicInfo(p => ({ ...p, nom: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Téléphone</label>
              <input 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" 
                placeholder="+213 XX XX XX XX" 
                value={clinicInfo.telephone}
                onChange={e => setClinicInfo(p => ({ ...p, telephone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Email</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" 
                placeholder="contact@chemloul-radio.dz" 
                value={clinicInfo.email}
                onChange={e => setClinicInfo(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Durée RDV par défaut (min)</label>
              <input 
                type="number" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" 
                defaultValue={30} 
                min={5} 
                max={120} 
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Adresse</label>
            <textarea 
              rows={2} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" 
              placeholder="Adresse complète de la clinique" 
              value={clinicInfo.adresse}
              onChange={e => setClinicInfo(p => ({ ...p, adresse: e.target.value }))}
            />
          </div>
          <button 
            onClick={() => {
              localStorage.setItem('clinic_info', JSON.stringify(clinicInfo));
              toast.success('Paramètres enregistrés');
            }} 
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100"
          >
            <Save className="h-4 w-4" /> Enregistrer
          </button>
        </div>
      )}

      {/* Service Dialog */}
      {showServiceDialog && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowServiceDialog(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">{editService ? 'Modifier Service' : 'Nouveau Service'}</h2>
              <button onClick={() => setShowServiceDialog(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Nom du Service *</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={serviceForm.nom} onChange={e => setServiceForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Radiographie, Scanner, IRM..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} placeholder="Description du service..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Étiquette (Tag)</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={serviceForm.tag} onChange={e => setServiceForm(p => ({ ...p, tag: e.target.value }))} placeholder="Ex: Haute précision, Vasculaire, Dépistage..." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Photo du service</label>
                {serviceForm.image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                    <img src={serviceForm.image_url} alt="aperçu" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => setServiceForm(p => ({ ...p, image_url: '' }))}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-lg text-red-600 hover:text-red-700 shadow"
                      title="Retirer la photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                <label className={cn(
                  "flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-xl text-sm font-bold transition-all cursor-pointer",
                  imageUploading
                    ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-wait'
                    : 'border-slate-200 bg-slate-50 hover:border-primary hover:bg-blue-50/30 text-slate-600 hover:text-primary'
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={imageUploading}
                    onChange={e => handleImageUpload(e.target.files?.[0])}
                  />
                  {imageUploading ? 'Téléchargement…' : (serviceForm.image_url ? 'Remplacer la photo' : 'Téléverser une photo')}
                </label>
                <p className="text-[10px] text-slate-400 font-medium mt-1.5">Vous pouvez aussi coller une URL ci-dessous</p>
                <input
                  className="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                  value={serviceForm.image_url}
                  onChange={e => setServiceForm(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://… ou /images/exemple.jpg"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
              <button onClick={() => setShowServiceDialog(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={handleServiceSubmit} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
                <Check className="h-4 w-4" /> {editService ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
