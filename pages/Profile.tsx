import React, { useState, useRef } from 'react';
import { Button, Card, Badge, Modal, Input } from '../components/ui';
import { Camera, Share2, Settings, Smartphone, Mail, MapPin, Activity, QrCode, Lock, Globe, Eye, EyeOff, Save, Download, Copy, Briefcase, GraduationCap, Palette, Users } from 'lucide-react';
import { Language } from '../types';

interface ProfileProps {
  lang: Language;
}

type PrivacyLevel = 'PUBLIC' | 'FRIENDS' | 'CLOSE_FRIENDS' | 'PRIVATE';

interface UserField {
  value: string;
  privacy: PrivacyLevel;
}

const Profile: React.FC<ProfileProps> = ({ lang }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // File Input Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Expanded User Data
  const [userInfo, setUserInfo] = useState({
    name: "Nguyễn An",
    role: "Product Designer",
    location: "Saigon, VN",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&fit=crop",
    cover: "bg-gradient-to-r from-slate-200 to-slate-300",
    coverIsImage: false, // Track if cover is image or class string
    email: { value: "an.nguyen@example.com", privacy: 'PRIVATE' } as UserField,
    address: { value: "District 1, HCMC", privacy: 'CLOSE_FRIENDS' } as UserField,
    job: { value: "Digital Nomad & Freelancer", privacy: 'PUBLIC' } as UserField,
    education: { value: "RMIT University - Design", privacy: 'FRIENDS' } as UserField,
    skills: { value: "UI/UX, React, Branding, Photography", privacy: 'PUBLIC' } as UserField,
    hobbies: { value: "Hiking, Coffee, Indie Music", privacy: 'FRIENDS' } as UserField,
    bio: "Building bridges, not walls. Focused on maintaining deep connections with a small circle of friends.",
    tags: ["PHOTOGRAPHY", "TECH", "TRAVEL"]
  });

  const handlePrivacyChange = (field: keyof typeof userInfo, level: PrivacyLevel) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev] as UserField, privacy: level }
    }));
  };

  const handleValueChange = (field: keyof typeof userInfo, newValue: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: { ...prev[field as keyof typeof prev] as UserField, value: newValue }
    }));
  };
  
  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const triggerCoverUpload = () => {
    coverInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setUserInfo(prev => ({
            ...prev,
            [type]: reader.result as string,
            ...(type === 'cover' ? { coverIsImage: true } : {})
          }));
        }
      };
      reader.readAsDataURL(file);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const getPrivacyIcon = (level: PrivacyLevel) => {
    switch (level) {
      case 'PUBLIC': return <Globe size={14} className="text-green-500" />;
      case 'FRIENDS': return <Users size={14} className="text-blue-500" />;
      case 'CLOSE_FRIENDS': return <StarIcon size={14} className="text-purple-500" />;
      case 'PRIVATE': return <Lock size={14} className="text-red-400" />;
      default: return <Lock size={14} className="text-slate-400" />;
    }
  };

  const getPrivacyLabel = (level: PrivacyLevel) => {
    switch (level) {
      case 'PUBLIC': return 'Public';
      case 'FRIENDS': return 'Friends (Tier 1+)';
      case 'CLOSE_FRIENDS': return 'Close Friends (Tier 3+)';
      case 'PRIVATE': return 'Only Me';
      default: return '';
    }
  };

  // Helper component for Star Icon locally
  const StarIcon = ({size, className}: {size:number, className:string}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
  );

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={(e) => handleFileChange(e, 'avatar')} 
        className="hidden" 
        accept="image/*"
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={(e) => handleFileChange(e, 'cover')} 
        className="hidden" 
        accept="image/*"
      />

      {/* Main Digital Card Column */}
      <div className="lg:col-span-2 space-y-8">
         <Card className="overflow-hidden border-none shadow-lg">
            {/* Cover */}
            <div 
              className={`h-48 relative bg-cover bg-center ${!userInfo.coverIsImage ? userInfo.cover : ''}`}
              style={userInfo.coverIsImage ? { backgroundImage: `url("${userInfo.cover}")` } : {}}
            >
               <div className="absolute inset-0 bg-black/10"></div>
               <button 
                  onClick={triggerCoverUpload}
                  className="absolute bottom-4 right-4 bg-white/80 backdrop-blur hover:bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm z-10"
               >
                  <Camera size={14} /> Change Cover
               </button>
            </div>
            
            <div className="px-8 pb-8 text-center -mt-16 relative">
               {/* Avatar */}
               <div className="relative inline-block mb-4 group cursor-pointer" onClick={triggerAvatarUpload}>
                  <img src={userInfo.avatar} className="w-32 h-32 rounded-full object-cover border-[6px] border-white shadow-lg group-hover:brightness-90 transition-all bg-white" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full z-10 bg-black/30">
                      <Camera size={24} className="text-white drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
               </div>
               
               {/* Info */}
               <h1 className="text-3xl font-bold text-slate-900 mb-1">{userInfo.name}</h1>
               <p className="text-slate-500 font-medium mb-6">{userInfo.role} • {userInfo.location}</p>
               
               {/* Stats */}
               <div className="flex justify-center gap-12 border-t border-b border-slate-100 py-6 mb-8">
                  <div className="text-center">
                     <span className="block text-2xl font-bold text-slate-900">128</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Connections</span>
                  </div>
                  <div className="text-center">
                     <span className="block text-2xl font-bold text-slate-900">45</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Memories</span>
                  </div>
                  <div className="text-center">
                     <span className="block text-2xl font-bold text-green-600">92%</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Health</span>
                  </div>
               </div>

               {/* Buttons */}
               <div className="flex justify-center gap-4">
                  <Button variant="secondary" className="gap-2 px-6" onClick={() => setShowQrModal(true)}>
                     <Share2 size={16} /> Share Card
                  </Button>
                  <Button 
                    className={`gap-2 px-6 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'} text-white`}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                     {isEditing ? <Save size={16} /> : <Settings size={16} />} 
                     {isEditing ? 'Lưu Thay Đổi' : 'Chỉnh Sửa Hồ Sơ'}
                  </Button>
               </div>
            </div>
         </Card>

         {/* Detailed Info Card */}
         <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Profile Information</h3>
               {isEditing && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">EDITING MODE</span>}
            </div>
            
            {isEditing ? (
              <textarea 
                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-600 mb-8 focus:outline-none focus:border-primary-500"
                value={userInfo.bio}
                onChange={(e) => setUserInfo({...userInfo, bio: e.target.value})}
                rows={3}
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed mb-8 italic border-l-4 border-slate-200 pl-4">
                 "{userInfo.bio}"
              </p>
            )}
            
            <div className="space-y-6">
               {/* Contact Section */}
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Contact & Basic Info</h4>
                  <div className="space-y-4">
                     {/* Email */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <Mail size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.email.value} 
                               onChange={(e) => handleValueChange('email', e.target.value)} 
                               className="py-1.5"
                             />
                           ) : (
                             <span className="truncate">{userInfo.email.value}</span>
                           )}
                        </div>
                        {isEditing ? (
                           <select 
                              value={userInfo.email.privacy}
                              onChange={(e) => handlePrivacyChange('email', e.target.value as PrivacyLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                           >
                              <option value="PUBLIC">Public</option>
                              <option value="FRIENDS">Friends</option>
                              <option value="CLOSE_FRIENDS">Close Friends</option>
                              <option value="PRIVATE">Only Me</option>
                           </select>
                        ) : (
                           <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {getPrivacyIcon(userInfo.email.privacy)}
                              <span>{getPrivacyLabel(userInfo.email.privacy)}</span>
                           </div>
                        )}
                     </div>

                     {/* Address */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <MapPin size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.address.value} 
                               onChange={(e) => handleValueChange('address', e.target.value)} 
                               className="py-1.5"
                             />
                           ) : (
                             <span className="truncate">{userInfo.address.value}</span>
                           )}
                        </div>
                        {isEditing ? (
                           <select 
                              value={userInfo.address.privacy}
                              onChange={(e) => handlePrivacyChange('address', e.target.value as PrivacyLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                           >
                              <option value="PUBLIC">Public</option>
                              <option value="FRIENDS">Friends</option>
                              <option value="CLOSE_FRIENDS">Close Friends</option>
                              <option value="PRIVATE">Only Me</option>
                           </select>
                        ) : (
                           <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {getPrivacyIcon(userInfo.address.privacy)}
                              <span>{getPrivacyLabel(userInfo.address.privacy)}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Work & Education */}
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Work & Education</h4>
                  <div className="space-y-4">
                     {/* Job */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <Briefcase size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.job.value} 
                               onChange={(e) => handleValueChange('job', e.target.value)} 
                               className="py-1.5"
                             />
                           ) : (
                             <span className="truncate">{userInfo.job.value}</span>
                           )}
                        </div>
                        {isEditing ? (
                           <select 
                              value={userInfo.job.privacy}
                              onChange={(e) => handlePrivacyChange('job', e.target.value as PrivacyLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                           >
                              <option value="PUBLIC">Public</option>
                              <option value="FRIENDS">Friends</option>
                              <option value="CLOSE_FRIENDS">Close Friends</option>
                           </select>
                        ) : (
                           <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {getPrivacyIcon(userInfo.job.privacy)}
                              <span>{getPrivacyLabel(userInfo.job.privacy)}</span>
                           </div>
                        )}
                     </div>

                     {/* Education */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <GraduationCap size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.education.value} 
                               onChange={(e) => handleValueChange('education', e.target.value)} 
                               className="py-1.5"
                             />
                           ) : (
                             <span className="truncate">{userInfo.education.value}</span>
                           )}
                        </div>
                        {isEditing ? (
                           <select 
                              value={userInfo.education.privacy}
                              onChange={(e) => handlePrivacyChange('education', e.target.value as PrivacyLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                           >
                              <option value="PUBLIC">Public</option>
                              <option value="FRIENDS">Friends</option>
                              <option value="CLOSE_FRIENDS">Close Friends</option>
                           </select>
                        ) : (
                           <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {getPrivacyIcon(userInfo.education.privacy)}
                              <span>{getPrivacyLabel(userInfo.education.privacy)}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Interests */}
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Personal Interests</h4>
                  <div className="space-y-4">
                     {/* Skills */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <Activity size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.skills.value} 
                               onChange={(e) => handleValueChange('skills', e.target.value)} 
                               className="py-1.5"
                             />
                           ) : (
                             <span className="truncate">Skills: {userInfo.skills.value}</span>
                           )}
                        </div>
                        {isEditing ? (
                           <select 
                              value={userInfo.skills.privacy}
                              onChange={(e) => handlePrivacyChange('skills', e.target.value as PrivacyLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                           >
                              <option value="PUBLIC">Public</option>
                              <option value="FRIENDS">Friends</option>
                              <option value="CLOSE_FRIENDS">Close Friends</option>
                           </select>
                        ) : (
                           <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {getPrivacyIcon(userInfo.skills.privacy)}
                              <span>{getPrivacyLabel(userInfo.skills.privacy)}</span>
                           </div>
                        )}
                     </div>

                     {/* Hobbies */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <Palette size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.hobbies.value} 
                               onChange={(e) => handleValueChange('hobbies', e.target.value)} 
                               className="py-1.5"
                             />
                           ) : (
                             <span className="truncate">Hobbies: {userInfo.hobbies.value}</span>
                           )}
                        </div>
                        {isEditing ? (
                           <select 
                              value={userInfo.hobbies.privacy}
                              onChange={(e) => handlePrivacyChange('hobbies', e.target.value as PrivacyLevel)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 focus:outline-none focus:border-primary-500"
                           >
                              <option value="PUBLIC">Public</option>
                              <option value="FRIENDS">Friends</option>
                              <option value="CLOSE_FRIENDS">Close Friends</option>
                           </select>
                        ) : (
                           <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {getPrivacyIcon(userInfo.hobbies.privacy)}
                              <span>{getPrivacyLabel(userInfo.hobbies.privacy)}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

            </div>

            <div className="mt-8 flex flex-wrap gap-2">
               {userInfo.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
            </div>
         </Card>
      </div>

      {/* Sidebar Column */}
      <div className="space-y-6">
         {/* QR Code Card */}
         <Card className="p-8 flex flex-col items-center text-center bg-gradient-to-b from-white to-slate-50">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-6">Your Personal QR</h3>
            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 mb-6 relative group">
               <QrCode size={160} className="text-slate-900" />
               {/* Public Data Count Badge */}
               <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                 {Object.values(userInfo).filter((v: any) => v.privacy === 'PUBLIC').length} Public Items
               </div>
            </div>
            <p className="text-xs text-slate-500 mb-4 px-4">People scanning this will only see information you've marked as <span className="font-bold text-green-600">Public</span>.</p>
            <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowQrModal(true)}>
                  <Share2 size={16} /> Share
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Smartphone size={16} /> Save
                </Button>
            </div>
         </Card>

         {/* Privacy Legend Card */}
         {isEditing && (
            <Card className="p-4 bg-slate-50 border-slate-200">
               <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs mb-3">Privacy Legend</h3>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                     <Globe size={14} className="text-green-500" /> 
                     <span><strong>Public:</strong> Visible to anyone with QR.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                     <Users size={14} className="text-blue-500" /> 
                     <span><strong>Friends:</strong> Tier 1 (Acquaintance) and up.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                     <StarIcon size={14} className="text-purple-500" /> 
                     <span><strong>Close Friends:</strong> Tier 3 (Friend) and up.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                     <Lock size={14} className="text-red-400" /> 
                     <span><strong>Only Me:</strong> Private.</span>
                  </div>
               </div>
            </Card>
         )}
      </div>

      {/* Share QR Modal */}
      <Modal 
        isOpen={showQrModal} 
        onClose={() => setShowQrModal(false)} 
        title="Share Your Profile"
      >
        <div className="text-center space-y-6">
          <div className="bg-white p-4 rounded-xl inline-block shadow-lg border border-slate-100">
             <QrCode size={200} className="text-slate-900" />
          </div>
          <p className="text-slate-600 text-sm">
             Share this QR code or link with new connections. <br/>They will see your <strong>Public</strong> info instantly.
          </p>
          <div className="flex gap-3">
             <Button fullWidth variant="secondary" className="gap-2">
                <Download size={18} /> Save Image
             </Button>
             <Button fullWidth className="gap-2">
                <Copy size={18} /> Copy Link
             </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Profile;