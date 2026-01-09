import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, User, Settings, LogOut, Menu, X, Bell, Search, LayoutGrid, HeartHandshake, Shield, Sparkles, FolderOpen, Grid, List, Calendar as CalendarIcon, StickyNote } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Connections from './pages/Connections';
import Vault from './pages/Vault';
import CalendarPage from './pages/Calendar';
import SettingsPage from './pages/Settings';
import Memories from './pages/Memories';
import { Language } from './types';
import { Button } from './components/ui';
import { supabase, checkAndGenerateNotifications } from './services/supabase';
import NotificationPanel from './components/NotificationPanel';

// Sidebar Navigation
const Sidebar: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  lang: Language;
  onLogout: () => void;
}> = ({ isOpen, onClose, lang, onLogout }) => {
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<{name: string, avatar: string}>({ 
      name: 'Loading...', 
      avatar: 'https://ui-avatars.com/api/?background=random' 
  });

  useEffect(() => {
     const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           const { data } = await supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single();
           if (data) {
              setUserProfile({
                 name: data.name || user.email?.split('@')[0] || 'User',
                 avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=random`
              });
           } else {
              setUserProfile({
                  name: user.email?.split('@')[0] || 'User',
                  avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=random`
              });
           }
        }
     };
     fetchUser();
  }, [isOpen]); // Refresh when opened or mounted
  
  const NavItem: React.FC<{ to: string; icon: React.ElementType; label: string }> = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-1 ${
          isActive 
            ? 'bg-primary-50 text-primary-600 font-semibold' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <HeartHandshake size={20} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900 tracking-tight">Kết Nối Mọi Người</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-4 mt-2">Menu</div>
            <NavItem to="/dashboard" icon={LayoutGrid} label={'Tổng quan'} />
            <NavItem to="/connections" icon={HeartHandshake} label={'Danh bạ'} />
            <NavItem to="/memories" icon={Sparkles} label={'Kỷ niệm'} />
            <NavItem to="/calendar" icon={CalendarIcon} label={'Lịch & Sự kiện'} />
            <NavItem to="/vault" icon={FolderOpen} label={'Kho lưu trữ'} />
            <NavItem to="/profile" icon={User} label={'Hồ sơ cá nhân'} />
          </nav>

          {/* User & Logout */}
          <div className="pt-6 border-t border-slate-100">
             <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium mb-4">
                <Settings size={20} />
                <span>{'Cài đặt'}</span>
             </Link>
            
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors" onClick={onLogout}>
               <img src={userProfile.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{userProfile.name}</p>
                  <p className="text-xs text-slate-500 truncate">Đăng xuất</p>
               </div>
               <LogOut size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const AppContent: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.VI);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifButtonRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 1. Check active session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if(session) {
         // Run check for notifications
         checkAndGenerateNotifications();
      }
    });

    // 2. Listen for changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) setShowAuth(false);
      if (session && _event === 'SIGNED_IN') {
         checkAndGenerateNotifications();
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const toggleLang = () => setLang(prev => prev === Language.VI ? Language.EN : Language.VI);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setShowAuth(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* Application (Logged In) */}
      {isLoggedIn && (
        <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
           {/* Mobile Header */}
           <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex justify-between items-center lg:hidden">
              <div className="flex items-center gap-4">
                 <button className="p-2 -ml-2 text-slate-500" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                 </button>
                 <span className="font-bold text-lg">Kết Nối Mọi Người</span>
              </div>
              
              {/* Mobile Bell */}
              <div className="relative" ref={notifButtonRef}>
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600"
                 >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                 </button>
                 <NotificationPanel 
                     isOpen={showNotifications} 
                     onClose={() => setShowNotifications(false)}
                     onUpdateUnreadCount={setUnreadCount}
                 />
              </div>
           </header>
           
           {/* Desktop Top Bar */}
           <div className="hidden lg:flex justify-end items-center p-6 gap-4">
               <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 w-80 shadow-sm">
                  <Search size={16} className="text-slate-400 mr-2" />
                  <input type="text" placeholder="Tìm kiếm bạn bè, kỷ niệm..." className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 placeholder-slate-400" />
                  <div className="flex gap-1">
                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">⌘</span>
                    <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">K</span>
                  </div>
               </div>
               <button onClick={toggleLang} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all font-bold text-xs">
                  {lang}
               </button>
               
               {/* Desktop Bell */}
               <div className="relative" ref={notifButtonRef}>
                  <button 
                     onClick={() => setShowNotifications(!showNotifications)}
                     className={`w-10 h-10 flex items-center justify-center rounded-full border text-slate-600 hover:bg-slate-50 shadow-sm transition-all relative ${showNotifications ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200'}`}
                  >
                     <Bell size={18} />
                     {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                     )}
                  </button>
                  <NotificationPanel 
                     isOpen={showNotifications} 
                     onClose={() => setShowNotifications(false)}
                     onUpdateUnreadCount={setUnreadCount}
                 />
               </div>
           </div>

           {/* Main Content */}
           <main className="flex-1 px-6 pb-10 max-w-[1600px] w-full mx-auto">
              <Routes>
                <Route path="/dashboard" element={<Dashboard lang={lang} />} />
                <Route path="/connections" element={<Connections lang={lang} />} />
                <Route path="/memories" element={<Memories lang={lang} />} />
                <Route path="/calendar" element={<CalendarPage lang={lang} />} />
                <Route path="/vault" element={<Vault lang={lang} />} />
                <Route path="/profile" element={<Profile lang={lang} />} />
                <Route path="/settings" element={<SettingsPage lang={lang} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
           </main>
        </div>
      )}

      {/* Sidebar (Logged In) */}
      {isLoggedIn && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          lang={lang} 
          onLogout={handleLogout} 
        />
      )}

      {/* Auth Flow (Logged Out) */}
      {!isLoggedIn && (
         <Routes>
            <Route path="/" element={
               showAuth ? (
                  <AuthPage 
                     onLogin={() => setIsLoggedIn(true)} 
                     onBack={() => setShowAuth(false)} 
                  />
               ) : (
                  <LandingPage 
                     onGetStarted={() => setShowAuth(true)} 
                     lang={lang} 
                  />
               )
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
         </Routes>
      )}

    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}