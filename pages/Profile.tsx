import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Badge, Modal, Input } from '../components/ui';
import { Camera, Share2, Settings, Smartphone, Mail, MapPin, Activity, QrCode, Lock, Globe, Eye, EyeOff, Save, Download, Copy, Briefcase, GraduationCap, Palette, Users, HelpCircle, ExternalLink, AlertTriangle, Key, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { supabase, logDbOperation } from '../services/supabase';

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
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ connections: 0, memories: 0 });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // File Input Refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Expanded User Data
  const [userInfo, setUserInfo] = useState({
    name: "User",
    role: "Member",
    location: "",
    avatar: "https://ui-avatars.com/api/?background=random",
    cover: "",
    coverIsImage: false, 
    email: { value: "", privacy: 'PRIVATE' } as UserField,
    address: { value: "", privacy: 'CLOSE_FRIENDS' } as UserField,
    job: { value: "", privacy: 'PUBLIC' } as UserField,
    education: { value: "", privacy: 'FRIENDS' } as UserField,
    skills: { value: "", privacy: 'PUBLIC' } as UserField,
    hobbies: { value: "", privacy: 'FRIENDS' } as UserField,
    bio: "",
    tags: ["MEMBER"],
    uniqueId: "",
    securityCode: ""
  });

  const [editSecurityCode, setEditSecurityCode] = useState("");

  const generateRandomId = () => {
     // Generate 8 char random string (uppercase alphanumeric)
     return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  useEffect(() => {
    const fetchProfile = async () => {
        setLoading(true);
        logDbOperation('Profile', 'Fetching profile...');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                // Fetch Profile Data
                const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                
                // Fetch Counts
                const { count: connCount } = await supabase.from('connections').select('*', { count: 'exact', head: true });
                const { count: memCount } = await supabase.from('memories').select('*', { count: 'exact', head: true });
                
                setCounts({ 
                    connections: connCount || 0, 
                    memories: memCount || 0 
                });

                // Determine Name and Avatar Fallbacks
                const initialName = data?.name || data?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "User";
                const initialAvatar = data?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(initialName)}&background=random`;

                if (data) {
                    logDbOperation('Profile', 'Loaded', data);
                    
                    // Parse Privacy Settings
                    const ps = data.privacy_settings || {};
                    
                    // Check if unique_id needs generation
                    let currentUniqueId = data.unique_id;
                    if (!currentUniqueId) {
                        currentUniqueId = generateRandomId();
                        // Auto-save the new ID
                        await supabase.from('profiles').update({ unique_id: currentUniqueId }).eq('id', user.id);
                    }

                    setUserInfo(prev => ({
                        ...prev,
                        name: initialName,
                        email: { value: user.email || "", privacy: ps.email || 'PRIVATE' },
                        avatar: initialAvatar,
                        bio: data.bio || '',
                        location: data.location || '',
                        role: data.role || 'Member',
                        cover: data.cover_url || "bg-gradient-to-r from-slate-200 to-slate-300",
                        coverIsImage: !!data.cover_url && !data.cover_url.startsWith('bg-'),
                        
                        job: { value: data.job || '', privacy: ps.job || 'PUBLIC' },
                        education: { value: data.education || '', privacy: ps.education || 'FRIENDS' },
                        skills: { value: data.skills || '', privacy: ps.skills || 'PUBLIC' },
                        hobbies: { value: data.hobbies || '', privacy: ps.hobbies || 'FRIENDS' },
                        address: { value: data.location || '', privacy: ps.address || 'CLOSE_FRIENDS' }, // Mapping address to location field for now
                        tags: data.tags && data.tags.length > 0 ? data.tags : ['MEMBER'],
                        uniqueId: currentUniqueId,
                        securityCode: data.security_code || ""
                    }));
                    setEditSecurityCode(data.security_code || "");
                } else {
                    // Initialize from Auth if no profile exists yet
                     setUserInfo(prev => ({
                        ...prev,
                        name: initialName,
                        email: { ...prev.email, value: user.email || "" },
                        avatar: initialAvatar
                    }));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
      setIsEditing(false);
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          logDbOperation('Profile', 'Updating...', userInfo);
          
          // Validate Security Code
          if (editSecurityCode.length > 4) {
              alert("Mã bảo mật tối đa 4 ký tự.");
              return;
          }

          // Construct Privacy Settings JSON
          const privacySettings = {
              email: userInfo.email.privacy,
              address: userInfo.address.privacy,
              job: userInfo.job.privacy,
              education: userInfo.education.privacy,
              skills: userInfo.skills.privacy,
              hobbies: userInfo.hobbies.privacy
          };

          const updates = {
              name: userInfo.name,
              bio: userInfo.bio,
              location: userInfo.location,
              role: userInfo.role,
              // Only save cover if it's a URL (image), otherwise let it be null or handle CSS classes if DB supported
              cover_url: userInfo.coverIsImage ? userInfo.cover : null,
              
              // New Fields
              job: userInfo.job.value,
              education: userInfo.education.value,
              skills: userInfo.skills.value,
              hobbies: userInfo.hobbies.value,
              tags: userInfo.tags,
              privacy_settings: privacySettings,
              
              // Security
              security_code: editSecurityCode,
              
              updated_at: new Date().toISOString()
          };
          
          const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
          if (error) throw error;
          
          setUserInfo(prev => ({ ...prev, securityCode: editSecurityCode }));
          logDbOperation('Profile', 'Update Success');
      } catch (e: any) {
          logDbOperation('Profile', 'Update Failed', null, e);
          alert("Error updating profile: " + e.message);
      }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        // Upload to Storage
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${type}_${Date.now()}.${fileExt}`;
        
        logDbOperation('Profile', `Uploading ${type}...`);
        
        const { error: uploadError } = await supabase.storage
            .from('avatars') // Using 'avatars' bucket for profile images
            .upload(filePath, file);
            
        if(uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        // Update Local State
        setUserInfo(prev => ({
            ...prev,
            [type]: publicUrl,
            ...(type === 'cover' ? { coverIsImage: true } : {})
        }));

        // Immediate DB Update for Avatar/Cover
        const updateField = type === 'avatar' ? 'avatar_url' : 'cover_url';
        await supabase.from('profiles').update({ [updateField]: publicUrl }).eq('id', user.id);

      } catch (err: any) {
         alert("Upload failed: " + err.message);
      }
      
      // Reset input
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
      case 'FRIENDS': return 'Friends';
      case 'CLOSE_FRIENDS': return 'Close Friends';
      case 'PRIVATE': return 'Only Me';
      default: return '';
    }
  };
  
  // --- URL GENERATION LOGIC ---
  const getCleanShareUrl = () => {
     // Use Origin + Pathname to avoid any messy query parameters before the hash
     const origin = window.location.origin;
     const path = window.location.pathname; // This includes '/' or '/index.html'
     
     // Remove trailing slash if it exists to clean up
     const cleanPath = path === '/' ? '' : path.replace(/\/$/, "");
     
     return `${origin}${cleanPath}/#/p/${currentUserId}`;
  };

  const shareLink = getCleanShareUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareLink)}&color=0f172a`;

  // Check if likely in a private environment
  const isPrivateEnv = window.location.hostname.includes('localhost') || 
                       window.location.hostname.includes('127.0.0.1') || 
                       window.location.hostname.includes('usercontent.goog') ||
                       window.location.protocol === 'file:';

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
               {isEditing ? (
                  <div className="max-w-xs mx-auto mb-4 space-y-2">
                     <Input 
                        value={userInfo.name} 
                        onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} 
                        className="text-center font-bold text-lg"
                        placeholder="Your Name"
                     />
                     <Input 
                        value={userInfo.role} 
                        onChange={(e) => setUserInfo({...userInfo, role: e.target.value})} 
                        className="text-center text-sm"
                        placeholder="Role / Title"
                     />
                  </div>
               ) : (
                  <>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">{userInfo.name}</h1>
                    <p className="text-slate-500 font-medium mb-6">{userInfo.role} • {userInfo.location || 'Unknown Location'}</p>
                  </>
               )}
               
               {/* Stats */}
               <div className="flex justify-center gap-16 border-t border-b border-slate-100 py-6 mb-8">
                  <div className="text-center">
                     <span className="block text-2xl font-bold text-slate-900">{counts.connections}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Connections</span>
                  </div>
                  <div className="text-center">
                     <span className="block text-2xl font-bold text-slate-900">{counts.memories}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Memories</span>
                  </div>
               </div>

               {/* Buttons */}
               <div className="flex justify-center gap-4">
                  <Button variant="secondary" className="gap-2 px-6" onClick={() => setShowQrModal(true)}>
                     <Share2 size={16} /> Share Card
                  </Button>
                  <Button 
                    className={`gap-2 px-6 ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-900 hover:bg-slate-800'} text-white`}
                    onClick={() => {
                        if (isEditing) handleSave();
                        else setIsEditing(true);
                    }}
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
                placeholder="Write a short bio..."
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed mb-8 italic border-l-4 border-slate-200 pl-4">
                 "{userInfo.bio || 'No bio yet.'}"
              </p>
            )}
            
            <div className="space-y-6">
               {/* Secure Connection Section - NEW */}
               <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase mb-3 flex items-center gap-2">
                     <ShieldCheck size={16} /> Mã Kết Nối & Bảo Mật
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ID */}
                      <div>
                         <label className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block">ID Của Tôi (8 ký tự)</label>
                         <div className="flex items-center gap-2">
                            <code className="bg-white px-3 py-1.5 rounded border border-indigo-200 font-mono font-bold text-lg tracking-widest text-indigo-900 select-all">
                                {userInfo.uniqueId || "LOADING"}
                            </code>
                            <button onClick={() => { navigator.clipboard.writeText(userInfo.uniqueId); alert('Copied ID!'); }} className="p-2 bg-white rounded border border-indigo-200 text-indigo-500 hover:text-indigo-700">
                                <Copy size={16} />
                            </button>
                         </div>
                         <p className="text-[10px] text-indigo-500 mt-1">Chia sẻ ID này để bạn bè tìm thấy bạn.</p>
                      </div>

                      {/* Code */}
                      <div>
                         <label className="text-[10px] font-bold text-indigo-400 uppercase mb-1 block">Mã Bảo Mật (Tự động kết bạn)</label>
                         {isEditing ? (
                            <Input 
                                value={editSecurityCode} 
                                onChange={(e) => setEditSecurityCode(e.target.value.toUpperCase())}
                                placeholder="VD: 1234, AB..."
                                maxLength={4}
                                className="font-mono text-center tracking-widest uppercase font-bold text-indigo-900 border-indigo-200 focus:border-indigo-500 bg-white"
                            />
                         ) : (
                            <div className="flex items-center gap-2">
                                <div className="bg-white px-3 py-1.5 rounded border border-indigo-200 font-mono font-bold text-lg text-indigo-900 min-w-[80px] text-center">
                                    {userInfo.securityCode ? userInfo.securityCode : <span className="text-slate-300 font-normal text-xs italic">Chưa set</span>}
                                </div>
                                <span className="text-xs text-indigo-400">(Tối đa 4 ký tự)</span>
                            </div>
                         )}
                         <p className="text-[10px] text-indigo-500 mt-1">Nếu bạn bè nhập đúng ID + Mã này, họ sẽ được kết bạn tự động.</p>
                      </div>
                  </div>
               </div>

               {/* Contact Section */}
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Contact & Basic Info</h4>
                  <div className="space-y-4">
                     {/* Email */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <Mail size={18} className="text-slate-400 shrink-0" />
                           <span className="truncate">{userInfo.email.value}</span>
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

                     {/* Address / Location */}
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 text-sm text-slate-600 flex-1 mr-4">
                           <MapPin size={18} className="text-slate-400 shrink-0" />
                           {isEditing ? (
                             <Input 
                               value={userInfo.location} // This maps to both display location and address
                               onChange={(e) => setUserInfo({...userInfo, location: e.target.value})} 
                               className="py-1.5"
                               placeholder="City, Country"
                             />
                           ) : (
                             <span className="truncate">{userInfo.location || 'No location set'}</span>
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
                               placeholder="Software Engineer at Company X"
                             />
                           ) : (
                             <span className="truncate">{userInfo.job.value || 'Not set'}</span>
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
                               placeholder="University of Life"
                             />
                           ) : (
                             <span className="truncate">{userInfo.education.value || 'Not set'}</span>
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
                               placeholder="React, Design, Writing..."
                             />
                           ) : (
                             <span className="truncate">Skills: {userInfo.skills.value || 'None'}</span>
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
                               placeholder="Reading, Hiking, Gaming..."
                             />
                           ) : (
                             <span className="truncate">Hobbies: {userInfo.hobbies.value || 'None'}</span>
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

      {/* Share QR Modal */}
      <Modal 
        isOpen={showQrModal} 
        onClose={() => setShowQrModal(false)} 
        title="Mã QR Cá Nhân"
      >
        <div className="text-center space-y-6">
          <div className="bg-white p-4 rounded-xl inline-block shadow-lg border border-slate-100 relative">
             <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52 object-contain rounded-lg mb-2" />
             {isPrivateEnv && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-bold text-red-500 p-4 text-center border-2 border-red-100 rounded-xl">
                    ⚠️ Môi trường Private/Local.<br/>QR này có thể không hoạt động trên thiết bị khác.
                </div>
             )}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-slate-900 font-bold text-lg">Cách hoạt động</h3>
            <ol className="text-sm text-slate-600 text-left space-y-2 list-decimal pl-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <li>Người khác sử dụng camera điện thoại để quét mã này.</li>
                <li>Họ sẽ được dẫn đến trang <strong>Hồ sơ công khai</strong> của bạn.</li>
                <li>Họ bấm <strong>"Thêm vào danh bạ"</strong> để lưu thông tin.</li>
            </ol>
            
            {/* Warning Box */}
            {isPrivateEnv && (
               <div className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-left">
                  <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                     <strong>Lưu ý:</strong> Bạn đang chạy trên môi trường Development/Preview (Localhost hoặc Cloud Shell). Link này ({window.location.host}) có thể không truy cập được từ bên ngoài hoặc yêu cầu đăng nhập tài khoản Google của bạn.
                  </p>
               </div>
            )}

            <div className="bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between text-xs text-slate-500 gap-2">
                <span className="truncate flex-1 text-left font-mono">{shareLink}</span>
                <button onClick={() => window.open(shareLink, '_blank')} className="text-primary-600 font-bold whitespace-nowrap hover:underline">
                    Thử Link
                </button>
            </div>
          </div>

          <div className="flex gap-3">
             <Button fullWidth variant="secondary" className="gap-2" onClick={() => window.open(qrCodeUrl, '_blank')}>
                <Download size={18} /> Tải Ảnh
             </Button>
             <Button fullWidth className="gap-2" onClick={() => {
                 navigator.clipboard.writeText(shareLink);
                 alert("Đã sao chép liên kết!");
             }}>
                <Copy size={18} /> Sao chép Link
             </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Profile;