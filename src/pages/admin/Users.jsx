import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/users';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { toast } from 'sonner';
import { formatDate, generatePassword, cn } from '@/lib/utils';
import { UserPlus, X, Edit, Trash2, Eye, Copy, Loader2, Check, Shield, Stethoscope, HeadphonesIcon } from 'lucide-react';

const ROLE_LABELS = {
  administrateur: { label: 'Administrateur', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Shield },
  radiologue: { label: 'Radiologue', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Stethoscope },
  receptionniste: { label: 'Assistant', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: HeadphonesIcon },
  patient: { label: 'Patient', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: null },
};

export const AdminUsers = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '', role: 'receptionniste', password: generatePassword(),
    matricule_sante: '', specialite_principale: '',
  });

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.fetchUsers(),
  });

  const filteredUsers = roleFilter === 'all'
    ? allUsers
    : allUsers.filter(u => u.role === roleFilter);

  const createMutation = useMutation({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
      setShowDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé');
    },
    onError: (err) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditUser(null);
    setFormData({ nom: '', prenom: '', email: '', telephone: '', role: 'receptionniste', password: generatePassword(), matricule_sante: '', specialite_principale: '' });
    setShowDialog(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setFormData({
      nom: user.nom, prenom: user.prenom, email: user.email, telephone: user.telephone || '', role: user.role,
      password: '', matricule_sante: '', specialite_principale: '',
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (editUser) {
      userService.updateUser(editUser.id, {
        nom: formData.nom, prenom: formData.prenom, email: formData.email, telephone: formData.telephone
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success('Utilisateur mis à jour');
        setShowDialog(false);
      }).catch(err => toast.error(err.message));
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      key: 'name', label: 'Utilisateur',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {row.prenom?.[0]}{row.nom?.[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{row.prenom} {row.nom}</p>
            <p className="text-xs text-slate-500 font-medium">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Rôle',
      render: (row) => {
        const r = ROLE_LABELS[row.role] || ROLE_LABELS.patient;
        return <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold border', r.color)}>{r.label}</span>;
      },
    },
    { key: 'telephone', label: 'Téléphone', render: (row) => <span className="text-sm font-medium">{row.telephone || '-'}</span> },
    { key: 'dateCreationCompte', label: 'Créé le', render: (row) => <span className="text-sm font-medium">{formatDate(row.dateCreationCompte)}</span> },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Edit className="h-4 w-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); setShowDeleteConfirm(true); }} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{allUsers.length} utilisateurs enregistrés</p>
        </div>
        <button onClick={openCreate} className="px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
          <UserPlus className="h-5 w-5" /> Nouvel Utilisateur
        </button>
      </div>

      {/* Role Filter */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'Tous' }, { key: 'administrateur', label: 'Admin' }, { key: 'radiologue', label: 'Radiologue' }, { key: 'receptionniste', label: 'Assistant' }].map(f => (
          <button key={f.key} onClick={() => setRoleFilter(f.key)} className={cn('px-4 py-2 rounded-xl text-sm font-bold transition-all', roleFilter === f.key ? 'bg-primary text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {f.label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filteredUsers} loading={isLoading} searchPlaceholder="Rechercher un utilisateur..." />

      {/* Create / Edit Dialog */}
      {showDialog && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowDialog(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-slate-900">{editUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h2>
              <button onClick={() => setShowDialog(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Prénom *</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.prenom} onChange={e => setFormData(p => ({ ...p, prenom: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Nom *</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.nom} onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Email *</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} disabled={!!editUser} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Téléphone</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.telephone} onChange={e => setFormData(p => ({ ...p, telephone: e.target.value }))} />
              </div>
              {!editUser && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Rôle *</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                      <option value="receptionniste">Assistant / Réceptionniste</option>
                      <option value="radiologue">Radiologue</option>
                    </select>
                  </div>
                  {formData.role === 'radiologue' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Matricule Santé</label>
                        <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.matricule_sante} onChange={e => setFormData(p => ({ ...p, matricule_sante: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Spécialité</label>
                        <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" value={formData.specialite_principale} onChange={e => setFormData(p => ({ ...p, specialite_principale: e.target.value }))} />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 block">Mot de passe temporaire</label>
                    <div className="flex gap-2">
                      <input className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium outline-none" value={formData.password} readOnly />
                      <button onClick={() => { navigator.clipboard.writeText(formData.password); toast.success('Copié !'); }} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                        <Copy className="h-4 w-4 text-slate-500" />
                      </button>
                      <button onClick={() => setFormData(p => ({ ...p, password: generatePassword() }))} className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-primary text-xs font-bold hover:bg-primary/10 transition-colors">Générer</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setShowDialog(false)} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={handleSubmit} disabled={createMutation.isPending} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editUser ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Supprimer cet utilisateur ?"
        description={`Vous êtes sur le point de supprimer ${deleteTarget?.prenom} ${deleteTarget?.nom}. Cette action est irréversible.`}
        variant="destructive"
        confirmText="Supprimer"
      />
    </div>
  );
};
