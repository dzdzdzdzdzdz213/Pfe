import { useState, Fragment } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageTransition } from '@/components/common/PageTransition';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronRight,
  Stethoscope,
  FolderOpen,
  Search
} from 'lucide-react';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Nouveau rendez-vous confirmé", time: "Il y a 5 min", unread: true },
    { id: 2, text: "Compte rendu IRM disponible", time: "Il y a 12 min", unread: true },
    { id: 3, text: "Maintenance système prévue", time: "Hier", unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBasePath = (role) => {
    if (role === 'administrateur') return 'admin';
    if (role === 'receptionniste') return 'assistant';
    return role;
  };

  const getNavigation = (role) => {
    const common = [
      { name: 'Tableau de Bord', href: `/${getRoleBasePath(role)}/dashboard`, icon: LayoutDashboard },
    ];

    if (role === 'administrateur') {
      return [
        ...common,
        { name: 'Utilisateurs', href: '/admin/users', icon: Users },
        { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardList },
        { name: 'Paramètres', href: '/admin/settings', icon: Settings },
      ];
    }

    if (role === 'receptionniste') {
      return [
        ...common,
        { name: 'Calendrier', href: '/assistant/calendar', icon: Calendar },
        { name: 'Patients', href: '/assistant/patients', icon: Users },
      ];
    }

    if (role === 'radiologue') {
      return [
        ...common,
        { name: 'Examens', href: '/radiologue/examens', icon: Stethoscope },
        { name: 'Recherche Patient', href: '/radiologue/patients', icon: Search },
        { name: 'Historique Patient', href: '/radiologue/history', icon: FolderOpen },
      ];
    }

    if (role === 'patient') {
      return [
        ...common,
        { name: 'Mes Rendez-vous', href: '/patient/appointments', icon: Calendar },
        { name: 'Dossier Médical', href: '/patient/records', icon: FolderOpen },
        { name: 'Profil', href: '/patient/profile', icon: User },
      ];
    }

    return common;
  };

  const navigation = getNavigation(role);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-600/50 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0 overflow-y-auto' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full ring-1 ring-slate-100 shadow-sm">
          {/* Sidebar Header */}
          <div className="h-20 flex items-center px-4 border-b border-slate-100 bg-white sticky top-0 z-10 justify-between">
            <Link to="/" className="flex-shrink-0 -ml-2">
              <img src="/logo.png" alt="Chemloul Radiologie" className="h-16 w-auto object-contain transition-transform hover:scale-105 mix-blend-multiply" />
            </Link>
            <button className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-8 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100/50'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'}
                  `}
                >
                  <item.icon className={`mr-3.5 h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-sm' : 'opacity-70 group-hover:scale-110'}`} />
                  {item.name}
                  {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          {/* User Section Bottom */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center px-4 py-3 mb-2 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mr-3 flex-shrink-0">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{user?.email?.split('@')[0]}</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate leading-none mt-0.5">{role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-2.5 text-sm font-bold text-danger hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group"
            >
              <LogOut className="mr-3.5 h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Se Déconnecter
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 mr-4 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {navigation.find(n => location.pathname.startsWith(n.href))?.name || 'Tableau de Bord'}
              </h2>
              <div className="flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                <span>Clinique Chemloul</span>
                <ChevronRight className="h-3 w-3 mx-1 opacity-50" />
                <span className="text-primary/70">{role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 relative">
            
            {/* Notifications Container */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center transition-all relative overflow-hidden group ${showNotifications ? 'text-primary ring-2 ring-primary/20 bg-blue-50' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'}`}
              >
                <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-100 animate-pulse" />
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">{unreadCount} non lus</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => setNotifications(notifications.map(n => n.id === notif.id ? { ...n, unread: false } : n))}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${notif.unread ? 'bg-blue-50/30' : ''}`}
                        >
                          <p className={`text-sm ${notif.unread ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>{notif.text}</p>
                          <p className="text-xs text-slate-400 mt-1 font-medium">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="w-full p-3 text-sm font-bold text-primary hover:bg-blue-50 transition-colors text-center disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      Tout marquer comme lu
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile Container */}
            <div className="relative">
              <div 
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl border flex items-center justify-center group cursor-pointer transition-all duration-300 ${showUserMenu ? 'bg-primary text-white border-primary shadow-lg shadow-blue-500/20' : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white'}`}
              >
                <User className="h-5 w-5 transition-colors" />
              </div>
              
              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{role}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={() => { navigate(`/${getRoleBasePath(role)}/profile`); setShowUserMenu(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" /> Mon Profil
                      </button>
                      <button 
                        onClick={() => { navigate(`/${getRoleBasePath(role)}/settings`); setShowUserMenu(false); }}
                        className="w-full flex items-center px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" /> Paramètres
                      </button>
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" /> Se Déconnecter
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Click Outside Overlay */}
            {(showNotifications || showUserMenu) && (
              <div 
                className="fixed inset-0 z-40"
                onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}
              />
            )}
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 custom-scrollbar bg-slate-50/50">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
};
