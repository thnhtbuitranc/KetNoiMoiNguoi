import React, { useState } from 'react';
import { Card, Button, Switch, Input } from '../components/ui';
import { Bell, Lock, Globe, User, Palette, Moon, Shield, Eye, Mail } from 'lucide-react';
import { Language } from '../types';

interface SettingsProps {
  lang: Language;
}

type SettingsTab = 'GENERAL' | 'PRIVACY' | 'NOTIFICATIONS';

const SettingsPage: React.FC<SettingsProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  
  // Settings State
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'GENERAL':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Account Section */}
             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <User size={20} className="text-primary-600" /> Tài khoản
                </h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Tên hiển thị</label>
                      <Input defaultValue="Nguyễn An" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Email</label>
                      <Input defaultValue="an.nguyen@example.com" disabled className="bg-slate-50 text-slate-500" />
                   </div>
                   <div className="pt-2">
                      <Button>Cập nhật thông tin</Button>
                   </div>
                </div>
             </Card>

             {/* Preferences Section */}
             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Palette size={20} className="text-purple-600" /> Tùy chỉnh
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="font-medium text-slate-900 text-sm">Chế độ tối</p>
                         <p className="text-xs text-slate-500">Giao diện tối cho ban đêm.</p>
                      </div>
                      <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                   </div>
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="font-medium text-slate-900 text-sm">Ngôn ngữ</p>
                         <p className="text-xs text-slate-500">Ngôn ngữ hiển thị chính.</p>
                      </div>
                      <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500">
                         <option>Tiếng Việt</option>
                         <option>English</option>
                      </select>
                   </div>
                </div>
             </Card>
          </div>
        );
      case 'PRIVACY':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Lock size={20} className="text-slate-600" /> Quyền riêng tư
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="font-medium text-slate-900 text-sm flex items-center gap-2">
                           <Globe size={14} /> Hồ sơ công khai
                         </p>
                         <p className="text-xs text-slate-500">Cho phép người khác tìm thấy bạn qua QR hoặc Email.</p>
                      </div>
                      <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
                   </div>
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="font-medium text-slate-900 text-sm flex items-center gap-2">
                           <Mail size={14} /> Hiển thị Email
                         </p>
                         <p className="text-xs text-slate-500">Hiển thị email công khai trên hồ sơ của bạn.</p>
                      </div>
                      <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                   </div>
                </div>
             </Card>
             <Card className="p-6 border-red-100 bg-red-50/30">
                <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                   <Shield size={20} /> Vùng nguy hiểm
                </h3>
                <div className="flex items-center justify-between">
                   <p className="text-sm text-slate-600">Xóa vĩnh viễn tài khoản và dữ liệu.</p>
                   <Button variant="danger" size="sm">Xóa tài khoản</Button>
                </div>
             </Card>
          </div>
        );
      case 'NOTIFICATIONS':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Bell size={20} className="text-amber-500" /> Thông báo
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="font-medium text-slate-900 text-sm">Thông báo đẩy (Push)</p>
                         <p className="text-xs text-slate-500">Nhận thông báo ngay lập tức về sinh nhật, sự kiện.</p>
                      </div>
                      <Switch checked={notifications} onCheckedChange={setNotifications} />
                   </div>
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="font-medium text-slate-900 text-sm">Email nhắc nhở</p>
                         <p className="text-xs text-slate-500">Nhận tổng hợp sự kiện hàng tuần qua email.</p>
                      </div>
                      <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                   </div>
                </div>
             </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Cài đặt</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý tùy chọn ứng dụng và tài khoản của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Menu */}
        <div className="space-y-2">
           <button 
             onClick={() => setActiveTab('GENERAL')}
             className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'GENERAL' ? 'bg-white text-primary-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
           >
              <User size={18} /> Chung
           </button>
           <button 
             onClick={() => setActiveTab('PRIVACY')}
             className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'PRIVACY' ? 'bg-white text-primary-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
           >
              <Lock size={18} /> Quyền riêng tư
           </button>
           <button 
             onClick={() => setActiveTab('NOTIFICATIONS')}
             className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeTab === 'NOTIFICATIONS' ? 'bg-white text-primary-600 border border-slate-200 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
           >
              <Bell size={18} /> Thông báo
           </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2">
           {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;