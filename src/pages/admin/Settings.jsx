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
      const { data, error } = await supabase.from('service').select('*').order('nom');
      if (error) throw error;
      return data;
    },
  });

  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editService, setEditService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ nom: '', description: '' });

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('service').insert(data).select().single();
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
      const { data: result, error } = await supabase.from('service').update(data).eq('id', id).select().single();
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
      const { error } = await supabase.from('service').delete().eq('id', id);
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
    setServiceForm({ nom: service.nom, description: service.description || '' });
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

  // Working hours state
  const [workingHours, setWorkingHours] = useState(
    DAYS.map(d => ({ day: d.key, open: '08:00', close: '17:00', isClosed: d.key === 'dimanche' }))
  );

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
            <button onClick={() => { setEditService(null); setServiceForm({ nom: '', description: '' }); setShowServiceDialog(true); }} className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {loadingServices ? (
              [...Array(3)].map((_, i) => <div key={i} className="px-6 py-5 flex items-center gap-4"><div className="h-4 w-40 bg-slate-100 rounded animate-pulse" /></div>)
            ) : services.length > 0 ? (
              services.map((service) => (
                <div key={service.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{service.nom}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{service.description || 'Aucune description'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openServiceEdit(service)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => deleteServiceMutation.mutate(service.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
          <button onClick={() => toast.success('Heures enregistrées')} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
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
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" defaultValue="CHEMLOUL RADIOLOGIE" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Téléphone</label>
              <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" placeholder="+213 XX XX XX XX" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Email</label>
              <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" placeholder="contact@chemloul-radio.dz" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Durée RDV par défaut (min)</label>
              <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" defaultValue={30} min={5} max={120} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Adresse</label>
            <textarea rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none" placeholder="Adresse complète de la clinique" />
          </div>
          <button onClick={() => toast.success('Paramètres enregistrés')} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-100">
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
