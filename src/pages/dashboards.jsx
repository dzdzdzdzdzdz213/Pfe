import React from 'react';
import { Users, Calendar, Activity, Database, ClipboardList, Stethoscope, FileText, User } from 'lucide-react';

const DashboardCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold mt-1 text-slate-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600 border border-${color}-100`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

// Administrator Dashboard
export const AdminDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard title="Total Utilisateurs" value="24" icon={Users} color="blue" />
      <DashboardCard title="Rendez-vous Aujourd'hui" value="12" icon={Calendar} color="teal" />
      <DashboardCard title="Examens en attente" value="8" icon={Activity} color="amber" />
      <DashboardCard title="Base de données" value="98%" icon={Database} color="green" />
    </div>
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Interface Administrateur</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Bienvenue dans votre centre de contrôle. Gérez les utilisateurs et surveillez l'activité système.</p>
      </div>
    </div>
  </div>
);

// Assistant Dashboard
export const AssistantDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard title="Prochains RDV" value="5" icon={Calendar} color="blue" />
      <DashboardCard title="Nouveaux Patients" value="3" icon={Users} color="teal" />
      <DashboardCard title="Docs à valider" value="2" icon={FileText} color="amber" />
    </div>
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Interface Assistant</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Gérez les rendez-vous et accueillez les patients. Votre calendrier est à jour.</p>
      </div>
    </div>
  </div>
);

// Radiologist Dashboard
export const RadiologueDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard title="Examens à traiter" value="7" icon={Stethoscope} color="blue" />
      <DashboardCard title="Comptes-rendus validés" value="15" icon={ClipboardList} color="teal" />
      <DashboardCard title="Patients du jour" value="9" icon={Users} color="amber" />
    </div>
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Stethoscope className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Interface Radiologue</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Analysez les images et rédigez vos comptes-rendus avec précision.</p>
      </div>
    </div>
  </div>
);

// Patient Dashboard
export const PatientDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard title="Prochain RDV" value="Lun 14:00" icon={Calendar} color="blue" />
      <DashboardCard title="Résultats Dispos" value="2" icon={FileText} color="teal" />
      <DashboardCard title="Notifications" value="1" icon={Activity} color="amber" />
    </div>
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Interface Patient</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Accédez à vos résultats d'examens et gérez vos prises de rendez-vous en ligne.</p>
      </div>
    </div>
  </div>
);
